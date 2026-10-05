# Output Schema

Read this file whenever returning structured workflow results, status fields, Human Review fields, output variants, renderer metadata, compilation results, or layout results.

## Status Dimensions

Keep these fields separate:

- `status`: top-level workflow and factual-safety result
- `match_level`: candidate fit for the role
- `assessment_status`: whether assessment is final or preliminary
- `fact_check_status`: factual verification result for tailored content
- `content_confirmation_status`: whether the user has accepted the fact-checked text content
- `output_status`: aggregate requested file-output result
- `compile_status`: PDF compilation/rendering result for one variant
- `layout_check`: visual inspection result for one variant

Top-level `status: PASS` means the tailored content passed Fact Check. It does not mean the user has confirmed that text or that every requested file was generated. Determine user approval from `content_confirmation_status` and file success from `output_status` and per-variant fields.

## Top-Level Status

Use exactly:

- `NEEDS_INPUT`: Original Resume or Target Job Description is missing
- `CLARIFICATION_REQUIRED`: candidate facts, JD completeness, or required file roles must be clarified before safe continuation
- `MATCH_REPORT`: evaluation only, without resume rewriting
- `PASS`: the requested tailored resume passed Fact Check
- `HUMAN_REVIEW_REQUIRED`: Path A clarification remains factually unsafe after the candidate answered, declined, or could not confirm; or Path B material Fact Check risk remains after two automatic revision cycles

Do not use `FAIL`, `AWAITING_USER_CONFIRMATION`, `AWAITING_USER_CHOICE`, or `AWAITING_RENDERER_SETUP_APPROVAL` as top-level status values.

## Match and Assessment Fields

Use `match_level` and `assessment_status` exactly as defined in [assessment.md](assessment.md). Do not create a separate `preliminary_match_level`.

## Fact-Check Fields

Use `fact_check_status`, `revision_cycle`, risk types, severities, and Path A/Path B rules from [tailoring-and-fact-check.md](tailoring-and-fact-check.md). `FAIL` is internal only.

## Content Confirmation Status

Use exactly:

- `AWAITING_USER_CONFIRMATION`: the proposed text passed Fact Check and is waiting for user approval
- `CONFIRMED`: the user accepted the current fact-checked text
- `REVISION_REQUESTED`: the user requested a substantive text or content change; this is a transient state while the changed draft is updated and rechecked
- `DRAFT_RETAINED`: the user chose to keep the current draft without final file generation
- `SKIPPED_BY_USER`: the user explicitly requested direct generation without the confirmation step

`content_confirmation_status` is separate from top-level `status`, `fact_check_status`, and `output_status`. It is not a factual-risk state and must not trigger `CLARIFICATION_REQUIRED` or `HUMAN_REVIEW_REQUIRED` by itself.

A generic continuation message may change `content_confirmation_status` from `AWAITING_USER_CONFIRMATION` to `CONFIRMED`, but it does not resolve `output_status`. When no valid output choice exists, use `output_status: AWAITING_USER_CHOICE`.

Do not create another `fact_check_status` for pending user revisions. A substantive change invalidates the prior Fact Check for the changed text and must be rechecked under the existing statuses before the revised resume is displayed as passed.

## Output Status

Use exactly:

- `NOT_REQUESTED`: no file output requested, file output declined, `text_only` selected, or evaluation only
- `AWAITING_USER_CHOICE`: user-confirmed, fact-checked text resume is waiting for an explicit choice among `original_format`, `html_template`, `both`, and `text_only`; generic continuation wording does not resolve this state
- `AWAITING_RENDERER_SETUP_APPROVAL`: HTML/CSS can be produced, renderer setup appears possible, and PDF rendering waits only for permission to configure it
- `COMPLETE`: every requested variant and file was generated and passed required checks
- `PARTIAL`: multiple variants requested; at least one completed and at least one did not
- `SOURCE_ONLY`: valid editable source exists but requested PDF was not generated as usable output
- `LAYOUT_REVIEW_REQUIRED`: PDF exists but did not pass required inspection and no more specific multi-variant status applies
- `FAILED`: no usable requested source package or PDF was produced

`AWAITING_USER_CHOICE` and `AWAITING_RENDERER_SETUP_APPROVAL` belong only to `output_status`; neither replaces top-level `status`, `assessment_status`, `fact_check_status`, or `content_confirmation_status`.

`AWAITING_RENDERER_SETUP_APPROVAL` means permission is pending. Do not use it when installation or renderer execution is known to be impossible.

## Renderer Environment

When renderer discovery, reuse, or setup is relevant, record:

- `status`
- `renderer`
- `environment_name`, if applicable
- `python_path`, for a Python renderer
- `activation_details`, when environment-specific executable or library paths are required
- `verification_summary`
- `reusable`: `true` or `false`

Use exactly these `renderer_environment.status` values:

- `AVAILABLE`: verified renderer can be used in the current execution environment
- `MISSING`: none found, but setup appears possible
- `AWAITING_APPROVAL`: setup appears possible and permission is the only unresolved setup gate
- `DECLINED`: user declined setup
- `FAILED`: approved installation, configuration, verification, or launch failed
- `UNAVAILABLE`: current environment cannot install or run a supported renderer because a required capability is unavailable

## Per-Variant Rendering Fields

Use these `compile_status` values:

- `NOT_ATTEMPTED`
- `SUCCESS`
- `FAILED`

Use these `layout_check.status` values:

- `NOT_RUN`
- `PASS`
- `FAIL`

Use:

- `renderer_engine`: `chromium`, `weasyprint`, or `browser_print`
- `render_platform`: `macos`, `windows`, `linux`, or `unknown`
- `target_platform`: `macos`, `windows`, `linux`, or `unknown`
- `target_viewer`: `quartz`, `pdfium`, `browser`, or `unknown`
- `text_extraction_status`: `PASS`, `FAIL`, or `NOT_RUN`
- `viewer_compatibility.viewer`: `quartz`, `pdfium`, `browser`, or `unknown`
- `viewer_compatibility.status`: `PASS`, `FAIL`, or `NOT_TESTED`
- `viewer_compatibility.issues`: list of compatibility issues

`target_viewer` is intended use. `viewer_compatibility.viewer` is what was actually tested. Never mark an untested viewer `PASS`.

For each requested output variant, record:

- `variant_id`
- `template_mode`
- `source_format`
- `source_package`
- `compile_status`
- `layout_check`
- `renderer_engine`
- `render_platform`
- `target_platform`
- `target_viewer`
- `text_extraction_status`
- `viewer_compatibility`
- `output_files`
- `renderer_environment`, when relevant
- `manual_pdf_instructions`, for source-only browser-export fallback

`source_format` is generated editable format, not uploaded `input_format`. List only files actually generated or included.

## Output Routing

### NEEDS_INPUT

Return:

- `status`
- `missing_inputs`
- `request_message`

Do not match or rewrite.

### CLARIFICATION_REQUIRED

Return:

- `status`
- `match_level`, if available
- `assessment_status`, if available
- `questions`
- `reason_for_questions`

This is a pause, not final failure. Use it for:

1. Candidate-fact clarification
2. JD completeness clarification
3. File-role confirmation

For candidate facts, use `reason_for_questions: candidate_fact_clarification` and ask specific neutral questions. Related date, duration, responsibility, tool, project-status, result, and proficiency questions may be grouped into one turn. When a fact is non-essential, offer omission as an option. For JD completeness, ask the user for a fuller JD or clearer role requirements; never ask for candidate evidence for an undefined requirement. If the user declines, do not repeat; explain why reliable assessment/tailoring cannot continue and resume only after sufficient requirements arrive.

For file roles, use `reason_for_questions: file_role_confirmation`, list relevant filenames, and ask their intended roles. Optional formatting-file ambiguity may be excluded and is not Human Review.

`CLARIFICATION_REQUIRED` takes priority for a material unverified hard constraint. A provisional level may appear only with `assessment_status: PRELIMINARY` and is not permission for a final resume.

If candidate clarification is declined or impossible, do not loop. Safely exclude uncertain information and continue when possible, keeping it `unverified`; use `skill_gap` only when absence is explicitly confirmed. If safe completion remains impossible, follow Path A.

### MATCH_REPORT

Return:

- `status`
- `output_status: NOT_REQUESTED`
- `match_level`
- `assessment_status`
- `match_summary`
- `requirement_mapping`
- `key_strengths`
- `key_gaps`
- `unresolved_questions`
- `recommendation`

Do not generate a tailored resume.

### PASS

Return:

- `status`
- `match_level`
- `assessment_status`
- `match_report`
- `final_resume`
- `change_summary`
- `fact_check_status`
- `verification_summary`
- `content_confirmation_status`
- `content_confirmation_question`, only with `AWAITING_USER_CONFIRMATION`
- `content_confirmation_options`, only with `AWAITING_USER_CONFIRMATION`
- `output_status`, after the workflow reaches an output decision or file-output stage
- `output_question`, only with `AWAITING_USER_CHOICE`
- `output_options`, only with `AWAITING_USER_CHOICE`
- `renderer_setup_question`, only with `AWAITING_RENDERER_SETUP_APPROVAL`
- `renderer_setup_options`, only with `AWAITING_RENDERER_SETUP_APPROVAL`
- `output_variants`, when file generation was attempted

`final_resume` is the version that passed final Fact Check. While content confirmation is pending, it is the proposed employer-facing text resume, not authorization to generate final files.

`change_summary` briefly describes prioritized content, reframed wording, unsupported claims avoided or corrected, and material selection or compression decisions. Distinguish facts omitted for relevance or length, facts shortened without changing meaning, unsupported claims excluded, and facts awaiting clarification.

With `content_confirmation_status: AWAITING_USER_CONFIRMATION`, return:

- `status: PASS`
- Existing `match_level` and `assessment_status`
- `fact_check_status: PASS`
- The complete proposed `final_resume`
- `change_summary`
- `verification_summary`
- `content_confirmation_question`
- `content_confirmation_options`

Offer confirmation and continuation, substantive revision, additional facts, and retaining the draft without files. Do not return `output_question` or begin file generation in this state.

When the user requests substantive revisions, use `REVISION_REQUESTED` only while processing them, rerun Fact Check, and return the revised resume with `AWAITING_USER_CONFIRMATION` only if the revised content passes. If the user keeps the draft without files, use `DRAFT_RETAINED` and `output_status: NOT_REQUESTED`.

After `CONFIRMED`, proceed to the existing output-choice or file-generation route. `SKIPPED_BY_USER` permits direct file generation only when the user explicitly requested that the confirmation step be skipped.

With `AWAITING_USER_CHOICE`, require `content_confirmation_status: CONFIRMED`, then return the complete `final_resume` and `verification_summary` before the question and options. Use exactly the four option IDs `original_format`, `html_template`, `both`, and `text_only`, with user-facing labels for Original Resume format, default HTML/CSS template, both versions, and text only. Never return `output_question` or `output_options` with another `output_status`.

Do not infer an option from “continue,” “generate the resume,” “generate files,” or equivalent wording. If no prior explicit choice exists, retain `AWAITING_USER_CHOICE` and show the options. An explicit choice may be reused only for the unchanged `final_resume`. A substantive revision invalidates an earlier choice unless the user explicitly selects an option for the revised version.

With `AWAITING_RENDERER_SETUP_APPROVAL`, return `status: PASS`, existing `assessment_status`, `fact_check_status: PASS`, resolved `content_confirmation_status`, `renderer_setup_question`, and options `install_renderer_environment` and `html_only`. Do not reuse `output_question` for setup consent.

If setup is declined, continue from the existing fact-checked resume, return source with `SOURCE_ONLY`, and do not ask again for that attempt. If renderer status is `UNAVAILABLE`, return source with `SOURCE_ONLY` without asking.

### HUMAN_REVIEW_REQUIRED

Return:

- `status`
- `match_level`, if available
- `risk_items`, when a tailored draft or Fact Check risk exists
- `unresolved_facts`, when Path A involves a pre-draft missing or conflicting fact
- `review_note`
- `questions_for_candidate`, when applicable

Under Path A, `unresolved_facts` describes missing or conflicting facts that could not be resolved. Under Path B, `risk_items` describes unresolved Fact Check risks and `review_note` summarizes revisions attempted.

Do not require `risk_items` without a draft. Do not require questions under Path B unless candidate judgment is actually needed. Do not turn a pre-draft conflict into a Fact Check risk item unless a draft exists.

Never present a risky draft as final. If a safe partial version is shown, label it incomplete and identify excluded claims.

Clarification is required first only for a missing, conflicting, or candidate-dependent fact. Existing-source risks may route directly to Path B after the revision limit.

Compilation, rendering, dependency, layout, or viewer compatibility failure never triggers Human Review by itself.

## General Output Rules

- Use the user's requested language for explanations.
- Preserve resume language unless translation is requested.
- Distinguish verified facts, interpretations, gaps, and unresolved questions.
- Do not hide low or medium match because a tailored resume exists.
- Do not expose internal chain-of-thought; provide concise evidence-based reasoning.
- Do not guarantee ATS success or an interview.
- Do not include numerical match percentages unless explicitly requested and labeled estimated.
- Make structured output understandable to a non-technical job seeker.
