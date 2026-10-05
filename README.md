# Resume Tailoring

A fact-preserving Codex skill for resume–job fit analysis, targeted resume tailoring, editable source packages, and validated PDF output.

## Table of Contents

- [Overview](#overview)
- [Required Inputs](#required-inputs)
- [Optional Inputs](#optional-inputs)
- [Output Options](#output-options)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Key Features](#key-features)
- [Safety and Factual Accuracy](#safety-and-factual-accuracy)
- [File Roles](#file-roles)
- [Workflow](#workflow)
- [HTML/CSS and PDF Output](#htmlcss-and-pdf-output)
- [Renderer Dependencies](#renderer-dependencies)
- [Fallback Behavior](#fallback-behavior)
- [Repository Structure](#repository-structure)
- [Privacy Notice](#privacy-notice)
- [Known Limitations](#known-limitations)
- [License](#license)

## Overview

`resume-tailoring` is a Codex skill that evaluates how well a candidate's verified experience matches a Target Job Description and produces a focused, fact-checked resume for the specific role.

The skill goes beyond simple keyword matching by:

- breaking a Job Description into independently assessable requirements;
- mapping each requirement to verified candidate evidence;
- identifying direct matches, partial matches, transferable skills, unverified items, and skill gaps;
- selecting the most relevant experience instead of copying every source-resume item;
- preserving factual accuracy, responsibility level, proficiency, metrics, dates, causality, and project status;
- asking the candidate to clarify important missing or conflicting facts;
- showing the complete fact-checked text resume before file generation;
- supporting editable HTML/CSS, LaTeX, and PDF-oriented output workflows.

The skill prioritizes factual accuracy over keyword coverage.

In addition to producing a fact-checked text resume, the skill supports layout-aware resume output based on the user's Original Resume.

When the user explicitly selects the Original Resume format, the skill can:

- preserve and update an editable LaTeX or HTML/CSS source when available;
- reconstruct the visual style of an Original Resume PDF as editable HTML/CSS;
- generate an Original Resume-style PDF when a verified renderer or compiler is available;
- generate both the Original Resume-style version and the default HTML/CSS version for comparison.

The skill keeps candidate facts separate from presentation formatting. Content from a layout template is never treated as candidate evidence.

PDF reconstruction is approximate. The result may differ from the original because of fonts, embedded assets, PDF structure, rendering engines, or changes in content length.

## Required Inputs

The workflow requires:

1. **Original Resume**
2. **Target Job Description**

The skill does not begin matching or resume rewriting until both required inputs are available and their roles are clear.

## Optional Inputs

Optional candidate-factual inputs include:

- Candidate Profile;
- Additional Resumes;
- candidate-confirmed project details;
- personal introduction;
- relevant experience;
- verified metrics or results.

Optional contextual and formatting inputs include:

- Reference Job Descriptions;
- LaTeX templates;
- HTML/CSS templates;
- layout-only resume templates, including PDF layout references.

Reference Job Descriptions and formatting templates remain separate from candidate evidence.

Placeholder, sample, or third-party content found in a formatting input must not be treated as candidate facts.

## Output Options

After the text resume passes Fact Check and the user confirms its content, the available output choices are:

1. `original_format` — use the Original Resume format or supported reconstruction route;
2. `html_template` — use the supplied or default HTML/CSS template;
3. `both` — generate both the Original Resume-format variant and the HTML/CSS-template variant;
4. `text_only` — keep the confirmed text resume without generating files.

The possible outputs include:

- a fact-checked text resume;
- an Original Resume-style editable source package;
- a default HTML/CSS source package;
- a LaTeX source package when applicable;
- a PDF when a verified renderer or compiler is available;
- multiple independently checked variants.

Confirming the text content is not the same as selecting an output format.

Messages such as the following do not automatically select a format:

- “Continue”
- “Generate the resume”
- “确认，继续生成简历”
- “可以继续”
- “开始生成”

When no valid output choice exists, the skill must ask the user to choose.

If the Original Resume is a PDF:

- `original_format` reconstructs its visual style as editable HTML/CSS and generates a PDF when rendering is available.

If the Original Resume is HTML/CSS:

- `original_format` updates the complete HTML/CSS source package and generates a PDF when rendering is available.

If the Original Resume is LaTeX:

- `original_format` updates the complete LaTeX source package and generates a PDF when compilation is available.

## Installation

Clone the repository:

```bash
git clone https://github.com/<your-username>/resume-tailoring.git
```

Create the local Codex skills directory:

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
```

Copy the skill:

```bash
cp -R resume-tailoring \
  "${CODEX_HOME:-$HOME/.codex}/skills/resume-tailoring"
```

After installation, start a new Codex task. If the skill is not discovered immediately, restart Codex and try again.

## Quick Start

Explicitly invoke the skill:

```text
Use $resume-tailoring to evaluate my Original Resume against this Target Job Description and produce a truthful, targeted resume without inventing experience or skills.
```

Chinese example:

```text
请使用 $resume-tailoring，根据我提供的 Original Resume 和 Target Job Description 分析匹配度，并在不虚构或夸大经历的前提下修改简历。
```

The skill will:

1. identify uploaded-file roles;
2. analyze and decompose the Target Job Description;
3. map requirements to verified candidate evidence;
4. draft and fact-check the tailored text resume;
5. ask the user to confirm or revise the text;
6. ask the user to select an output format when no valid choice exists;
7. generate editable source files and PDFs when requested and supported.

## Key Features

- Job Description decomposition and requirement prioritization.
- Evidence mapping from one or more candidate resumes.
- `direct_match`, `partial_match`, `transferable_skill`, `unverified`, and `skill_gap` classification.
- `HIGH_MATCH`, `MEDIUM_MATCH`, and `LOW_MATCH` assessments.
- Candidate clarification for missing, ambiguous, or conflicting material facts.
- Targeted experience selection instead of copying every source-resume item.
- Role-specific core capabilities or summary content.
- Consistent formatting across projects, work experience, and practical experience.
- Claim-level Fact Check with controlled automatic revision.
- Protection against inflated proficiency, unsupported metrics, invented dates, and changed project status.
- User confirmation before final file generation.
- Original Resume-style, default HTML/CSS, both, or text-only output choices.
- Editable HTML/CSS source packages.
- LaTeX source packages when applicable.
- PDF rendering and layout validation when a verified renderer is available.
- Editable-source fallback when PDF rendering or compilation is unavailable.

## Safety and Factual Accuracy

The skill must never invent or overstate:

- experience;
- skills;
- metrics;
- responsibilities;
- ownership;
- proficiency;
- results;
- causality;
- dates;
- duration;
- or project status.

Candidate facts may come only from:

1. the Original Resume;
2. a Candidate Profile;
3. Additional Resumes supplied by the candidate;
4. facts explicitly confirmed by the candidate.

The Target Job Description, Reference Job Descriptions, formatting templates, placeholder content, third-party examples, and AI-generated assumptions are not candidate evidence.

When a material fact is missing, ambiguous, or conflicting, the skill asks a neutral clarification question before using it in the final resume.

If the candidate cannot confirm a non-essential fact, the skill may:

- preserve the original supported wording;
- weaken the wording to the verified level;
- omit the unsupported field;
- or remove the risky claim.

The skill must not silently select a stronger or more favorable version of conflicting information.

## File Roles

Uploaded documents may be assigned the following roles:

- `original_resume`: the candidate's primary resume and an accepted factual source;
- `additional_resume`: a supplementary candidate resume and an accepted factual source;
- `layout_only_resume_template`: a visual or structural reference that is never candidate evidence;
- `target_job_description`: the Job Description used for the current assessment;
- `reference_job_description`: contextual job information kept separate from the current Target Job Description;
- `other`: material that does not fit the roles above.

File purpose and file format are recorded separately.

Supported input-format labels include:

- `pdf`
- `latex`
- `html`
- `image`
- `docx`
- `text`
- `other`

A file may serve as both the Original Resume and a layout reference only when the user explicitly confirms both purposes.

## Workflow

The skill follows this general sequence:

1. Identify uploaded-file roles.
2. Confirm the Original Resume and Target Job Description.
3. Analyze and decompose the Target Job Description.
4. Merge verified facts from multiple candidate resumes.
5. Map each requirement to candidate evidence.
6. Clarify material missing, ambiguous, or conflicting facts.
7. Calculate the Overall Match.
8. Select the most relevant verified experience.
9. Draft a targeted text resume.
10. Perform claim-level Fact Check.
11. Display the complete fact-checked text resume.
12. Ask the user to confirm or revise the text.
13. Ask the user to select an output variant when no valid choice already exists.
14. Generate the requested editable source packages and PDFs.
15. Validate compilation, text extraction, layout, and applicable viewer compatibility.

A `LOW_MATCH` result does not prevent resume rewriting or file generation when the user requested them and no clarification or factual-safety gate remains.

## HTML/CSS and PDF Output

The repository includes a default HTML/CSS resume template:

- [`assets/default-html-resume/index.html`](assets/default-html-resume/index.html)
- [`assets/default-html-resume/styles.css`](assets/default-html-resume/styles.css)

The template is:

- designed for A4 output;
- single-column and ATS-friendly;
- compatible with Chinese and English content;
- based on system fonts;
- free of JavaScript, CDN dependencies, remote fonts, and external images.

A generated PDF is considered successful only after the required checks pass, including:

- compilation or rendering;
- text extraction;
- Chinese, English, and special-character handling;
- page-size inspection;
- overflow and clipping review;
- blank-page detection;
- overlap detection;
- page-break inspection;
- and applicable viewer-compatibility checks.

Successful text extraction alone does not prove that a PDF displays correctly in every viewer.

## Renderer Dependencies

The primary HTML-to-PDF entry point is:

- [`scripts/render_html_to_pdf.mjs`](scripts/render_html_to_pdf.mjs)

It prefers Chromium through Playwright.

The optional WeasyPrint renderer is:

- [`scripts/render_html_to_pdf_weasyprint.py`](scripts/render_html_to_pdf_weasyprint.py)

Depending on the selected renderer and validation workflow, the current environment may need:

- Node.js;
- Chromium and Playwright;
- Python;
- WeasyPrint;
- `pypdf`;
- Pillow;
- suitable Chinese and Latin fonts;
- Fontconfig;
- Poppler utilities such as `pdfinfo` and `pdftoppm`.

Renderer availability is checked before use.

The skill must not install packages, create persistent environments, enable network access, or change system configuration without explicit user permission and any required platform authorization.

LaTeX source-package output is supported, but PDF compilation depends on a compatible LaTeX toolchain in the current environment. This repository does not currently include a dedicated LaTeX compilation script.

## Fallback Behavior

If a supported PDF renderer is unavailable, installation is not permitted, setup fails, or the user declines installation:

- preserve the complete requested editable source package;
- do not claim that PDF generation succeeded;
- return an appropriate source-only output status;
- explain the missing renderer, compiler, or validation limitation.

For an HTML/CSS output variant, provide browser-based PDF export instructions:

1. Open `index.html` in a modern browser.
2. Select **Print** or **Save as PDF**.
3. Choose A4 paper size.
4. Enable background graphics.
5. Disable browser headers and footers.
6. Inspect the print preview for clipping, overflow, or unexpected page breaks.
7. Save the PDF.

For a LaTeX output variant, preserve the complete LaTeX source package and report that PDF compilation was not completed when a compatible toolchain is unavailable.

A PDF created manually by the user has not passed the skill's automated PDF checks unless it is later provided and verified.

## Repository Structure

```text
resume-tailoring/
├── .gitignore
├── LICENSE
├── README.md
├── SKILL.md
├── agents/
│   └── openai.yaml
├── assets/
│   └── default-html-resume/
│       ├── index.html
│       └── styles.css
├── references/
│   ├── assessment.md
│   ├── file-inputs-and-templates.md
│   ├── output-and-rendering.md
│   ├── output-schema.md
│   └── tailoring-and-fact-check.md
└── scripts/
    ├── render_html_to_pdf.mjs
    └── render_html_to_pdf_weasyprint.py
```

The exact structure should match the files present in the repository.

## Privacy Notice

Resumes and Job Descriptions may contain sensitive personal or employment information.

Do not commit:

- real resumes;
- private Job Descriptions;
- personal profiles;
- generated application files;
- screenshots;
- API keys;
- access tokens;
- email addresses;
- phone numbers;
- or renderer environments.

Use local or temporary directories for private candidate files and generated outputs.

Template content must remain separate from candidate evidence.

Users are responsible for reviewing generated resume content before submitting it to an employer.

## Known Limitations

- The skill cannot guarantee ATS success, an interview, or a job offer.
- Match assessments depend on the completeness and accuracy of the supplied resume and Target Job Description.
- PDF and image text extraction may require clarification when extraction is incomplete or unreliable.
- Rebuilding the visual style of a PDF resume is approximate.
- PDF rendering depends on the tools and permissions available in the current environment.
- Native PDF viewer compatibility cannot be claimed unless the intended viewer was actually tested.
- LaTeX compilation depends on an available LaTeX toolchain, and this repository does not currently include a dedicated LaTeX compilation script.
- HTML/CSS or LaTeX source may be returned without a PDF when rendering, compilation, or verification cannot be completed safely.

## License

This project is licensed under the [MIT License](LICENSE).
