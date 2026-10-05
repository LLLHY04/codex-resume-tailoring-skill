---
name: resume-tailoring
description: Analyze a candidate's original resume against a target job description, identify matches and gaps, and tailor the resume while preserving factual accuracy. Use when a user asks to evaluate resume-job fit or customize a resume for a specific role. Never invent or overstate candidate experience, skills, metrics, ownership, proficiency, or project status.
---

# Resume Tailoring

## Purpose

Help job seekers evaluate how well their verified experience matches a Target Job Description and produce a resume tailored to the specific role.

Break the Job Description into requirements, map each requirement to verified candidate evidence, report matches and gaps, and reframe supported content to improve relevance.

Prioritize factual accuracy over keyword coverage. Never invent or overstate experience, skills, metrics, ownership, proficiency, results, causality, or project status.

## Reference Routing

Read only the references required for the current workflow stage. A selected reference must be read completely before applying its rules.

- When performing JD analysis, evidence mapping, hard-constraint evaluation, or Overall Match assessment, read [references/assessment.md](references/assessment.md).
- When clarifying candidate facts, selecting or compressing resume content, drafting, checking JD coverage, performing Fact Check, or handling Path A or Path B, read [references/tailoring-and-fact-check.md](references/tailoring-and-fact-check.md).
- When identifying uploaded-file roles, merging resume versions, selecting a template, or creating an editable source package, read [references/file-inputs-and-templates.md](references/file-inputs-and-templates.md).
- When requesting user confirmation of fact-checked text, offering file output, continuing from an output choice, generating HTML or PDF files, checking renderer availability, or validating cross-renderer compatibility, read [references/output-and-rendering.md](references/output-and-rendering.md).
- Before returning structured fields or assigning any workflow, assessment, Fact Check, renderer, compilation, layout, or output status, read [references/output-schema.md](references/output-schema.md).

## Workflow

Follow this sequence. Stop before any downstream stage that depends on an unresolved clarification or safety gate.

1. Identify ambiguous file roles. If ambiguity prevents reliable identification of the Original Resume or Target Job Description, return `CLARIFICATION_REQUIRED` and pause.
2. Confirm both required inputs. If either is missing, return `NEEDS_INPUT` and stop. If no optional candidate-factual input was provided, make the one-time open invitation and continue if declined.
3. Analyze and decompose the Target Job Description. If it cannot establish an assessment core, return `CLARIFICATION_REQUIRED` for JD completeness and pause.
4. Merge non-conflicting verified facts from multiple candidate resumes, then map every JD requirement to accepted evidence.
5. Ask structured clarification questions for material missing, ambiguous, or conflicting candidate facts and for unverified hard constraints. Do not draft affected content while a required clarification remains unresolved.
6. Calculate Overall Match with hard constraints separate from the assessment core. For evaluation only, return `MATCH_REPORT` and do not draft.
7. For tailoring, perform the pre-draft coverage check and rank verified experiences by JD relevance, evidence strength, recency, verified outcomes, differentiation, and intended positioning.
8. Select a concise targeted subset before drafting. Do not create a full-detail resume first and remove content only after layout overflow.
9. Inspect every selected entry before drafting. Proactively ask once for a selected project's missing date or duration and clarify other missing facts only when material; allow safe omission of a non-essential unanswered field.
10. Draft the targeted text resume with consistent entry structure. When the defined default conditions are met, include a concise verified Core Capabilities section after Education and before Work Experience or Projects. Keep Tools and Languages to compact, role-relevant keywords and supported proficiency or score labels only.
11. Run the initial claim-level Fact Check as `revision_cycle: 0`. If material risk remains, perform at most two automatic revision cycles and recheck at cycles 1 and 2.
12. When the text reaches `fact_check_status: PASS`, preserve that exact employer-facing version as `final_resume`, display it with `change_summary` and `verification_summary`, and request user content confirmation.
13. If the user requests substantive content or wording changes, revise, rerun the applicable Fact Check, show the revised text, and request confirmation again. Presentation-only changes do not require Fact Check when wording is unchanged.
14. After content confirmation, return confirmed text only when explicitly requested, proceed directly only when a valid output variant or template was explicitly selected, or use `output_status: AWAITING_USER_CHOICE` and ask the existing output-format question. Generic phrases such as “continue” or “generate the resume” confirm content but do not select an output variant.
15. For requested file output, use the confirmed template choice or template priority, build the complete editable source package, and generate each requested variant from the same confirmed `final_resume`.
16. Generate PDF only when a verified renderer is available or the user authorizes permitted renderer setup. Preserve editable source and use the defined fallback when PDF generation cannot complete safely.
17. Return workflow, match, assessment, Fact Check, content confirmation, and file-output results as separate fields.

Resume from a paused stage only after the required information is received or the issue can be handled safely under the referenced rules.

## Required Inputs

Required inputs:

1. Original Resume
2. Target Job Description

Optional candidate-factual inputs:

1. Candidate Profile
2. Additional Resumes
3. Candidate-confirmed Facts

Optional contextual or formatting inputs:

1. Reference Job Descriptions
2. LaTeX Template
3. HTML/CSS Template
4. Layout-only Resume Template

Input handling:

- If the Original Resume is missing, stop and ask the candidate to provide it.
- If the Target Job Description is missing, stop and ask the user to provide it.
- Do not explain missing optional inputs unless their absence affects the task or the user asks about them.
- If both required inputs are present but no optional candidate-factual input is available, ask once whether the candidate wants to provide additional factual information such as another resume version, a personal introduction, project details, or relevant experience.
- Reference Job Descriptions and formatting inputs do not count as candidate-factual inputs and do not suppress the one-time invitation.
- Allow the candidate to decline the invitation and continue with the available verified information.
- The one-time invitation does not limit later questions about a specific ambiguous fact, factual conflict, hard constraint, or Fact Check risk.
- Ask later questions only when the answer could materially affect matching or safe rewriting.
- Do not begin JD matching or resume rewriting until both required inputs are available.

Use [references/file-inputs-and-templates.md](references/file-inputs-and-templates.md) for file roles, optional-file ambiguity, format metadata, resume merging, and template isolation.

## Source of Truth Core

Accepted candidate-factual sources are limited to:

1. Original Resume
2. Candidate Profile
3. Additional Resumes provided by the candidate
4. Facts explicitly confirmed by the candidate during the conversation

The following are not candidate-factual sources:

- Target Job Description
- Reference Job Description
- Layout-only template or formatting-template content
- Assumptions or speculation based on candidate materials
- AI-generated or otherwise unverified claims
- Unsupported metrics, results, skills, responsibilities, proficiency levels, causality, or project status

Treat the Target Job Description only as a source of employer requirements.

Do not invent or infer project, employment, or education dates; project or employment duration; job titles; or project status. If an unsupported date or related fact is material, use `CLARIFICATION_REQUIRED`. If it is non-essential and the candidate does not provide it, omit it rather than guessing.

If accepted sources conflict, return `CLARIFICATION_REQUIRED` and ask the candidate to confirm the accurate fact. Do not silently choose the stronger or more favorable version.

If the candidate declines or cannot confirm, exclude the conflict and continue only when that is safe. If a potentially critical conflict cannot be safely excluded or resolved after clarification was requested, use Human Review Path A.

Ask factual, neutral, non-leading questions. If an ambiguous non-conflicting fact cannot be confirmed, retain the supported original wording or omit the unsupported claim.

## Clarification Core

`CLARIFICATION_REQUIRED` is a pause, not a final failure.

Use it for:

- Candidate-fact clarification when a missing, conflicting, or candidate-dependent fact could materially affect matching or safe rewriting.
- Job Description completeness when the role lacks enough defined responsibilities or must-have requirements for a reliable assessment core.
- File-role confirmation when required inputs or candidate-factual sources cannot be identified reliably.

Do not repeat a declined optional question or the same unanswered clarification in a loop.

For candidate-fact questions, use `reason_for_questions: candidate_fact_clarification`. Group related questions when practical, and allow omission of a non-essential date or detail when the candidate declines to provide it.

If a candidate-fact question remains unanswered, keep the item `unverified`. Change it to `skill_gap` only when the candidate explicitly confirms the absence of the experience or skill.

When uncertain information can be excluded or safely weakened, continue with verified information. Use `HUMAN_REVIEW_REQUIRED` under Path A only after clarification has been requested and the unresolved issue still cannot be safely resolved, weakened, removed, or excluded.

## Core Assessment Flow

Read [references/assessment.md](references/assessment.md) before performing any assessment stage.

- Decompose the Target Job Description into stable, independently assessable requirements.
- Map every requirement to accepted evidence and assign exactly one match classification.
- Keep ordinary `must_have` requirements separate from legal, formal-eligibility, or role-access `hard_constraint` requirements.
- Evaluate hard constraints through `constraint_status`, not through ordinary skill matching alone.
- Build the assessment core, apply the defined thresholds, and return one `match_level`: `HIGH_MATCH`, `MEDIUM_MATCH`, or `LOW_MATCH`.
- Keep `match_level` separate from `assessment_status`.
- Treat `unverified` as neither supported evidence nor a `skill_gap`.
- Return `assessment_status: PRELIMINARY` when unresolved information could materially change the result; otherwise use `FINAL`.
- Do not produce a final assessment or final tailored resume while a material hard constraint remains `unverified`.
- Do not generate a numerical match percentage unless the user explicitly requests an estimate.

`LOW_MATCH` describes fit only. It does not prevent resume tailoring or file generation when the user requested them and no clarification or factual-safety gate remains.

## Resume Scope Core

Read [references/tailoring-and-fact-check.md](references/tailoring-and-fact-check.md) before selecting content or drafting.

By default, produce a targeted resume optimized for relevance and clarity rather than reproducing every source-resume item.

- Prioritize verified evidence using JD relevance, evidence strength and specificity, recency, verified outcomes or artifacts, differentiation, and intended positioning.
- Include medium-relevance evidence when it improves positioning or demonstrates a useful transferable skill.
- Compress or omit low-relevance content when this improves focus without creating a misleading chronology or background.
- For an early-career one-page resume, normally select two to four relevant projects or experiences and two to four evidence-based bullets for each major entry.
- Before drafting, check every selected project for a verified date or duration. Ask once for a missing value through candidate-fact clarification; if the candidate declines and omission is safe, omit the unsupported field rather than guessing.
- Use consistent structure and date placement across comparable work, internship, project, practice, and operations entries.
- For role-tailored early-career resumes, include Core Capabilities by default when the JD contains multiple important requirements and at least two relevant verified strengths exist. Place it after Education and before the first Work Experience or Projects section.
- Replace a broad descriptive Skills section with at most two short lines or bullets of verified, role-relevant Tools and Languages. Include names plus supported proficiency or test-score labels only; omit capability descriptions and unsupported groups.
- Preserve omitted verified facts in the evidence pool. Omission from one targeted resume is a presentation decision, not factual deletion or correction.
- Never invent, strengthen, weaken, or change a fact while selecting or compressing content.
- Preserve essential verified identity, contact, and education information and content the user explicitly asks to retain.
- If the user requests a complete resume, academic CV, or full history, use the complete-scope rules instead of targeted omission.
- Do not remove high-relevance content merely to fit a template. Adjust presentation or report the layout limitation.
- Record material omissions, merging, and compression tradeoffs in `change_summary`.

## Fact Check Core

Read [references/tailoring-and-fact-check.md](references/tailoring-and-fact-check.md) before Fact Check or revision.

- Perform claim-level verification after drafting and before presenting a resume as final.
- A claim passes only when an accepted factual source supports the same meaning and factual intensity.
- Preserve responsibility, proficiency, result, causality, date, duration, project status, and metric provenance.
- Proposed, planned, intended, or target metrics are not achieved results.
- `FAIL` is an internal Fact Check state used between checking and revision; it is not a top-level final status.
- `revision_cycle: 0` is the initial check; cycles 1 and 2 follow the first and second automatic revisions. Do not perform a third automatic revision.
- `fact_check_status: PASS` requires every meaningful claim to be supported and no unresolved high- or medium-severity factual risk.
- If a missing or conflicting candidate-dependent fact is required, follow Human Review Path A and ask clarification first.
- If existing sources already prove a draft claim unsupported or overstated, follow Path B and attempt safe automatic revision without requiring another candidate question.
- Return `HUMAN_REVIEW_REQUIRED` under Path B only when material factual risk remains after the second automatic revision.
- Never present a risky draft as `final_resume`.

After Fact Check passes, show the complete text resume and request user content confirmation before file generation unless the user explicitly asked to skip that confirmation.

Only a `final_resume` with `fact_check_status: PASS` and resolved `content_confirmation_status` may enter HTML, LaTeX, or PDF generation.

## Final Output Core Routing

Read [references/output-schema.md](references/output-schema.md) before assigning or returning structured fields. Read [references/output-and-rendering.md](references/output-and-rendering.md) before offering or generating files.

- Evaluation only: return `status: MATCH_REPORT`, do not rewrite the resume, and use `output_status: NOT_REQUESTED`.
- Fact-checked tailoring awaiting content approval: return `status: PASS`, show `final_resume`, `change_summary`, and `verification_summary`, then use `content_confirmation_status: AWAITING_USER_CONFIRMATION`.
- Confirmed tailoring without a file decision: use `content_confirmation_status: CONFIRMED`, then use `output_status: AWAITING_USER_CHOICE`.
- A generic confirmation or continuation phrase confirms the current text only. It never selects `original_format`, `html_template`, `both`, or `text_only`; show the output-format question whenever no valid choice already exists.
- Confirmed text-only request or declined file output: return the fact-checked text resume with `output_status: NOT_REQUESTED`.
- Explicit output-variant or template request: after Fact Check passes and content is confirmed, proceed directly to the requested file workflow without asking again. A request for a file type alone does not resolve the variant choice when multiple variants remain available.
- Missing required input: return `NEEDS_INPUT`.
- Unresolved required clarification: return `CLARIFICATION_REQUIRED` and pause.
- Unresolved factual risk after Path A or Path B: return `HUMAN_REVIEW_REQUIRED` and do not present the risky draft as final.

`AWAITING_USER_CONFIRMATION` is a `content_confirmation_status` value only. `AWAITING_USER_CHOICE` and `AWAITING_RENDERER_SETUP_APPROVAL` are `output_status` values only. None may replace the top-level `status`, `assessment_status`, or `fact_check_status`.

Rendering, compilation, dependency, or layout failure alone must never trigger `HUMAN_REVIEW_REQUIRED`. Report operational failures through file-output fields and preserve valid editable source output when possible.

For multiple requested layout variants of one resume version:

- Use the same `final_resume` content in every variant.
- Allow presentation-only differences.
- Generate and validate each variant independently.
- Treat substantively different requested resumes as separate resume versions and Fact Check each one.

Unless the user explicitly requests an annotated resume, `final_resume` and generated resume files contain only employer-facing resume content. Keep match reports, evidence mapping, change summaries, Fact Check metadata, warnings, and renderer diagnostics outside the resume.

Keep these dimensions separate in every result:

- Top-level workflow `status`
- `match_level`
- `assessment_status`
- `fact_check_status`
- `content_confirmation_status`
- Aggregate `output_status`
- Per-variant `compile_status`
- Per-variant `layout_check`
- Per-variant text extraction and viewer compatibility

Do not claim that a resume is guaranteed to pass ATS screening or secure an interview.
