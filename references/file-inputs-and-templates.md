# File Inputs and Templates

Read this file when uploaded-file roles are unclear, multiple resume versions are provided, formatting inputs are supplied, or an editable source/template must be selected and packaged.

## Optional Input Handling

Optional candidate-factual inputs are Candidate Profile, Additional Resumes, and Candidate-confirmed Facts.

Optional contextual or formatting inputs are Reference Job Descriptions, LaTeX templates, HTML/CSS templates, and layout-only resume templates.

- Reference Job Descriptions remain separate from the Target Job Description and are never candidate evidence.
- Contextual or formatting inputs do not replace or suppress the one-time invitation for additional candidate-factual information.
- Formatting inputs control presentation only unless the same file is explicitly identified as the Original Resume or an Additional Resume.
- Formatting inputs may contain placeholder, sample, or third-party content. Ignore it as candidate evidence unless the user separately and explicitly confirms it as a candidate fact.
- When such a fact is confirmed, record it as a Candidate-confirmed Fact; do not cite the formatting input as factual support.
- Treat files clearly belonging to one template package as one formatting input.

A LaTeX package may contain `.tex`, `.cls`, `.sty`, image, font, bibliography, or data files. An HTML package may contain HTML, CSS, JavaScript, images, icons, fonts, or other assets.

## File Roles and Format Inputs

Assign each uploaded document an explicit role when its purpose is not already clear.

Use these file roles:

- `original_resume`: primary candidate resume and accepted factual source
- `additional_resume`: supplementary candidate resume and accepted factual source
- `layout_only_resume_template`: structural or visual resume template in a supported format; never candidate evidence
- `target_job_description`: JD used for the current assessment
- `reference_job_description`: contextual job information kept separate from the Target JD
- `other`: material that does not fit the roles above

Use separate `input_format` metadata for uploaded-file format. Applicable values include `pdf`, `latex`, `html`, `image`, `docx`, `text`, and `other`.

`input_format` describes an uploaded file. `source_format` describes generated editable output: use `source_format: latex` for LaTeX and `source_format: html` for HTML/CSS. Never treat them as interchangeable.

For example, a PDF used only for layout is:

- `file_role: layout_only_resume_template`
- `input_format: pdf`

When multiple files clearly belong to one LaTeX or HTML template package, assign one formatting-input role to the package rather than treating dependencies as unrelated templates.

### File-role confirmation

- When resume-like files, PDFs, images, or JDs have unclear roles, list relevant filenames and ask the user to identify each role.
- Do not infer a role solely from filename, extension, content appearance, or visual similarity.
- For a single resume-like document with no stated purpose, ask whether it is a candidate factual source, a layout reference/template only, or both.
- If document type is also unclear, ask whether it is a resume, JD, or other material.
- Do not repeat a role question when the user already stated the purpose.

### Factual isolation

- Names, employers, experience, education, projects, skills, qualifications, and metrics in a layout-only template are never candidate facts.
- Ignore placeholder, sample, and third-party template content as candidate evidence.
- If the user separately confirms a template fact as their own, record it as Candidate-confirmed Fact, not as a fact sourced from the template.
- A file may serve as both Original Resume and layout reference only when the user explicitly confirms both uses. Keep `file_role: original_resume` and record `layout_reference_enabled: true`.
- Original Resume content remains subject to Source of Truth and Fact Check even when also used for layout.
- Preserve Original Resume style only through a template or reconstruction mode supported by its format. Do not claim an undefined editable-output path.
- A Target JD supplied as PDF or image may be used only after its role is clear and text extraction is reliable.
- If extraction is incomplete or unreliable, do not infer missing requirements; request a clearer file or text version.
- Target JDs, Reference JDs, and formatting inputs are never candidate evidence.

### File-role stopping conditions

- If ambiguity prevents reliable identification of the Original Resume or Target JD, return `CLARIFICATION_REQUIRED` with `reason_for_questions: file_role_confirmation` and pause before JD analysis or evidence mapping.
- If only an optional formatting file is ambiguous and the user declines classification, exclude it and continue when safe.
- If no Original Resume or Target JD was provided, route to `NEEDS_INPUT`.

## Multiple-Resume Evidence Handling

When multiple Original Resume or Additional Resume versions are provided, merge their verified facts into one candidate evidence pool before mapping or drafting.

- Deduplicate repeated facts. Use the most specific version only when every added detail and its factual intensity are supported; “most specific” never means “most favorable.”
- Preserve source provenance so every meaningful detail remains traceable.
- If versions conflict on dates, duration, metrics, responsibilities, proficiency, project status, or another material fact, do not merge or silently choose. Apply the clarification and conflict rules in `SKILL.md`.
- By default, create one tailored resume from the merged pool. Create separate resumes only when the user explicitly requests separate versions.

## Template Selection and Protection

Select presentation only after roles and formats are known, the content-confirmation gate is resolved, and the user requested file output or selected an output option after `AWAITING_USER_CHOICE`.

An explicit user choice overrides automatic priority. Otherwise use:

1. `layout_only_resume_template` with `input_format: latex`
2. `layout_only_resume_template` with `input_format: html`
3. `layout_only_resume_template` with `input_format: pdf`
4. Default template

Use these `template_mode` values:

- `latex_template`
- `html_template`
- `original_pdf_rebuild`
- `reference_pdf_rebuild`
- `default_template`

`original_pdf_rebuild` and `reference_pdf_rebuild` are processing modes, not file roles. Use `reference_pdf_rebuild` for a layout-only PDF, and `original_pdf_rebuild` when the user confirms that the Original Resume PDF is also the layout reference.

Do not enter template selection merely because a resume or template was uploaded.

If file output was requested without an explicit variant, layout, or template choice, do not apply template priority as though the user had selected a variant. After content confirmation, use `output_status: AWAITING_USER_CHOICE` and present the four choices defined in [output-and-rendering.md](output-and-rendering.md). A request for PDF, HTML, LaTeX, “files,” or “continue generating” alone does not select `original_format`, `html_template`, `both`, or `text_only` when multiple routes remain available.

If the user earlier requested preservation of Original Resume style but did not request files, retain that preference and present `original_format` first after content confirmation; do not preselect it. Apply template priority only after file generation is authorized and the chosen route still contains more than one applicable template of the same route.

After the user selects an output option, do not ask again for the same unchanged final text resume version. A substantive revision creates a new version and invalidates the prior choice unless the user explicitly reselects it for the revised content.

For an Original Resume PDF selected as layout reference, record:

- `file_role: original_resume`
- `input_format: pdf`
- `layout_reference_enabled: true`
- `template_mode: original_pdf_rebuild`

Use only the fact-checked tailored content in reconstructed output.

Adapt `original_format` to the supported input format:

- PDF: approximate visual reconstruction as editable HTML/CSS plus PDF; use `template_mode: original_pdf_rebuild` and `source_format: html`.
- HTML/CSS: updated complete HTML/CSS package plus PDF; use `template_mode: html_template` and `source_format: html`.
- LaTeX: updated complete LaTeX package plus PDF; use `template_mode: latex_template` and `source_format: latex`.
- DOCX, image, or unsupported direct editable format: explain limitations, do not claim exact reproduction, and normally fall back to HTML/CSS. Generate PDF only after required checks pass and record the fallback.

A PDF is a final presentation format, not editable source. Never describe a PDF as editable. PDF-layout selection requires an editable HTML/CSS reconstruction alongside the PDF.

If layout cannot be inspected or reconstructed reliably, do not offer it as exact; offer the default HTML/CSS template. Explain that PDF reconstruction is approximate and may differ because of fonts, assets, PDF structure, renderer, or content length.

Preserve selected template fonts, colors, visual hierarchy, section order, columns, spacing, margins, and overall style when feasible.

Do not delete, weaken, invent, or materially alter selected candidate facts solely to fit a template. Relevance-based omission is allowed only for a targeted resume under [tailoring-and-fact-check.md](tailoring-and-fact-check.md), and is not factual deletion.

Do not reintroduce unsupported, excluded, or superseded content. If verified selected content cannot fit safely, preserve it and report the layout issue.

### Multiple Output Variant Consistency

Multiple layout variants for the same tailored resume version must use the same final fact-checked content.

Variants may differ only in presentation: layout, typography, spacing, colors, page breaks, and comparable visual choices. Do not add claims, omit selected factual content, or use materially different wording merely to fit one template.

If a variant cannot fit, adjust presentation or report the layout issue. Do not silently create a substantively different resume.

If the user explicitly requests substantively different resume versions, treat each as a separate version and run Fact Check on each before delivery.

## Default Section Order and Consistent Entry Format

Unless the user explicitly requests another order or the selected template requires a different protected structure, use this default order for an early-career targeted resume:

1. Contact and header information
2. Education
3. Core Capabilities
4. Work Experience, Internships, Projects, or other selected experience sections
5. Tools and Languages

An explicit user choice or protected template section order overrides this default. Preserve the user's intent, but do not let a template reintroduce unsupported content or move analytical metadata into the employer-facing resume.

Use a consistent structure for comparable work, internship, project, practice, operations, and service entries. Each selected entry should normally contain:

- a verified title or project name
- an organization, project type, role, or concise context label when verified and useful
- a verified date or duration when available
- approximately two to four concise, evidence-based bullets for a major entry, adjusted for relevance and available evidence

If a selected project is missing a date or duration, follow the Pre-Draft Candidate Fact Completeness Check in [tailoring-and-fact-check.md](tailoring-and-fact-check.md). If the user declines a non-essential date and omission is safe, omit that field while retaining consistent alignment and hierarchy; never invent a placeholder date.

Do not mix detailed project cards, unstructured paragraphs, one-line inline entries, and unexplained labels without a clear presentation reason. Related experiences may be grouped, but each subentry must retain a readable title, context, and evidence structure.

Keep heading hierarchy, date placement, bullet indentation, punctuation, labels, and spacing consistent across comparable entries. These presentation rules do not authorize factual rewriting or the removal of selected high-relevance evidence.

## Editable Source Package Rules

Do not deliver an isolated source file with missing dependencies and call it a complete editable template.

For LaTeX, include the main `.tex` and all available required local `.cls`, `.sty`, image, logo, font, bibliography, and data files.

For HTML, include the main HTML and all available required CSS, JavaScript, image, logo, icon, font, and other asset files.

Bundle redistributable local dependencies when possible. If a dependency cannot be bundled, identify it in a dependency manifest with its name and necessary version, installation, or availability details.

Do not set `self_contained: true` unless the delivered source can be edited and rendered without an undeclared dependency.

For each package, record:

- `entry_file`
- `package_path`
- `included_files`
- `external_dependencies`
- `self_contained`

List only files actually generated or included.

Output behavior after file generation is authorized:

- LaTeX formatting input: complete editable LaTeX package and PDF.
- HTML formatting input: complete editable HTML/CSS package and PDF.
- Layout-only PDF: rebuilt complete HTML/CSS package and PDF.
- Original Resume PDF selected for layout: rebuilt complete HTML/CSS package and PDF.
- No selected formatting input: default complete HTML/CSS package and PDF.

These PDF statements describe intended output when a usable renderer exists. If rendering is unavailable or declined, preserve the requested source and follow [output-and-rendering.md](output-and-rendering.md); do not turn an operational failure into a factual or Human Review failure.
