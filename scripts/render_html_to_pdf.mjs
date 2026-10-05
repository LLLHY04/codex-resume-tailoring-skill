#!/usr/bin/env node

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { access, mkdir, readFile, readdir, stat, unlink } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  const values = {
    timeout: 30_000,
    maxPages: 2,
    renderer: "chromium",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      values.help = true;
      continue;
    }

    if (!argument.startsWith("--")) {
      throw new Error(`Unexpected argument: ${argument}`);
    }

    const key = argument.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${argument}`);
    }
    index += 1;

    if (key === "input") values.input = value;
    else if (key === "output") values.output = value;
    else if (key === "png-dir") values.pngDir = value;
    else if (key === "executable-path") values.executablePath = value;
    else if (key === "renderer") values.renderer = value;
    else if (key === "weasyprint-python") values.weasyprintPython = value;
    else if (key === "timeout") values.timeout = Number(value);
    else if (key === "max-pages") values.maxPages = Number(value);
    else throw new Error(`Unknown option: ${argument}`);
  }

  if (!Number.isFinite(values.timeout) || values.timeout <= 0) {
    throw new Error("--timeout must be a positive number of milliseconds");
  }
  if (!Number.isInteger(values.maxPages) || values.maxPages <= 0) {
    throw new Error("--max-pages must be a positive integer");
  }
  if (!["chromium", "weasyprint"].includes(values.renderer)) {
    throw new Error("--renderer must be either chromium or weasyprint");
  }

  return values;
}

function usage() {
  return [
    "Usage:",
    "  node render_html_to_pdf.mjs --input <resume.html> --output <resume.pdf> [options]",
    "",
    "Options:",
    "  --png-dir <directory>       Directory for page PNGs (default: <pdf-name>-pages)",
    "  --renderer <name>           Explicit renderer: chromium (default) or weasyprint",
    "  --executable-path <path>    Explicit Chromium or Chrome executable",
    "  --weasyprint-python <path>  Python executable containing WeasyPrint and pypdf",
    "  --timeout <milliseconds>    Navigation and rendering timeout (default: 30000)",
    "  --max-pages <count>         Maximum expected resume pages (default: 2)",
  ].join("\n");
}

function emptyResult(inputPath, outputPath) {
  const renderPlatform = process.platform === "darwin" ? "macos" : process.platform === "win32" ? "windows" : process.platform === "linux" ? "linux" : "unknown";
  return {
    renderer: "chromium/playwright",
    renderer_engine: "chromium",
    renderer_version: null,
    render_platform: renderPlatform,
    target_platform: "unknown",
    target_viewer: "unknown",
    input_path: inputPath ?? null,
    output_path: outputPath ?? null,
    font_check: {
      status: "NOT_RUN",
      document_fonts_status: null,
      computed_font_family: null,
      available_candidates: [],
      actual_fonts: [],
      chinese_required: false,
      chinese_available: null,
    },
    compile_status: "FAILED",
    text_extraction_status: "NOT_RUN",
    viewer_compatibility: {
      viewer: "unknown",
      status: "NOT_TESTED",
      issues: [],
    },
    layout_check: {
      status: "NOT_RUN",
      issues: [],
      page_images: [],
      checks: {},
    },
    page_count: null,
    issues: [],
    success: false,
  };
}

function addIssue(result, code, message, severity = "error", details = undefined) {
  const issue = { code, severity, message };
  if (details !== undefined) issue.details = details;
  result.issues.push(issue);
  return issue;
}

async function fileExists(filePath) {
  try {
    await access(filePath, fsConstants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function isRemoteReference(reference) {
  return /^(?:https?:)?\/\//i.test(reference.trim());
}

function isIgnoredReference(reference) {
  return /^(?:data:|mailto:|tel:|#|javascript:)/i.test(reference.trim());
}

function cleanReference(reference) {
  return reference.trim().replace(/^['"]|['"]$/g, "").split(/[?#]/, 1)[0];
}

function resolveInsideRoot(rootDirectory, reference) {
  const cleaned = cleanReference(reference);
  const decoded = decodeURIComponent(cleaned);
  const resolved = path.resolve(rootDirectory, decoded.replace(/^\//, ""));
  const relative = path.relative(rootDirectory, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Resource escapes the HTML package: ${reference}`);
  }
  return resolved;
}

function collectHtmlResourceReferences(html) {
  const references = [];
  const patterns = [
    /<link\b[^>]*\brel\s*=\s*["'][^"']*stylesheet[^"']*["'][^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi,
    /<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*\brel\s*=\s*["'][^"']*stylesheet[^"']*["'][^>]*>/gi,
    /<(?:img|source|video|audio|embed|object)\b[^>]*\b(?:src|poster|data)\s*=\s*["']([^"']+)["'][^>]*>/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) references.push(match[1]);
  }
  return [...new Set(references)];
}

function collectCssResourceReferences(css) {
  const references = [];
  for (const match of css.matchAll(/url\(\s*([^)]+?)\s*\)/gi)) references.push(match[1]);
  for (const match of css.matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/gi)) references.push(match[1]);
  return [...new Set(references)];
}

async function preflightPackage(inputPath, result) {
  if (!(await fileExists(inputPath))) {
    addIssue(result, "input_html_missing", `Input HTML does not exist or is not readable: ${inputPath}`);
    return null;
  }

  const rootDirectory = path.dirname(inputPath);
  const html = await readFile(inputPath, "utf8");
  if (/<script\b/i.test(html)) {
    addIssue(result, "javascript_not_allowed", "The HTML contains a script element; the resume package must not depend on JavaScript.");
  }
  if (/\{\{[^}]+\}\}/.test(html)) {
    addIssue(result, "unresolved_placeholders", "The HTML still contains unresolved template placeholders.");
  }

  const checkedFiles = [inputPath];
  const pending = collectHtmlResourceReferences(html).map((reference) => ({
    reference,
    baseDirectory: rootDirectory,
  }));
  const visited = new Set();

  while (pending.length > 0) {
    const item = pending.shift();
    if (!item || isIgnoredReference(item.reference)) continue;
    if (isRemoteReference(item.reference) || /^file:/i.test(item.reference)) {
      addIssue(result, "external_resource_disallowed", `Remote or file URL is not allowed: ${item.reference}`);
      continue;
    }

    let resourcePath;
    try {
      resourcePath = resolveInsideRoot(rootDirectory, path.relative(rootDirectory, item.baseDirectory) + path.sep + cleanReference(item.reference));
    } catch (error) {
      addIssue(result, "resource_outside_package", error.message);
      continue;
    }

    if (visited.has(resourcePath)) continue;
    visited.add(resourcePath);
    if (!(await fileExists(resourcePath))) {
      addIssue(result, "local_resource_missing", `Referenced local resource is missing: ${resourcePath}`);
      continue;
    }
    checkedFiles.push(resourcePath);

    if (path.extname(resourcePath).toLowerCase() === ".css") {
      const css = await readFile(resourcePath, "utf8");
      for (const reference of collectCssResourceReferences(css)) {
        pending.push({ reference, baseDirectory: path.dirname(resourcePath) });
      }
    }
  }

  return { rootDirectory, html, checkedFiles };
}

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".otf": "font/otf",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ttf": "font/ttf",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
  }[extension] ?? "application/octet-stream";
}

async function startLocalServer(rootDirectory) {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "");
      const requestedPath = path.resolve(rootDirectory, relativePath);
      const relative = path.relative(rootDirectory, requestedPath);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        response.writeHead(403).end("Forbidden");
        return;
      }

      const metadata = await stat(requestedPath);
      if (!metadata.isFile()) {
        response.writeHead(404).end("Not found");
        return;
      }
      const body = await readFile(requestedPath);
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Length": body.length,
        "Content-Type": contentType(requestedPath),
      });
      response.end(body);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Unable to determine localhost server port");
  return {
    server,
    origin: `http://127.0.0.1:${address.port}`,
  };
}

async function stopLocalServer(server) {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
}

function runCommand(command, args, timeout) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    const timer = setTimeout(() => child.kill("SIGKILL"), timeout);
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", (error) => {
      clearTimeout(timer);
      resolve({ code: null, error, stdout: "", stderr: "" });
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      resolve({
        code,
        error: null,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });
  });
}

async function loadPlaywright() {
  try {
    return require("playwright");
  } catch (error) {
    const wrapped = new Error("Playwright is not installed or cannot be resolved. Install Playwright and Chromium before rendering.");
    wrapped.cause = error;
    throw wrapped;
  }
}

async function inspectActualFonts(context, page) {
  const client = await context.newCDPSession(page);
  await client.send("DOM.enable");
  await client.send("CSS.enable");
  const { root } = await client.send("DOM.getDocument", { depth: -1, pierce: true });
  const { nodeId } = await client.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: "#__resume_pdf_font_probe",
  });
  if (!nodeId) return [];
  const response = await client.send("CSS.getPlatformFontsForNode", { nodeId });
  return response.fonts.map((font) => ({
    family_name: font.familyName,
    glyph_count: font.glyphCount,
    is_custom_font: font.isCustomFont,
    postscript_name: font.postScriptName,
  }));
}

async function inspectDom(page) {
  return page.evaluate(() => {
    const allElements = [...document.body.querySelectorAll("*")];
    const overflow = [];
    const clipped = [];

    for (const element of allElements) {
      const style = getComputedStyle(element);
      const rectangle = element.getBoundingClientRect();
      if (rectangle.width <= 0 || rectangle.height <= 0) continue;
      if (element.scrollWidth > element.clientWidth + 1) {
        overflow.push({
          element: element.tagName.toLowerCase(),
          class_name: String(element.className || ""),
          client_width: element.clientWidth,
          scroll_width: element.scrollWidth,
        });
      }
      const clipsX = ["hidden", "clip"].includes(style.overflowX) && element.scrollWidth > element.clientWidth + 1;
      const clipsY = ["hidden", "clip"].includes(style.overflowY) && element.scrollHeight > element.clientHeight + 1;
      if (clipsX || clipsY) {
        clipped.push({
          element: element.tagName.toLowerCase(),
          class_name: String(element.className || ""),
          clips_x: clipsX,
          clips_y: clipsY,
        });
      }
    }

    const structural = [...document.querySelectorAll(".resume-header, .resume-section, .entry")];
    const overlaps = [];
    for (let leftIndex = 0; leftIndex < structural.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < structural.length; rightIndex += 1) {
        const left = structural[leftIndex];
        const right = structural[rightIndex];
        if (left.contains(right) || right.contains(left)) continue;
        const a = left.getBoundingClientRect();
        const b = right.getBoundingClientRect();
        const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (width > 1 && height > 1) {
          overlaps.push({
            first: `${left.tagName.toLowerCase()}.${String(left.className || "")}`,
            second: `${right.tagName.toLowerCase()}.${String(right.className || "")}`,
            overlap_width: width,
            overlap_height: height,
          });
        }
      }
    }

    return {
      body_text: document.body.innerText,
      clipped,
      document_fonts_status: document.fonts.status,
      external_resources: performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((url) => {
          try {
            const parsed = new URL(url);
            return parsed.hostname !== "127.0.0.1";
          } catch {
            return true;
          }
        }),
      overlaps,
      overflow,
      page_scroll_width: document.documentElement.scrollWidth,
      page_client_width: document.documentElement.clientWidth,
    };
  });
}

async function inspectFonts(page, context) {
  const fontData = await page.evaluate(async () => {
    await document.fonts.ready;
    const candidateFonts = [
      "PingFang SC",
      "Noto Sans CJK SC",
      "Microsoft YaHei",
      "Arial Unicode MS",
    ];
    const probe = document.createElement("span");
    probe.id = "__resume_pdf_font_probe";
    probe.textContent = "中文字体测试 English C++ R&D A/B 100%";
    probe.style.cssText = [
      "position:fixed",
      "left:-10000px",
      "top:0",
      "font-size:16px",
      "font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Segoe UI','Noto Sans CJK SC','Microsoft YaHei',Arial,sans-serif",
      "white-space:nowrap",
    ].join(";");
    document.body.appendChild(probe);
    return {
      available_candidates: candidateFonts.filter((font) => document.fonts.check(`16px "${font}"`, "中文字体测试")),
      computed_font_family: getComputedStyle(probe).fontFamily,
      document_fonts_status: document.fonts.status,
    };
  });

  let actualFonts = [];
  try {
    actualFonts = await inspectActualFonts(context, page);
  } catch {
    actualFonts = [];
  }
  return { ...fontData, actual_fonts: actualFonts };
}

function parsePdfInfo(text) {
  const pages = text.match(/^Pages:\s+(\d+)$/m);
  const pageSize = text.match(/^Page size:\s+(.+)$/m);
  return {
    page_count: pages ? Number(pages[1]) : null,
    page_size: pageSize ? pageSize[1].trim() : null,
  };
}

async function extractPdfText(pdfPath) {
  try {
    const modulePath = require.resolve("pdfjs-dist/legacy/build/pdf.mjs");
    const pdfjs = await import(pathToFileURL(modulePath).href);
    const data = new Uint8Array(await readFile(pdfPath));
    const document = await pdfjs.getDocument({ data, disableWorker: true, useSystemFonts: true }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str ?? "").join(" "));
    }
    return pages;
  } catch {
    return null;
  }
}

function tokenCoverage(sourceText, renderedText, pattern) {
  const source = new Set(sourceText.match(pattern) ?? []);
  if (source.size === 0) return { required: false, coverage: 1, missing: [] };
  const rendered = new Set(renderedText.match(pattern) ?? []);
  const missing = [...source].filter((token) => !rendered.has(token));
  return {
    required: true,
    coverage: (source.size - missing.length) / source.size,
    missing: missing.slice(0, 20),
  };
}

async function renderPdfPages(pdfPath, pngDirectory, timeout) {
  await mkdir(pngDirectory, { recursive: true });
  for (const name of await readdir(pngDirectory)) {
    if (/^page-\d+\.png$/i.test(name)) await unlink(path.join(pngDirectory, name));
  }
  const prefix = path.join(pngDirectory, "page");
  const render = await runCommand("pdftoppm", ["-png", "-r", "144", pdfPath, prefix], timeout);
  if (render.error || render.code !== 0) {
    return { error: render.error?.message ?? (render.stderr.trim() || "pdftoppm failed"), images: [] };
  }
  const images = (await readdir(pngDirectory))
    .filter((name) => /^page-\d+\.png$/i.test(name))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .map((name) => path.join(pngDirectory, name));
  return { error: null, images };
}

async function analyzePageImages(imagePaths) {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    return null;
  }

  const analyses = [];
  for (const imagePath of imagePaths) {
    const { data, info } = await sharp(imagePath).greyscale().raw().toBuffer({ resolveWithObject: true });
    let inkPixels = 0;
    let edgeInkPixels = 0;
    const edge = Math.max(4, Math.round(Math.min(info.width, info.height) * 0.004));
    for (let y = 0; y < info.height; y += 1) {
      for (let x = 0; x < info.width; x += 1) {
        const value = data[y * info.width + x];
        if (value < 245) {
          inkPixels += 1;
          if (x < edge || y < edge || x >= info.width - edge || y >= info.height - edge) edgeInkPixels += 1;
        }
      }
    }
    analyses.push({
      path: imagePath,
      width: info.width,
      height: info.height,
      ink_ratio: inkPixels / (info.width * info.height),
      edge_ink_ratio: edgeInkPixels / Math.max(inkPixels, 1),
      appears_blank: inkPixels / (info.width * info.height) < 0.0005,
      possible_edge_clipping: edgeInkPixels / Math.max(inkPixels, 1) > 0.002,
    });
  }
  return analyses;
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    const result = emptyResult(null, null);
    addIssue(result, "invalid_arguments", error.message);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = 1;
    return;
  }

  if (options.help) {
    console.log(usage());
    return;
  }
  if (!options.input || !options.output) {
    const result = emptyResult(options.input ?? null, options.output ?? null);
    addIssue(result, "missing_arguments", "Both --input and --output are required.");
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = 1;
    return;
  }

  const inputPath = path.resolve(options.input);
  const outputPath = path.resolve(options.output);
  const pngDirectory = path.resolve(options.pngDir ?? path.join(path.dirname(outputPath), `${path.basename(outputPath, path.extname(outputPath))}-pages`));

  if (options.renderer === "weasyprint") {
    const python = options.weasyprintPython ?? process.env.WEASYPRINT_PYTHON ?? "python3";
    const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "render_html_to_pdf_weasyprint.py");
    const pythonArgs = [
      scriptPath,
      "--input",
      inputPath,
      "--output",
      outputPath,
      "--png-dir",
      pngDirectory,
      "--max-pages",
      String(options.maxPages),
      "--timeout",
      String(Math.ceil(options.timeout / 1000)),
    ];
    const rendered = await runCommand(python, pythonArgs, options.timeout * 2);
    if (rendered.stdout.trim()) {
      console.log(rendered.stdout.trim());
    } else {
      const failure = emptyResult(inputPath, outputPath);
      failure.renderer = "weasyprint";
      failure.renderer_engine = "weasyprint";
      addIssue(
        failure,
        "weasyprint_unavailable",
        "The explicitly selected WeasyPrint renderer could not be started. No fallback renderer was used.",
        "error",
        rendered.error?.message ?? (rendered.stderr.trim() || `Process exited with code ${rendered.code}`),
      );
      failure.layout_check.issues = failure.issues;
      console.log(JSON.stringify(failure, null, 2));
    }
    if (rendered.code !== 0) process.exitCode = 1;
    return;
  }

  const result = emptyResult(inputPath, outputPath);
  let browser;
  let server;

  try {
    const packageData = await preflightPackage(inputPath, result);
    if (!packageData || result.issues.some((issue) => issue.severity === "error")) {
      throw new Error("HTML package preflight failed");
    }
    result.font_check.chinese_required = /[\u3400-\u9fff]/u.test(packageData.html);
    result.layout_check.checks.local_resources = {
      status: "PASS",
      checked_files: packageData.checkedFiles,
    };

    const { chromium } = await loadPlaywright();
    const executablePath = options.executablePath ?? process.env.CHROMIUM_EXECUTABLE_PATH;
    try {
      browser = await chromium.launch({
        headless: true,
        ...(executablePath ? { executablePath } : {}),
      });
    } catch (error) {
      addIssue(
        result,
        "chromium_unavailable",
        "Chromium could not be launched. No fallback renderer was used.",
        "error",
        String(error.message).slice(0, 8_000),
      );
      throw error;
    }

    result.renderer_version = browser.version();
    const local = await startLocalServer(packageData.rootDirectory);
    server = local.server;
    const context = await browser.newContext({ viewport: { width: 1280, height: 1600 } });
    const page = await context.newPage();
    const failedRequests = [];
    const consoleErrors = [];

    page.on("requestfailed", (request) => failedRequests.push({ url: request.url(), failure: request.failure()?.errorText ?? "unknown" }));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await page.route("**/*", async (route) => {
      const requestUrl = new URL(route.request().url());
      if (requestUrl.protocol === "data:" || requestUrl.protocol === "blob:") {
        await route.continue();
        return;
      }
      if (requestUrl.protocol !== "http:" || requestUrl.hostname !== "127.0.0.1") {
        await route.abort("blockedbyclient");
        return;
      }
      await route.continue();
    });

    const relativeInput = path.relative(packageData.rootDirectory, inputPath).split(path.sep).map(encodeURIComponent).join("/");
    const pageUrl = `${local.origin}/${relativeInput}`;
    const response = await page.goto(pageUrl, { waitUntil: "networkidle", timeout: options.timeout });
    if (!response?.ok()) throw new Error(`HTML request failed with status ${response?.status() ?? "unknown"}`);

    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => document.fonts.ready);

    const sourceHasChinese = /[\u3400-\u9fff]/u.test(await page.locator("body").innerText());
    const fontData = await inspectFonts(page, context);
    const actualFontFamilies = fontData.actual_fonts.filter((font) => font.glyph_count > 0).map((font) => font.family_name);
    const actualChineseFont = actualFontFamilies.some((family) => /PingFang|Noto.*CJK|YaHei|Songti|Heiti|Hiragino|SimSun/i.test(family));
    const chineseAvailable = !sourceHasChinese || actualChineseFont || (fontData.actual_fonts.length === 0 && fontData.available_candidates.length > 0);
    result.font_check = {
      status: chineseAvailable ? "PASS" : "FAIL",
      document_fonts_status: fontData.document_fonts_status,
      computed_font_family: fontData.computed_font_family,
      available_candidates: fontData.available_candidates,
      actual_fonts: fontData.actual_fonts,
      chinese_required: sourceHasChinese,
      chinese_available: chineseAvailable,
    };
    if (!chineseAvailable) addIssue(result, "chinese_font_unavailable", "No usable Chinese font was detected by Chromium.");

    const dom = await inspectDom(page);
    result.layout_check.checks.dom = {
      horizontal_overflow: dom.overflow,
      clipped_elements: dom.clipped,
      overlapping_structural_elements: dom.overlaps,
      external_resources: dom.external_resources,
      failed_requests: failedRequests,
      console_errors: consoleErrors,
    };
    if (dom.overflow.length > 0) addIssue(result, "text_overflow", "One or more elements overflow horizontally.", "error", dom.overflow);
    if (dom.clipped.length > 0) addIssue(result, "clipped_content", "One or more elements clip overflowing content.", "error", dom.clipped);
    if (dom.overlaps.length > 0) addIssue(result, "overlapping_content", "Structural resume blocks overlap.", "error", dom.overlaps);
    if (dom.external_resources.length > 0) addIssue(result, "external_resource_loaded", "The rendered page loaded an external resource.", "error", dom.external_resources);
    if (failedRequests.length > 0) addIssue(result, "resource_request_failed", "One or more resource requests failed.", "error", failedRequests);
    if (consoleErrors.length > 0) addIssue(result, "browser_console_error", "The rendered page produced browser console errors.", "warning", consoleErrors);

    await mkdir(path.dirname(outputPath), { recursive: true });
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    if (!(await fileExists(outputPath)) || (await stat(outputPath)).size === 0) {
      throw new Error("Chromium did not create a non-empty PDF");
    }
    result.compile_status = "SUCCESS";

    const pdfInfoProcess = await runCommand("pdfinfo", [outputPath], options.timeout);
    if (pdfInfoProcess.error || pdfInfoProcess.code !== 0) {
      addIssue(result, "pdfinfo_unavailable", "PDF metadata could not be inspected.", "error", pdfInfoProcess.error?.message ?? pdfInfoProcess.stderr.trim());
    } else {
      const pdfInfo = parsePdfInfo(pdfInfoProcess.stdout);
      result.page_count = pdfInfo.page_count;
      result.layout_check.checks.pdf_metadata = pdfInfo;
      if (!pdfInfo.page_count || pdfInfo.page_count < 1) addIssue(result, "invalid_page_count", "The generated PDF has no readable pages.");
      if (pdfInfo.page_count && pdfInfo.page_count > options.maxPages) {
        addIssue(result, "unreasonable_page_count", `The PDF has ${pdfInfo.page_count} pages; the configured resume limit is ${options.maxPages}.`);
      }
      if (pdfInfo.page_size && !/A4|595(?:\.|\s).*842|595\.\d+\s+x\s+841\.\d+/i.test(pdfInfo.page_size)) {
        addIssue(result, "unexpected_page_size", `The PDF page size is not recognized as A4: ${pdfInfo.page_size}`);
      }
    }

    const pageRender = await renderPdfPages(outputPath, pngDirectory, options.timeout);
    result.layout_check.page_images = pageRender.images;
    result.layout_check.checks.renderer_independent_render = {
      engine: "poppler",
      status: pageRender.error ? "FAIL" : "PASS",
      page_images: pageRender.images.length,
    };
    if (pageRender.error) {
      addIssue(result, "page_render_failed", "PDF pages could not be converted to PNG for inspection.", "error", pageRender.error);
    } else if (result.page_count !== null && pageRender.images.length !== result.page_count) {
      addIssue(result, "page_image_count_mismatch", "The number of rendered page images does not match the PDF page count.", "error", {
        page_count: result.page_count,
        page_images: pageRender.images.length,
      });
    }

    const imageAnalysis = await analyzePageImages(pageRender.images);
    result.layout_check.checks.page_images = imageAnalysis;
    if (!imageAnalysis) {
      addIssue(result, "image_analysis_unavailable", "Page PNGs were created, but pixel-level blank-page and edge-clipping checks could not run.");
    } else {
      for (let index = 0; index < imageAnalysis.length; index += 1) {
        if (imageAnalysis[index].appears_blank) addIssue(result, "blank_page", `PDF page ${index + 1} appears blank.`);
        if (imageAnalysis[index].possible_edge_clipping) addIssue(result, "possible_edge_clipping", `PDF page ${index + 1} has content touching the page edge.`);
      }
    }

    const pdfPages = await extractPdfText(outputPath);
    result.text_extraction_status = pdfPages ? "PASS" : "FAIL";
    result.layout_check.checks.pdf_text_extraction = result.text_extraction_status;
    if (!pdfPages) {
      addIssue(result, "pdf_text_extraction_unavailable", "PDF text could not be extracted to verify characters and truncation.");
    } else {
      const pdfText = pdfPages.join("\n");
      const chineseCoverage = tokenCoverage(dom.body_text, pdfText, /[\u3400-\u9fff]/gu);
      const englishCoverage = tokenCoverage(dom.body_text, pdfText, /[A-Za-z][A-Za-z0-9+.#/-]{1,}/g);
      const specialCoverage = tokenCoverage(dom.body_text, pdfText, /[+&@%/#]/g);
      result.layout_check.checks.text_coverage = {
        chinese: chineseCoverage,
        english: englishCoverage,
        special_characters: specialCoverage,
        characters_per_page: pdfPages.map((text) => text.replace(/\s+/g, "").length),
      };
      if (chineseCoverage.required && chineseCoverage.coverage < 0.95) addIssue(result, "chinese_character_loss", "Chinese characters are missing from extracted PDF text.", "error", chineseCoverage);
      if (englishCoverage.required && englishCoverage.coverage < 0.9) addIssue(result, "english_text_loss", "English text is missing from extracted PDF text.", "error", englishCoverage);
      if (specialCoverage.required && specialCoverage.coverage < 1) addIssue(result, "special_character_loss", "One or more special characters are missing from extracted PDF text.", "error", specialCoverage);
      for (let index = 0; index < pdfPages.length; index += 1) {
        if (pdfPages[index].replace(/\s+/g, "").length === 0) addIssue(result, "blank_page_text", `PDF page ${index + 1} has no extractable text.`);
      }
    }

    result.layout_check.issues = result.issues;
    result.layout_check.status = result.issues.some((issue) => issue.severity === "error") ? "FAIL" : "PASS";
    result.success = result.compile_status === "SUCCESS" && result.layout_check.status === "PASS";
  } catch (error) {
    if (!result.issues.some((issue) => issue.code === "chromium_unavailable") && !result.issues.some((issue) => issue.code === "input_html_missing")) {
      addIssue(result, "render_failed", error.message);
    }
    result.layout_check.issues = result.issues;
    if (result.compile_status === "SUCCESS") result.layout_check.status = "FAIL";
  } finally {
    await stopLocalServer(server);
    if (browser) await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
  if (!result.success) process.exitCode = 1;
}

await main();
