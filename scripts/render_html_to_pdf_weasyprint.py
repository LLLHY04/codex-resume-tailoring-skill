#!/usr/bin/env python3
"""Render a local resume HTML package to PDF with an explicitly selected WeasyPrint engine."""

from __future__ import annotations

import argparse
import importlib.metadata
import json
import logging
import re
import shutil
import subprocess
import sys
import platform
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse


CJK_PATTERN = re.compile(r"[\u3400-\u9fff]")
ENGLISH_PATTERN = re.compile(r"[A-Za-z][A-Za-z0-9+.#/-]{1,}")
SPECIAL_PATTERN = re.compile(r"[+&@%/#]")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render a local resume HTML package with WeasyPrint.")
    parser.add_argument("--input", required=True, help="Path to the filled resume HTML file")
    parser.add_argument("--output", required=True, help="Path for the generated PDF")
    parser.add_argument("--png-dir", help="Directory for rendered page PNGs")
    parser.add_argument("--max-pages", type=int, default=2, help="Maximum expected resume pages")
    parser.add_argument("--timeout", type=int, default=30, help="Command timeout in seconds")
    return parser.parse_args()


def empty_result(input_path: Path, output_path: Path) -> dict[str, Any]:
    platform_name = {"Darwin": "macos", "Windows": "windows", "Linux": "linux"}.get(platform.system(), "unknown")
    return {
        "renderer": "weasyprint",
        "renderer_engine": "weasyprint",
        "renderer_version": None,
        "render_platform": platform_name,
        "target_platform": "unknown",
        "target_viewer": "unknown",
        "input_path": str(input_path),
        "output_path": str(output_path),
        "font_check": {
            "status": "NOT_RUN",
            "available_candidates": [],
            "resolved_fonts": [],
            "chinese_required": False,
            "chinese_available": None,
        },
        "compile_status": "FAILED",
        "text_extraction_status": "NOT_RUN",
        "viewer_compatibility": {
            "viewer": "unknown",
            "status": "NOT_TESTED",
            "issues": [],
        },
        "layout_check": {
            "status": "NOT_RUN",
            "issues": [],
            "page_images": [],
            "checks": {},
        },
        "page_count": None,
        "issues": [],
        "success": False,
    }


def add_issue(
    result: dict[str, Any],
    code: str,
    message: str,
    severity: str = "error",
    details: Any | None = None,
) -> None:
    issue: dict[str, Any] = {"code": code, "severity": severity, "message": message}
    if details is not None:
        issue["details"] = details
    result["issues"].append(issue)


class ResumeHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_body = False
        self.skip_depth = 0
        self.resources: list[str] = []
        self.text: list[str] = []
        self.has_script = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag == "body":
            self.in_body = True
        if tag in {"script", "style"}:
            self.skip_depth += 1
        if tag == "script":
            self.has_script = True
        if tag == "link" and "stylesheet" in (attributes.get("rel") or "").lower():
            if attributes.get("href"):
                self.resources.append(attributes["href"])
        if tag in {"img", "source", "video", "audio", "embed", "object"}:
            for name in ("src", "poster", "data"):
                if attributes.get(name):
                    self.resources.append(attributes[name])

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"} and self.skip_depth:
            self.skip_depth -= 1
        if tag == "body":
            self.in_body = False

    def handle_data(self, data: str) -> None:
        if self.in_body and self.skip_depth == 0 and data.strip():
            self.text.append(data.strip())


def is_remote(reference: str) -> bool:
    parsed = urlparse(reference.strip())
    return parsed.scheme in {"http", "https"} or reference.strip().startswith("//")


def ignored_reference(reference: str) -> bool:
    return reference.strip().lower().startswith(("data:", "mailto:", "tel:", "#", "javascript:"))


def resolve_resource(root: Path, base: Path, reference: str) -> Path:
    parsed = urlparse(reference.strip().strip("'\""))
    if parsed.scheme == "file":
        candidate = Path(unquote(parsed.path)).resolve()
    elif parsed.scheme:
        raise ValueError(f"Unsupported resource scheme: {reference}")
    else:
        candidate = (base / unquote(parsed.path)).resolve()
    try:
        candidate.relative_to(root)
    except ValueError as exc:
        raise ValueError(f"Resource escapes the HTML package: {reference}") from exc
    return candidate


def css_references(css: str) -> list[str]:
    references = re.findall(r"url\(\s*([^)]+?)\s*\)", css, flags=re.IGNORECASE)
    references.extend(re.findall(r"@import\s+(?:url\()?\s*['\"]([^'\"]+)['\"]", css, flags=re.IGNORECASE))
    return list(dict.fromkeys(reference.strip().strip("'\"") for reference in references))


def preflight_package(input_path: Path, result: dict[str, Any]) -> tuple[Path, str, str, list[Path]] | None:
    if not input_path.is_file():
        add_issue(result, "input_html_missing", f"Input HTML does not exist: {input_path}")
        return None
    html = input_path.read_text(encoding="utf-8")
    parser = ResumeHTMLParser()
    parser.feed(html)
    body_text = " ".join(parser.text)
    result["font_check"]["chinese_required"] = bool(CJK_PATTERN.search(body_text))
    if parser.has_script:
        add_issue(result, "javascript_not_allowed", "The resume HTML package must not depend on JavaScript.")
    if re.search(r"\{\{[^}]+\}\}", html):
        add_issue(result, "unresolved_placeholders", "The HTML contains unresolved template placeholders.")

    root = input_path.parent.resolve()
    checked = [input_path]
    pending = [(root, reference) for reference in parser.resources]
    visited: set[Path] = set()
    while pending:
        base, reference = pending.pop(0)
        if ignored_reference(reference):
            continue
        if is_remote(reference):
            add_issue(result, "external_resource_disallowed", f"Remote resource is not allowed: {reference}")
            continue
        try:
            resource = resolve_resource(root, base, reference)
        except ValueError as exc:
            add_issue(result, "resource_outside_package", str(exc))
            continue
        if resource in visited:
            continue
        visited.add(resource)
        if not resource.is_file():
            add_issue(result, "local_resource_missing", f"Referenced local resource is missing: {resource}")
            continue
        checked.append(resource)
        if resource.suffix.lower() == ".css":
            css = resource.read_text(encoding="utf-8")
            pending.extend((resource.parent, reference) for reference in css_references(css))

    return root, html, body_text, checked


def run_command(command: list[str], timeout: int) -> subprocess.CompletedProcess[str] | None:
    try:
        return subprocess.run(command, text=True, capture_output=True, timeout=timeout, check=False)
    except (OSError, subprocess.TimeoutExpired):
        return None


def check_fonts(chinese_required: bool) -> dict[str, Any]:
    candidates = ["PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", "Arial Unicode MS"]
    resolved: list[dict[str, str]] = []
    fc_match = shutil.which("fc-match")
    if fc_match:
        for candidate in candidates:
            process = run_command([fc_match, "-f", "%{family}\n", candidate], 10)
            family = process.stdout.splitlines()[0].strip() if process and process.returncode == 0 and process.stdout else ""
            resolved.append({"requested": candidate, "resolved": family})
    recognized = [
        item["requested"]
        for item in resolved
        if re.search(r"PingFang|Noto.*CJK|YaHei|Songti|Heiti|Hiragino|SimSun|蘋方|苹方|雅黑", item["resolved"], re.IGNORECASE)
    ]
    available = not chinese_required or bool(recognized)
    return {
        "status": "PASS" if available else "FAIL",
        "available_candidates": recognized,
        "resolved_fonts": resolved,
        "chinese_required": chinese_required,
        "chinese_available": available,
    }


def token_coverage(source: str, rendered: str, pattern: re.Pattern[str]) -> dict[str, Any]:
    source_tokens = set(pattern.findall(source))
    if not source_tokens:
        return {"required": False, "coverage": 1.0, "missing": []}
    rendered_tokens = set(pattern.findall(rendered))
    missing = sorted(source_tokens - rendered_tokens)
    return {
        "required": True,
        "coverage": (len(source_tokens) - len(missing)) / len(source_tokens),
        "missing": missing[:20],
    }


def render_pages(pdf_path: Path, png_dir: Path, timeout: int) -> tuple[list[Path], str | None]:
    executable = shutil.which("pdftoppm")
    if not executable:
        return [], "pdftoppm is unavailable"
    png_dir.mkdir(parents=True, exist_ok=True)
    for existing in png_dir.glob("page-*.png"):
        existing.unlink()
    process = run_command([executable, "-png", "-r", "144", str(pdf_path), str(png_dir / "page")], timeout)
    if not process or process.returncode != 0:
        return [], (process.stderr.strip() if process else "pdftoppm failed")
    return sorted(png_dir.glob("page-*.png"), key=lambda item: int(re.search(r"(\d+)$", item.stem).group(1))), None


def analyze_images(paths: list[Path]) -> list[dict[str, Any]] | None:
    try:
        from PIL import Image
    except ImportError:
        return None
    analyses: list[dict[str, Any]] = []
    for image_path in paths:
        image = Image.open(image_path).convert("L")
        histogram = image.histogram()
        ink_pixels = sum(histogram[:245])
        total_pixels = image.width * image.height
        edge = max(4, round(min(image.width, image.height) * 0.004))
        edge_regions = [
            image.crop((0, 0, image.width, edge)),
            image.crop((0, image.height - edge, image.width, image.height)),
            image.crop((0, edge, edge, image.height - edge)),
            image.crop((image.width - edge, edge, image.width, image.height - edge)),
        ]
        edge_ink = sum(sum(region.histogram()[:245]) for region in edge_regions)
        analyses.append(
            {
                "path": str(image_path),
                "width": image.width,
                "height": image.height,
                "ink_ratio": ink_pixels / total_pixels,
                "edge_ink_ratio": edge_ink / max(ink_pixels, 1),
                "appears_blank": ink_pixels / total_pixels < 0.0005,
                "possible_edge_clipping": edge_ink / max(ink_pixels, 1) > 0.002,
            }
        )
    return analyses


class WarningCollector(logging.Handler):
    def __init__(self) -> None:
        super().__init__(logging.WARNING)
        self.messages: list[str] = []

    def emit(self, record: logging.LogRecord) -> None:
        self.messages.append(self.format(record))


def main() -> int:
    args = parse_args()
    input_path = Path(args.input).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()
    png_dir = Path(args.png_dir).expanduser().resolve() if args.png_dir else output_path.with_suffix("").with_name(f"{output_path.stem}-pages")
    result = empty_result(input_path, output_path)
    if args.max_pages <= 0:
        add_issue(result, "invalid_arguments", "--max-pages must be positive")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 1

    package = preflight_package(input_path, result)
    if package is None or any(issue["severity"] == "error" for issue in result["issues"]):
        result["layout_check"]["issues"] = result["issues"]
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 1
    root, _, source_text, checked_files = package
    result["layout_check"]["checks"]["local_resources"] = {
        "status": "PASS",
        "checked_files": [str(item) for item in checked_files],
    }

    try:
        from pypdf import PdfReader
        from weasyprint import HTML, default_url_fetcher
    except ImportError as exc:
        add_issue(result, "weasyprint_dependencies_missing", "WeasyPrint and pypdf must be installed in the selected Python environment.", details=str(exc))
        result["layout_check"]["issues"] = result["issues"]
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 1

    result["renderer_version"] = importlib.metadata.version("weasyprint")
    result["font_check"] = check_fonts(result["font_check"]["chinese_required"])
    if result["font_check"]["status"] == "FAIL":
        add_issue(result, "chinese_font_unavailable", "Fontconfig did not resolve a recognized Chinese font.")

    def local_fetcher(url: str, *fetcher_args: Any, **fetcher_kwargs: Any) -> dict[str, Any]:
        parsed = urlparse(url)
        if parsed.scheme in {"http", "https"}:
            raise ValueError(f"Remote resource blocked: {url}")
        if parsed.scheme == "file":
            candidate = Path(unquote(parsed.path)).resolve()
            try:
                candidate.relative_to(root)
            except ValueError as exc:
                raise ValueError(f"Resource escapes the HTML package: {url}") from exc
        return default_url_fetcher(url, *fetcher_args, **fetcher_kwargs)

    collector = WarningCollector()
    weasy_logger = logging.getLogger("weasyprint")
    weasy_logger.addHandler(collector)
    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        HTML(filename=str(input_path), url_fetcher=local_fetcher).write_pdf(str(output_path))
        if not output_path.is_file() or output_path.stat().st_size == 0:
            raise RuntimeError("WeasyPrint did not create a non-empty PDF")
        result["compile_status"] = "SUCCESS"
    except Exception as exc:  # noqa: BLE001
        add_issue(result, "weasyprint_render_failed", "WeasyPrint failed to generate the PDF.", details=str(exc))
        result["layout_check"]["issues"] = result["issues"]
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 1
    finally:
        weasy_logger.removeHandler(collector)

    if collector.messages:
        add_issue(result, "weasyprint_css_warnings", "WeasyPrint ignored one or more non-critical CSS properties.", "warning", sorted(set(collector.messages)))

    try:
        reader = PdfReader(str(output_path))
        result["page_count"] = len(reader.pages)
        page_text = [(page.extract_text() or "") for page in reader.pages]
        result["text_extraction_status"] = "PASS"
    except Exception as exc:  # noqa: BLE001
        page_text = []
        result["text_extraction_status"] = "FAIL"
        add_issue(result, "pdf_text_extraction_failed", "The generated PDF could not be reopened for text verification.", details=str(exc))

    if result["page_count"] is not None:
        if result["page_count"] < 1:
            add_issue(result, "invalid_page_count", "The generated PDF contains no pages.")
        if result["page_count"] > args.max_pages:
            add_issue(result, "unreasonable_page_count", f"The PDF has {result['page_count']} pages; the configured resume limit is {args.max_pages}.")

    pdf_text = "\n".join(page_text)
    coverage = {
        "chinese": token_coverage(source_text, pdf_text, CJK_PATTERN),
        "english": token_coverage(source_text, pdf_text, ENGLISH_PATTERN),
        "special_characters": token_coverage(source_text, pdf_text, SPECIAL_PATTERN),
        "characters_per_page": [len(re.sub(r"\s+", "", text)) for text in page_text],
    }
    result["layout_check"]["checks"]["text_coverage"] = coverage
    if coverage["chinese"]["required"] and coverage["chinese"]["coverage"] < 0.95:
        add_issue(result, "chinese_character_loss", "Chinese characters are missing from extracted PDF text.", details=coverage["chinese"])
    if coverage["english"]["required"] and coverage["english"]["coverage"] < 0.9:
        add_issue(result, "english_text_loss", "English text is missing from extracted PDF text.", details=coverage["english"])
    if coverage["special_characters"]["required"] and coverage["special_characters"]["coverage"] < 1:
        add_issue(result, "special_character_loss", "Special characters are missing from extracted PDF text.", details=coverage["special_characters"])
    for index, text in enumerate(page_text, start=1):
        if not re.sub(r"\s+", "", text):
            add_issue(result, "blank_page_text", f"PDF page {index} has no extractable text.")

    pdfinfo = shutil.which("pdfinfo")
    if not pdfinfo:
        add_issue(result, "pdfinfo_unavailable", "pdfinfo is required for A4 page-size verification.")
    else:
        process = run_command([pdfinfo, str(output_path)], args.timeout)
        metadata = process.stdout if process and process.returncode == 0 else ""
        page_size_match = re.search(r"^Page size:\s+(.+)$", metadata, flags=re.MULTILINE)
        page_size = page_size_match.group(1).strip() if page_size_match else None
        result["layout_check"]["checks"]["pdf_metadata"] = {"page_size": page_size}
        if not page_size or not re.search(r"A4|595(?:\.|\s).*84[12]", page_size, flags=re.IGNORECASE):
            add_issue(result, "unexpected_page_size", f"The PDF page size is not recognized as A4: {page_size}")

    page_images, render_error = render_pages(output_path, png_dir, args.timeout)
    result["layout_check"]["page_images"] = [str(item) for item in page_images]
    result["layout_check"]["checks"]["renderer_independent_render"] = {
        "engine": "poppler",
        "status": "FAIL" if render_error else "PASS",
        "page_images": len(page_images),
    }
    if render_error:
        add_issue(result, "page_render_failed", "PDF pages could not be converted to PNG.", details=render_error)
    elif result["page_count"] is not None and len(page_images) != result["page_count"]:
        add_issue(result, "page_image_count_mismatch", "The PNG count does not match the PDF page count.")

    image_analysis = analyze_images(page_images)
    result["layout_check"]["checks"]["page_images"] = image_analysis
    if image_analysis is None:
        add_issue(result, "image_analysis_unavailable", "Pillow is required for blank-page and edge-clipping checks.")
    else:
        for index, analysis in enumerate(image_analysis, start=1):
            if analysis["appears_blank"]:
                add_issue(result, "blank_page", f"PDF page {index} appears blank.")
            if analysis["possible_edge_clipping"]:
                add_issue(result, "possible_edge_clipping", f"PDF page {index} has content touching the page edge.")

    result["layout_check"]["issues"] = result["issues"]
    result["layout_check"]["status"] = "FAIL" if any(issue["severity"] == "error" for issue in result["issues"]) else "PASS"
    result["success"] = result["compile_status"] == "SUCCESS" and result["layout_check"]["status"] == "PASS"
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["success"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
