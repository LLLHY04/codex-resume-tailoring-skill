# Output and Rendering

Read this file after Fact Check when requesting user confirmation of text content, offering file output, continuing an output choice, generating HTML/LaTeX/PDF artifacts, discovering or installing a renderer, or checking PDF layout and viewer compatibility. Read [output-schema.md](output-schema.md) for authoritative field and status definitions.

## User Content Confirmation Before Finalization

After a tailored resume reaches `fact_check_status: PASS`, do not immediately generate final files or ask for an output format.

First display:

- The complete proposed text resume
- `match_level`
- `change_summary`, including major selection, omission, compression, and wording decisions
- `verification_summary`
- Any material content or wording tradeoffs

Then ask whether the user confirms the text content. Use:

- `status: PASS`
- `fact_check_status: PASS`
- `content_confirmation_status: AWAITING_USER_CONFIRMATION`

This is a user-approval state, not `CLARIFICATION_REQUIRED`, `HUMAN_REVIEW_REQUIRED`, or a factual-risk state.

Offer these actions in the user's language:

1. Confirm the text and continue.
2. Request wording, content-selection, or experience changes.
3. Provide additional candidate facts.
4. Keep the current draft without generating final files.

Do not generate final editable source files or PDFs before confirmation unless the user explicitly requested direct generation without a content-confirmation step. Treat an unambiguous request to skip confirmation as `content_confirmation_status: SKIPPED_BY_USER`; do not infer that preference merely because the user requested a file format at the beginning.

If the user requests a substantive change to wording, selected experience, responsibility, proficiency, metric, project status, or another factual claim:

1. Set `content_confirmation_status: REVISION_REQUESTED` while processing the request.
2. Update the draft using accepted candidate facts.
3. Rerun Fact Check on the revised content. Do not create another fact-check status for pending user revisions, and do not carry the previous `PASS` onto changed text.
4. Display the revised resume only after the applicable Fact Check completes.
5. If it passes, return to `AWAITING_USER_CONFIRMATION` for the revised text.

If the user supplies new facts, update affected evidence mapping and Overall Match when required before redrafting and Fact Check.

Presentation-only changes—such as font, spacing, margins, section placement, page breaks, or line wrapping—do not require Fact Check when wording and factual meaning remain unchanged. Proceed to formatting only after the user confirms the unchanged text or explicitly skips confirmation.

Do not ask again after the user confirms the unchanged text version. If the user keeps the draft without file generation, use `content_confirmation_status: DRAFT_RETAINED` and `output_status: NOT_REQUESTED` and do not repeat the confirmation unless the text later changes or the user requests continuation.

## Post-Fact-Check Output Offer

After `fact_check_status: PASS` and content confirmation is resolved, determine whether the user already made a file-output decision.

- Evaluation only: do not rewrite, offer files, or generate files. Return `status: MATCH_REPORT` and `output_status: NOT_REQUESTED`.
- Confirmed text-only tailoring: return the confirmed fact-checked resume with `status: PASS`, `fact_check_status: PASS`, `content_confirmation_status: CONFIRMED`, and `output_status: NOT_REQUESTED`.
- An explicit, unambiguous output-variant or template choice—whether stated before or after content confirmation—may be reused for the unchanged final text. Proceed after confirmation without asking again.
- Tailoring requested without a file decision: after content confirmation, use `status: PASS`, `fact_check_status: PASS`, `content_confirmation_status: CONFIRMED`, and `output_status: AWAITING_USER_CHOICE` and ask whether directly usable files are wanted.

`AWAITING_USER_CHOICE` is an `output_status` only. It is not missing evidence, unresolved assessment, Fact Check failure, or Human Review. Never use `CLARIFICATION_REQUIRED` for this optional output choice.

With `AWAITING_USER_CHOICE`, return `output_question` and `output_options` after the user has confirmed the completed resume. Use the user's language and an equivalent of: “The confirmed text resume has passed Fact Check. Would you like directly usable resume files?”

Use these option IDs and show all four choices:

1. `original_format`
2. `html_template`
3. `both`
4. `text_only`

Use labels equivalent to:

1. Use the Original Resume format.
2. Use the default HTML/CSS template.
3. Generate both versions.
4. Keep the text version only and do not generate files.

Explain any known reconstruction or renderer limitation beside the applicable option, but do not silently remove or preselect an option.

## Output Choice Must Be Explicit

User confirmation of text content is not an output-format or template selection.

Messages such as “确认，继续生成简历”, “确认，生成文件”, “继续”, “没问题，生成吧”, “可以继续”, or “开始生成” authorize workflow continuation but do not select a variant. Equivalent wording in another language is equally ambiguous when it contains no explicit format or template choice.

When such a message is received and no valid output choice already exists, use:

- `content_confirmation_status: CONFIRMED`
- `output_status: AWAITING_USER_CHOICE`

Then show the four output options above. Do not silently select the default HTML/CSS template, Original Resume format, both variants, or text-only output.

Map an unambiguous user choice to exactly one option ID:

- “按原简历格式生成” or equivalent → `original_format`
- “使用默认 HTML 模板” or equivalent → `html_template`
- “两个版本都生成” or equivalent → `both`
- “只保留文字，不生成文件” or equivalent → `text_only`

A request for an artifact type alone, such as “generate a PDF,” is not a variant choice when both Original Resume and default-template variants remain available. Ask the output-choice question unless the user already selected a template or variant that determines the route.

If the user made an explicit choice for the current unchanged `final_resume`, reuse it. If a later substantive wording or content change creates a new `final_resume` version, invalidate the earlier choice, set `output_status: AWAITING_USER_CHOICE` after the revised text is fact-checked and confirmed, and ask again unless the user explicitly reselects an option for that revised version.

Never interpret “continue generating” alone as an output choice.

## File Generation Gate

Enter file generation only when the user explicitly selected a variant or template that resolves the output route, or selected a file-output option after `AWAITING_USER_CHOICE`, and the applicable content-confirmation gate is resolved. A generic request for files or an artifact type does not open this gate while the variant choice remains unresolved.

Do not enter when evaluation only or text-only output was requested, or `text_only` was selected.

Generate final source and PDF files only from the `final_resume` that has `fact_check_status: PASS` and `content_confirmation_status: CONFIRMED` or `SKIPPED_BY_USER`. An intermediate `FAIL` remains inside automatic revision. If Path A or Path B ends in `HUMAN_REVIEW_REQUIRED`, do not generate or present the risky draft as final.

Selection routing:

- `original_format`: applicable Original Resume-based variant
- `html_template`: supplied or default HTML/CSS template
- `both`: both variants, generated and validated independently
- `text_only`: `output_status: NOT_REQUESTED`, no files

Compilation, rendering, dependency, or layout failure alone must not trigger `CLARIFICATION_REQUIRED` or `HUMAN_REVIEW_REQUIRED`. Report it through file-output fields unless an independent factual issue triggers Path A or Path B.

`LOW_MATCH` is a fit result, not a file-generation gate. For `HIGH_MATCH`, `MEDIUM_MATCH`, or `LOW_MATCH`, continue requested output when required inputs exist, no clarification or Human Review gate remains, and Fact Check passed. Report low match and gaps without adding missing qualifications.

## Output-Choice Continuation

Do not repeat the output question after a valid explicit choice for the same final text resume. If the user's reply is only a generic continuation phrase and therefore does not answer the question, keep `AWAITING_USER_CHOICE`, briefly explain that a format has not been selected, and show the four options again. If the user declines or selects `text_only`, do not ask again unless they later request a file.

Continue from the existing fact-checked, content-confirmed resume after selection. Do not repeat JD Analysis, Evidence Mapping, Overall Match, or Fact Check merely because formatting begins.

Presentation-only changes do not require another Fact Check, including wrapping, font or readable font-size changes, spacing, margins, columns, page breaks, and other changes that do not alter wording or meaning.

A substantive wording change—adding, removing, weakening, strengthening, combining, or materially paraphrasing a claim—requires a new draft and Fact Check for changed claims.

Changed candidate facts require affected mapping, assessment, resume, and Fact Check updates. A changed Target JD requires JD Analysis and applicable downstream stages again.

## PDF Generation and Layout Check

Generate the complete editable source package before compiling or rendering a requested PDF.

### Renderer Environment and Installation Consent

For HTML-to-PDF, use `scripts/render_html_to_pdf.mjs` as the unified entry point. Prefer functional Chromium/Playwright. WeasyPrint may be selected explicitly when a verified Python environment is available. Never use LibreOffice as an HTML-to-PDF fallback.

Before installing anything, check the current execution environment in this order:

1. Working Chromium/Playwright.
2. Python configured through `WEASYPRINT_PYTHON` or `--weasyprint-python`.
3. Previously created persistent `resume-tailoring-pdf` or another confirmed renderer environment.

Verify before reuse. For WeasyPrint, verify the interpreter, Python packages, native libraries, and suitable resume-language fonts. A recorded Python path is a reusable locator, not proof that it still works. Ensure executable and native-library paths needed by the renderer process are active; a Python path alone may not expose `fc-match` or Poppler tools.

Record `renderer_environment` using the schema in [output-schema.md](output-schema.md). If it is `AVAILABLE`, render without asking for approval.

When no usable renderer exists:

- Finish a safe editable HTML/CSS package before requesting setup.
- Determine whether the execution environment permits package installation, persistent environment creation, required network access, and browser/renderer subprocesses.
- If required capabilities are prohibited, do not ask repeatedly. Use `renderer_environment.status: UNAVAILABLE`, `output_status: SOURCE_ONLY`, `compile_status: NOT_ATTEMPTED`, and `layout_check.status: NOT_RUN`; explain that PDF generation is unavailable in the current execution environment.
- If setup appears possible, explain the missing dependency and request explicit permission to create or configure a persistent isolated renderer environment. While waiting, use `status: PASS`, retain `fact_check_status: PASS`, and set `output_status: AWAITING_RENDERER_SETUP_APPROVAL`.
- Offer exactly `install_renderer_environment` and `html_only` when applicable.

`install_renderer_environment` authorizes configuration of a persistent isolated renderer environment in the current execution environment. It does not mean that the user must install Python on their personal computer.

Do not install packages, create an environment, enable network access, or change system configuration before approval and any required platform permission.

After approval:

- Prefer a persistent isolated environment named `resume-tailoring-pdf` when supported.
- Install only dependencies needed by the renderer and validation workflow.
- Record verified environment name, renderer, interpreter path, and verification result.
- Reverify on later use.
- Do not silently edit shell startup files; explain optional `WEASYPRINT_PYTHON` or `--weasyprint-python` configuration.
- If setup or launch fails, do not ask again for the same attempt. Preserve HTML/CSS, use `output_status: SOURCE_ONLY`, `compile_status: FAILED`, `layout_check.status: NOT_RUN`, and `renderer_environment.status: UNAVAILABLE` for confirmed execution-environment restrictions or `FAILED` for other setup failures. Explain the cause.

If the user declines or selects `html_only`:

- Do not install or retry.
- Use `renderer_environment.status: DECLINED`.
- Return the complete editable HTML/CSS package without claiming PDF generation.
- Use `compile_status: NOT_ATTEMPTED`, `layout_check.status: NOT_RUN`, and `output_status: SOURCE_ONLY` for a single variant; aggregate multiple variants by actual results.
- Provide `manual_pdf_instructions`: open `index.html` in a modern browser, Print/Save as PDF, select A4, enable background graphics, disable browser headers/footers, inspect preview, and save.
- Explain that a user-exported PDF has not passed the skill's PDF checks. Do not list it in `output_files` unless later supplied and verified.

Renderer refusal or failure changes only file-generation fields, never Phase 3 conclusions or the tailored text.

### Cross-Renderer PDF Compatibility

For every generated PDF, record the renderer, generation platform, intended platform/viewer, text-extraction result, and actually tested viewer compatibility as defined in [output-schema.md](output-schema.md).

Verification must include:

1. Text extraction for Chinese, English, and required special characters.
2. Page rendering with Poppler, PDFium, or another engine independent of the PDF generator.
3. Visual review for overflow, overlap, clipping, blank pages, abnormal glyphs, unexpected breaks, header/footer interference, broken columns, and unreasonable page count.
4. Native-viewer compatibility when the target platform/viewer is known and accessible.

Passing text extraction and one rendering engine does not establish cross-viewer compatibility.

### Target Platform and Viewer

Do not infer the user's target PDF viewer solely from the current execution environment.

Treat macOS Quartz or macOS Preview as the target viewer only when the user states that the PDF will be opened in macOS Preview or another Quartz-based viewer.

The current execution platform describes where the PDF was generated, not necessarily where the user will open it.

Set `target_platform` or `target_viewer` only when the user states it or the intended delivery context establishes it reliably. If neither is known:

- Use `target_platform: unknown`.
- Use `target_viewer: unknown`.
- Do not claim macOS Quartz, Windows PDFium, or other native-viewer compatibility.
- Use `viewer_compatibility.status: NOT_TESTED` unless a viewer was actually tested.
- Provide PDF or editable source only when the other required checks and output policy allow it.

For PDF intended for macOS:

1. Prefer Chromium/Playwright or browser-print when functional.
2. Use WeasyPrint as fallback.
3. Do not treat extraction, Poppler/PDFium, or another platform's rendering as proof of Preview/Quartz compatibility.
4. Verify WeasyPrint output in the target macOS viewer before selecting it as final.

If WeasyPrint passes extraction and independent rendering but fails Quartz, preserve HTML/CSS and attempt Chromium/browser print.

If a known target viewer cannot be tested, use `viewer_compatibility.status: NOT_TESTED`, explain the limitation, and do not claim verified compatibility. Do not use `output_status: COMPLETE` for that variant; use `LAYOUT_REVIEW_REQUIRED` if an unverified PDF is supplied for review, or `SOURCE_ONLY` when only source is delivered.

If native compatibility fails:

- Keep `compile_status: SUCCESS` because a PDF exists.
- Set `layout_check.status: FAIL`.
- Record the viewer issue in both `viewer_compatibility.issues` and `layout_check.issues`.
- Preserve HTML/CSS and attempt or offer browser printing.
- Do not mark the variant `COMPLETE`.

Use a browser-generated fallback as final only when all required checks pass. If no PDF can be verified reliably, return editable HTML/CSS with browser-print instructions and use `SOURCE_ONLY`; use `LAYOUT_REVIEW_REQUIRED` only when the failed/unverified PDF is included for review and no more specific aggregate result applies.

For each variant, `compile_status` describes PDF creation and `layout_check` describes visual inspection. Do not claim successful PDF output unless:

- `compile_status: SUCCESS`
- `layout_check.status: PASS`
- `text_extraction_status: PASS`
- Independent rendering and visual review passed
- `viewer_compatibility.status: PASS` when a target viewer is known

If generation fails, return any valid source package. If a PDF fails layout, describe it only as a review artifact and identify issues. Generate and validate every requested variant independently; one success does not prove another.
