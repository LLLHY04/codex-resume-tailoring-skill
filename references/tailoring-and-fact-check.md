# Tailoring and Fact Check

Read this file when selecting resume content, drafting or revising a tailored resume, checking JD coverage before drafting, performing claim-level Fact Check, or resolving a factual risk through Human Review.

## Structured Candidate Clarification

When a material candidate fact is missing, ambiguous, or conflicting, pause before drafting the affected content and ask a structured clarification question.

Ask only about facts that may materially affect factual accuracy, timeline consistency, responsibility level, proficiency, project status, match assessment, or final-resume wording. Typical topics include:

- Project, employment, or education dates and duration
- Responsibility scope or ownership level
- Tools actually used
- Project status, including whether it was planned, practiced, tested, completed, launched, or deployed
- Measured outcomes and metric provenance
- Proficiency level

Use the existing `CLARIFICATION_REQUIRED` route with:

- `status: CLARIFICATION_REQUIRED`
- `reason_for_questions: candidate_fact_clarification`
- `questions`: the specific facts requiring confirmation

Group related questions into one clarification turn when practical. The questions may be structured or selectable when the client supports that interaction, but do not assume control over the client's native popup interface.

Do not infer a date, duration, title, responsibility, outcome, proficiency, or project status from the Target Job Description, a filename, file order, visual layout, surrounding context, or common expectations for the role.

When a missing fact is not essential, offer a neutral omission option. If the candidate does not know or declines to provide the fact, omit it from the tailored resume and continue when safe. Do not convert omission into a stronger claim.

After the candidate confirms a fact, use the confirmed fact without repeating the same question. If answers conflict or a material conflict remains unresolved, follow the existing conflict and Human Review Path A rules.

## Pre-Draft Candidate Fact Completeness Check

After selecting the experiences and projects for the tailored resume but before drafting them, inspect every selected entry for the facts needed by its intended structure.

If a selected project has no date or duration in an accepted factual source, proactively ask the candidate once before drafting that entry. Use:

- `status: CLARIFICATION_REQUIRED`
- `reason_for_questions: candidate_fact_clarification`
- `questions`: the selected projects and the missing dates or durations

Also ask about a missing role or project-status label when it materially affects accuracy, timeline credibility, JD matching, responsibility interpretation, or whether the entry would otherwise be misleading or incomplete.

Group missing dates and related facts into one clarification turn when practical. Offer the candidate a neutral choice to provide the fact or omit the unsupported field from the tailored resume.

Do not infer the missing information from filenames, document order, nearby entries, the Target Job Description, common project timelines, or the current date.

Do not begin the affected final draft until every required missing fact is confirmed, safely omitted, or routed through the existing Human Review rules. If the candidate declines a non-essential date or duration, omit it and continue when safe; do not repeat the same question.

## Resume Scope and Relevance Selection

By default, produce a targeted resume rather than reproducing every item from the Original Resume. Optimize for relevance and clarity rather than maximum source coverage.

Before drafting, classify verified candidate facts by relevance to the Target Job Description:

- `high`: directly supports a `must_have` requirement or an assessment-core responsibility
- `medium`: supports a preferred requirement, a non-core responsibility, or a relevant transferable skill
- `low`: is weakly related or unrelated to the target role

Include high-relevance evidence first. Include medium-relevance evidence when space and document purpose allow. Compress or omit low-relevance content when doing so improves focus without creating a misleading account of the candidate's background.

Do not select content by relevance alone. Rank otherwise eligible facts using:

1. Direct relevance to the Target Job Description
2. Strength and specificity of the supporting evidence
3. Recency
4. Verified outcomes, metrics, or artifacts
5. Usefulness for differentiating the candidate
6. Importance to the candidate's intended positioning

Omitting a verified fact from a targeted resume does not invalidate or delete it from the candidate's source record. It means only that the fact was not selected for this resume version.

Do not invent, strengthen, weaken, or otherwise change a fact while selecting or compressing content.

Preserve verified identity, contact, and education information essential to the requested resume, and preserve any verified experience or section the user explicitly asks to retain.

If the user requests a complete resume, academic CV, or full employment history, do not apply JD-based omission to verified source content that belongs in that document type unless the user asks to shorten it.

Retain an otherwise lower-relevance experience when it is necessary to explain chronology, avoid a misleading employment history, or support an important transferable skill.

When space is limited, prioritize role-specific evidence over low-relevance tools, technologies, coursework, or general skills. Retain an otherwise unrelated skill only when it supports a relevant transferable capability, materially improves positioning for the target role, or the user explicitly asks to retain it.

For a one-page targeted resume:

- Normally prioritize approximately two to four of the most relevant projects or experiences and approximately two to four evidence-based bullets for each major entry. Treat these as readability guidelines, not fixed quotas.
- Compress implementation details that do not materially improve relevance.
- Do not add unrelated experience or skills merely to fill space or disguise an important gap.
- Make substantive inclusion, omission, and wording decisions before the final Fact Check so later layout variants can use the same final content.
- If the selected content cannot remain readable, reduce verified low-priority content under these rules or use a two-page version when the user allows it.
- If the user requires one page and safe reduction would remove high-relevance evidence or create a misleading history, report the tradeoff rather than silently removing content.

Do not remove high-relevance facts merely to shorten the document or solve a layout problem. First adjust wording, spacing, section density, or page count without changing factual meaning. If relevant verified content still cannot fit safely, preserve it in the editable source or text resume and report the layout issue.

Lower-relevance experiences may be omitted, merged with related experience, reduced to one concise line, or shortened to one or two bullets when factual meaning is preserved.

When material content is compressed or omitted, use `change_summary` to distinguish:

- Facts omitted for relevance or length
- Facts shortened without changing meaning
- Claims excluded because they were unsupported
- Facts still awaiting user clarification

Do not describe relevance-based omission as a factual correction, factual loss, or proof that the candidate lacks the omitted experience.

## Detail Compression and One-Page Preference

For an early-career targeted resume, prefer a readable one-page version when feasible. Follow an explicit request for a complete or full-detail resume. Use two pages when material high-priority evidence cannot fit safely on one page, and report the tradeoff.

Do not first draft a full-detail resume and remove content only after page overflow. Select and compress content before the final Fact Check.

When selected content is too dense, compress in this order:

1. Remove repeated wording.
2. Merge overlapping bullets.
3. Shorten background explanations.
4. Keep the strongest verified result, artifact, or metric and reduce lower-value implementation details.
5. Merge related supporting experiences.
6. Omit lower-relevance experiences.
7. Simplify the Tools and Languages section.
8. Adjust spacing and layout.
9. Reduce font size only within a readable range.

Preserve high-priority JD evidence, verified responsibilities, verified metrics, important project outputs, project status, responsibility level, and proficiency level.

Do not compress in a way that changes responsibility, proficiency, causality, outcome, project status, or factual meaning. Do not solve overflow through excessively small fonts, unreadable line spacing, removal of the strongest JD evidence, or unreported deletion of material selected content.

When producing one page, report the main content tradeoffs in `change_summary`. The source evidence pool remains the factual record even when the tailored resume contains only a selected subset.

## Pre-Draft JD Coverage Check

Before drafting, review the completed requirement mapping and relevance selections.

- For every high-priority and assessment-core requirement, confirm whether verified evidence will appear in the resume, whether only partial or transferable evidence is available, or whether the item remains `unverified` or a `skill_gap`.
- Keep requirements without verified evidence identified as gaps or unresolved items in the assessment. Do not create content merely to make a requirement appear covered.
- Verify that each JD term or keyword planned for the resume is supported by candidate evidence with the same meaning and factual intensity.
- Do not treat keyword presence as requirement coverage when underlying evidence is missing.
- If an `unverified` requirement triggers clarification under [assessment.md](assessment.md), pause before drafting rather than using speculative wording.

This check does not replace Evidence Mapping, change a match classification, or recalculate Overall Match. It prevents mapped gaps from becoming unsupported resume claims.

## Resume Tailoring Rules

Tailor only from verified candidate facts and completed evidence mapping. Improve relevance, clarity, structure, and emphasis without changing factual meaning or intensity.

Allowed actions:

- Reorder verified experience and skills to prioritize relevant evidence.
- Rewrite unclear or repetitive wording into concise resume language.
- Use JD terminology only when verified evidence supports the same meaning.
- Emphasize verified actions, responsibilities, tools, and results.
- Make transferable skills visible while preserving the context in which they were demonstrated.
- Condense repeated or low-relevance content under the scope rules above.
- Preserve the candidate's original language unless the user requests translation or another language.

Factual-preservation rules:

- Preserve responsibility distinctions such as assisted, participated, collaborated, managed, led, and independently owned.
- Preserve proficiency distinctions such as learning, familiar with, basic knowledge, working knowledge, proficient, and expert.
- Preserve project-status distinctions such as planned, learning, in progress, tested, completed, launched, and deployed.
- Preserve the difference between an action, observation, hypothesis, and verified causal result.
- Distinguish proposed metrics, planned metrics, target metrics, and measured results.
- For a personal, simulated, planned, or non-launched project, use status-accurate wording such as `proposed`, `planned`, `designed`, `intended to measure`, or `target metric` when supported.
- Do not describe a proposed, planned, intended, or target metric as an achieved result.
- Do not imply product, business, user, or operational impact without verified evidence that it occurred.
- Preserve dates, duration, employment type, role titles, tools, and project scope.
- Use metrics only when they appear in an accepted factual source.
- Do not calculate, estimate, round, combine, or derive new metrics unless the candidate explicitly requests the calculation and provides sufficient data.
- Do not present skill gaps or employer requirements as candidate qualifications.
- Never change a transferable skill into direct experience.

Writing rules:

- Prefer clear action verbs that match the verified responsibility level.
- Prioritize relevant evidence over keyword repetition.
- Avoid keyword stuffing and unsupported promotional language.
- Do not add generic claims such as excellent communication, strong leadership, or proven analytical ability unless supported.
- Do not remove facts solely because they do not match the JD if doing so would create a misleading account.
- For `LOW_MATCH`, clearly report the level and key gaps without disguising the mismatch.
- If tailoring was requested, continue after `LOW_MATCH` when required inputs are available and no clarification or safety gate blocks the process. Do not ask for confirmation again merely because the level is low.
- If evaluation only was requested, return `MATCH_REPORT` without tailoring.

STAR guidance:

- Use Situation, Task, Action, and Result as a reasoning framework when enough verified information exists.
- Keep Situation and Task concise; emphasize verified Actions and Results.
- Do not force every bullet to contain all four elements.
- Do not invent a missing element, metric, or lesson learned.
- Describe qualitative results as qualitative rather than converting them into numbers.
- Include lessons learned only when explicitly provided and useful.

Before finalizing each rewritten bullet, ensure every meaningful claim is traceable to an accepted factual source.

## Role-Specific Summary or Core Capabilities

For a role-tailored early-career resume, include a concise two-line `Core Capabilities` or equivalent professional-summary section by default when all of these conditions are met:

- The user requested resume tailoring.
- The Target Job Description contains multiple important requirements.
- The candidate has at least two verified strengths relevant to those requirements.

Treat this as the default inclusion rule, not a discretionary suggestion.

In the default section order, place Core Capabilities immediately after Education and before the first Work Experience or Projects section. Do not move it ahead of Education unless the user explicitly requests that order or an explicitly selected template requires it.

It may contain the candidate's verified professional direction, two or three verified strengths most relevant to the Target Job Description, and one concise evidence-based positioning statement. Do not omit it merely because projects already contain detailed evidence or because the resume is intended to fit one page.

Use only accepted, verified candidate facts. If a statement requires information beyond the accepted sources, clarify it before use and record the answer as a Candidate-confirmed Fact.

Do not introduce unsupported job titles, industries, proficiency levels, project status, generic strengths without evidence, or claims inferred only from the Job Description. Do not repeat the complete Tools and Languages section or the entire resume.

Omit Core Capabilities only when the user explicitly declines it, the target direction is already fully and explicitly communicated by the header and first selected entry so the section would add no distinct verified information, or insufficient verified evidence exists to write it safely. Record a non-user-requested omission and its reason in `change_summary`.

## Concise Tools and Languages Section

For a targeted resume, replace a broad or descriptive Skills section with a concise `Tools and Languages` section, or the appropriate equivalent in the resume language, whether or not Core Capabilities is included. This is a keyword-scanning section, not a second skills summary.

It may contain only:

- verified tool, software, and platform names
- verified programming or query language names
- verified human-language proficiency or test scores

List only verified items relevant to the Target Job Description. Preserve concise proficiency qualifiers such as `basic`, `working knowledge`, native language, or a verified test score. Do not imply proficiency by listing a tool without an applicable qualifier when the evidence supports only limited familiarity.

Do not include capability, task, method, responsibility, or project-evidence descriptions. Exclude phrases such as data cleaning, abnormal-value identification, data comparison, chart analysis, PRD writing, user-flow design, AI workflow design, user research, content review, or customer communication. Place supported details in Core Capabilities, Projects, or Experience instead.

Normally use no more than two short lines or two short bullets, for example one `Tools` line and one `Languages` line. Parenthetical text may contain only a concise verified proficiency qualifier or language score, not a task description, project name, use case, or evidence narrative.

Prefer a compact structure such as `Tools: Figma, n8n, Excel, R/RStudio, Python (basic)` and `Languages: Chinese (native), English (verified proficiency or test score)`. Do not repeat detailed project evidence in this section.

If the candidate has no verified human-language information, omit the Languages group rather than inventing it. If only tools are available, use an accurate heading such as `Tools` instead of implying that language information exists.

## Fact Check and Revision

After drafting, perform a claim-level factual review before presenting a final resume.

1. Break the draft into meaningful factual claims.
2. Compare each claim with accepted factual sources.
3. Confirm support for the same experience, skill, metric, responsibility level, proficiency, result, causality, date, and project status.
4. Record every unsupported or overstated claim as a risk item.
5. If material risk exists, revise using only verified facts.
6. Run Fact Check again after revision.
7. Allow no more than two automatic revision cycles.
8. If material risks remain after the second revision, stop and return `HUMAN_REVIEW_REQUIRED` through Path B.

Revision-cycle numbering:

- `revision_cycle: 0`: initial draft Fact Check
- `revision_cycle: 1`: Fact Check after the first automatic revision
- `revision_cycle: 2`: Fact Check after the second automatic revision
- No automatic revision may occur after cycle 2.

Use these fact-check statuses:

- `PASS`: every meaningful factual claim is supported at the same or a weaker factual intensity
- `FAIL`: one or more material factual risks remain
- `HUMAN_REVIEW_REQUIRED`: Path A or Path B has reached its defined terminal factual-safety condition

`FAIL` is an internal intermediate status used only between Fact Check and automatic revision. It is not a top-level final status. Successful automatic revision proceeds to `fact_check_status: PASS`; material risk remaining after the limit proceeds to Path B.

### Human-review routing

`HUMAN_REVIEW_REQUIRED` can be triggered by either of two independent paths.

Path A — clarification path:

1. A missing, conflicting, or candidate-dependent fact is identified.
2. Ask a neutral clarification question first.
3. The candidate answers, declines, or explicitly states that they cannot confirm.
4. Return `HUMAN_REVIEW_REQUIRED` only if the issue, conflicting fact, or claim still cannot be safely resolved, weakened, removed, or excluded and would affect the factual accuracy of the final resume.

Path B — fact-check revision path:

1. A tailored draft contains an unresolved material risk.
2. Attempt up to two automatic revision cycles.
3. If material risk remains after the limit, return `HUMAN_REVIEW_REQUIRED` directly.
4. Do not ask another question when accepted factual sources already prove the claim unsupported or overstated.

Use these risk types:

- `fabricated_experience`
- `fabricated_skill`
- `fabricated_metric`
- `responsibility_inflation`
- `proficiency_inflation`
- `project_status_inflation`
- `result_exaggeration`
- `causality_inflation`
- `temporal_inaccuracy`
- `unsupported_claim`

Use these severity levels:

- `high`: invents or materially changes a candidate fact
- `medium`: stronger or more certain than the verified source and could mislead
- `low`: the core fact remains accurate, but wording should be narrowed or clarified

`material risk` means an unresolved risk with `severity: high` or `severity: medium`. An unresolved `low` risk is not material if it can be safely corrected without changing factual meaning.

Fact-check rules:

- A claim passes only when an accepted factual source supports its meaning and intensity.
- JD keyword alignment is not factual support; absence of contradiction is not proof.
- Do not approve a claim merely because it sounds plausible or use one fact to support another.
- Any unresolved high or medium risk prevents `PASS`.
- Use the closest supported wording or remove a risky claim.
- If safe revision requires a missing fact, first ask a specific, neutral, non-leading question.
- If answered, use the candidate-confirmed fact and continue.
- If declined or unconfirmed, weaken to existing support or remove the claim.
- Under Path A, return Human Review only when the issue cannot be safely resolved, weakened, removed, or excluded and the unresolved fact affects final-resume accuracy.
- Do not strengthen a claim while correcting it.
- Preserve original wording when no safer improvement is supported.
- Correct low risks automatically and record the correction.
- Never label a resume fact-checked when the status is `FAIL` or `HUMAN_REVIEW_REQUIRED`.

For each risk item, record:

- `claim`
- `source_fact` (`none` when no support exists)
- `source`
- `risk_type`
- `severity`
- `explanation`
- `safe_revision`

For the complete Fact Check, record:

- `fact_check_status`
- `revision_cycle`
- `risk_items`
- `verification_summary`

For Human Review, do not present a risky draft as final. Under Path A, identify unresolved issues, conflicting facts or claims, and facts to confirm. Under Path B, identify unresolved material risks and revisions attempted without implying that candidate confirmation is required when existing sources already establish the risk.

## Final Resume Content Boundary

Unless an annotated resume is explicitly requested, `final_resume` contains only the employer-facing resume.

Do not place match assessment, requirement or evidence mapping, change summary, Fact Check metadata, revision information, source provenance, warnings, internal analysis, layout diagnostics, or renderer status inside `final_resume`.

Keep those items in their applicable report, summary, or metadata fields. Generate HTML, LaTeX, and PDF files only from the fact-checked employer-facing content in `final_resume`; never copy the complete assistant response into the resume document.

Do not add sections such as “Modification Notes,” “Fact Check,” “Verification,” “JD Match,” or “Evidence Mapping” unless the user explicitly requests an annotated resume.
