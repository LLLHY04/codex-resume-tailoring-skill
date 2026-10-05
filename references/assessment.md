# Assessment Rules

Read this file completely when performing JD Analysis, Evidence Mapping, hard-constraint evaluation, clarification that affects classification, or Overall Match assessment.

Use only the candidate-factual sources and conflict rules defined in [SKILL.md](../SKILL.md#source-of-truth-core).

## JD Analysis

When both required inputs are available, analyze the Target Job Description before evaluating the candidate.

JD analysis rules:

- When the Job Description lacks enough `responsibility` or `must_have` requirements to establish an assessment core, stop and return `CLARIFICATION_REQUIRED`. Ask the user to provide a fuller Target Job Description or clarify the role requirements.
- Do not automatically search for or infer missing requirements from similar job postings.
- If the user provides similar job descriptions as reference material, keep them separate from the Target Job Description and do not add their requirements to the assessment unless the user explicitly confirms that those requirements apply to the target role.
- If the user explicitly confirms that a requirement from a Reference Job Description applies to the target role, treat that confirmation as a user-provided clarification of the Target Job Description for this assessment. Record the confirmed target-role wording in `source_text`, identify it as a user-provided clarification, and do not represent unconfirmed reference wording as part of the Target Job Description.
- Treat a user-confirmed target-role clarification as `explicit` for this assessment, but preserve its provenance as a user-provided clarification in `source_text`.
- A user-confirmed requirement may be classified as `hard_constraint` only when it satisfies the `hard_constraint` definition and the user explicitly confirms that it is mandatory for the target role. Reference-job-description wording alone is never sufficient.
- If the user confirms only that a requirement applies to the target role, but does not confirm that it is mandatory, do not classify it as `hard_constraint`.
- Do not treat a Reference Job Description itself as the final Target Job Description or as candidate evidence.
- Break compound sentences into separate, independently assessable requirements.
- Assign each requirement a stable ID such as R1, R2, and R3.
- Preserve the meaning and factual intensity of the original Job Description.
- Do not combine requirements that may have different evidence or match results.
- Do not treat repeated wording as separate requirements.
- Do not invent requirements that are not stated or reasonably implied by the Job Description.
- Keep inferred requirements separate from explicit requirements.
- Never classify an inferred requirement as a hard constraint.
- Use the Job Description only to identify employer requirements, not candidate facts.

For each requirement, record:

- `requirement_id`
- `requirement`
- `type`
- `priority`
- `explicitness`
- `source_text`

Use these `type` values:

- `responsibility`: work the candidate would perform in the role
- `must_have`: required skill, knowledge, or experience
- `preferred`: optional or preferred qualification
- `hard_constraint`: a mandatory condition that directly determines legal employment eligibility or formal eligibility or access to the role, such as work authorization or a legally required professional license

A language, location, degree, availability, years-of-experience, technology, project-scale, proficiency, or ordinary skill requirement is not a `hard_constraint` solely because the Job Description calls it required or mandatory. Classify it as `must_have` or `preferred` unless the Job Description clearly identifies it as an eligibility, legal-employment, or role-access condition.

Use these `priority` values:

- `high`
- `medium`
- `low`

Use these `explicitness` values:

- `explicit`: directly stated in the Target Job Description, or explicitly confirmed by the user as applying to the target role
- `inferred`: reasonably implied but not directly stated

If priority is unclear, judge it from wording, repetition, placement, and relationship to the role's core responsibilities. Do not upgrade a preferred qualification into a must-have requirement.

## Evidence Mapping and Match Classification

For each JD requirement, search all accepted factual sources for relevant candidate evidence. Evaluate each requirement independently.

Use exactly one initial `match_classification` for each requirement:

- `direct_match`: verified evidence shows that the candidate directly performed the required work or demonstrated the required skill at a comparable responsibility, scope, proficiency, and project status
- `partial_match`: verified evidence confirms part, but not all, of the required scope, responsibility, proficiency, duration, or result
- `transferable_skill`: the candidate has not directly demonstrated the requirement, but verified evidence from another context shows a relevant underlying capability
- `unverified`: a possible match exists, but material facts about existence, applicability, scope, responsibility, proficiency, duration, result, or status remain uncertain
- `skill_gap`: no relevant verified evidence is available, or the candidate confirms that they do not have the required experience or skill

Classification rules:

- Base every classification on accepted factual sources.
- Do not classify keyword similarity alone as evidence.
- Do not treat a transferable skill as direct experience.
- Do not upgrade assistance, participation, exposure, learning, or basic knowledge into independent ownership or proficiency.
- Do not assume responsibility for one task proves responsibility for a related task.
- Compare responsibility, scope, proficiency, project status, and results as well as topic similarity.
- Use `partial_match` only when accepted evidence confirms that the candidate satisfies part of the requirement.
- Use `unverified` when a specific factual answer could materially change the classification.
- When clarification is needed, ask a neutral and specific question.
- After a candidate-confirmed answer, update the classification using the new evidence.
- If the candidate cannot confirm the missing fact, do not upgrade the classification.
- Do not ask questions merely to fill every skill gap. Ask only when existing information suggests a plausible match or clarification could materially affect the result or safe resume content.

For each mapped requirement, record:

- `requirement_id`
- `requirement`
- `match_classification`
- `constraint_status`
- `evidence`
- `evidence_source`
- `reasoning`
- `clarification_needed`
- `clarification_question`

Evidence-field rules:

- `evidence` must quote or closely paraphrase the supporting candidate fact.
- `evidence_source` must identify the accepted source, such as Original Resume, Candidate Profile, Additional Resume, or Candidate-confirmed Fact.
- If no evidence exists, use `evidence: none`.
- `reasoning` must explain the relationship without adding candidate facts.
- `clarification_needed` must be `true` or `false`.
- If clarification is not needed, use `clarification_question: none`.

## Hard-Constraint Handling

For `type: hard_constraint`, use exactly these `constraint_status` values:

- `met`: accepted evidence shows that the candidate satisfies the condition
- `unmet`: the candidate explicitly confirms they do not satisfy it, or accepted evidence clearly shows it is not met
- `unverified`: available information is insufficient to decide

For every other requirement type, use `constraint_status: none`.

Rules:

- Every requirement correctly classified as `hard_constraint` is material by definition.
- If a condition is not material to eligibility, legal employment, or role access, do not leave it classified as `hard_constraint`; reclassify it as `must_have` or `preferred` according to the wording.
- Do not use `partial_match` or `transferable_skill` as the final decision for a hard constraint.
- Missing evidence is not proof that a hard constraint is `unmet`.
- A transferable skill is not proof that a hard constraint is `met`.
- If a hard constraint is `unverified`, ask a specific, neutral clarification question before final assessment.
- Treat every hard constraint as potentially material to the overall decision unless the Target Job Description clearly indicates otherwise; if it is clearly non-material, reclassify it instead of retaining `hard_constraint`.

If `match_classification` is required for every requirement, map hard constraints only as follows:

- `met` → `direct_match`
- `unmet` → `skill_gap`
- `unverified` → `unverified`

`constraint_status` remains authoritative.

## Overall Match Assessment

Evaluate the result in this importance order:

1. Hard constraints
2. High-priority must-have requirements
3. High-priority responsibilities
4. Medium- and low-priority requirements
5. Preferred qualifications

Define the assessment core:

1. Use `priority: high` requirements whose type is `responsibility` or `must_have` when they exist.
2. If none exist, use `responsibility` and `must_have` requirements at the highest priority level present.
3. Keep every `hard_constraint` outside the assessment core and evaluate it through `constraint_status`.
4. If no `responsibility` or `must_have` requirements exist, return `CLARIFICATION_REQUIRED` and ask for a fuller Job Description or clearer role requirements. Do not ask for candidate evidence for an undefined requirement.

This Job Description completeness clarification differs from candidate-fact clarification.

For assessment-core threshold calculations:

- `direct_match`, `partial_match`, and `transferable_skill` count as supported.
- `partial_match` and `transferable_skill` do not directly satisfy a `must_have` for `HIGH_MATCH`.
- `unverified` is neither supported nor a `skill_gap`.
- “At least half” means the ceiling of half the assessment-core count: 1 of 1, 2 of 3, and 2 of 4.

Apply level boundaries in this order: `LOW_MATCH`, `HIGH_MATCH`, then `MEDIUM_MATCH`.

### HIGH_MATCH

Require all of the following:

- All hard constraints are `met`, or none exist.
- Every `must_have` requirement is `direct_match`.
- No assessment-core requirement is `skill_gap` or `unverified`.
- At least half of assessment-core requirements are `direct_match`.
- Any remaining `skill_gap` belongs only to a `preferred` requirement or to a low-priority requirement whose type is not `must_have`.

### MEDIUM_MATCH

Require all of the following:

- No hard constraint is `unmet`.
- At least half of assessment-core requirements are supported.
- The requirements satisfy neither `LOW_MATCH` nor `HIGH_MATCH`.

### LOW_MATCH

Use `LOW_MATCH` when any condition is true:

- A hard constraint is `unmet`.
- At least two assessment-core requirements are `skill_gap`.
- At least two `must_have` requirements with `priority: high` or `priority: medium` are `skill_gap`.
- Fewer than half of assessment-core requirements are supported.

Do not use undefined threshold terms such as `most`, `multiple`, `strong partial matches`, or `little verified evidence`.

Assessment rules:

- Do not count all requirements equally.
- Preferred qualifications and transferable skills cannot compensate for an `unmet` hard constraint.
- Do not treat transferable skills as direct matches.
- Any `unmet` hard constraint produces `LOW_MATCH`.
- Any `unverified` hard constraint prevents a final assessment and makes `assessment_status: PRELIMINARY`.
- Return `CLARIFICATION_REQUIRED` before final tailoring when an unverified hard constraint could affect the decision.
- Do not produce a final tailored resume or `PASS` while a material hard constraint remains `unverified`.
- After the candidate confirms a hard constraint, recalculate Overall Match.
- Missing hard-constraint evidence is neither `met` nor `unmet`.
- If an `unverified` assessment-core or `must_have` requirement could change the final level, return `CLARIFICATION_REQUIRED`, set `assessment_status: PRELIMINARY`, and explain what must be confirmed.
- While material clarification is pending, do not produce a final assessment or final resume.
- After confirmation, update the classification and recalculate.
- If the candidate declines or cannot confirm, retain `unverified`; do not convert it automatically to `skill_gap`. Continue when the uncertain information can be safely excluded or weakened. Otherwise use Path A from [tailoring-and-fact-check.md](tailoring-and-fact-check.md).
- A missing preferred qualification alone does not cause `LOW_MATCH`.
- Do not generate a numerical percentage unless explicitly requested. If requested, label it an estimate and explain the factors.
- Explain the level with mapped evidence rather than unsupported conclusions.

Record:

- `match_level`
- `assessment_status`
- `match_summary`
- `key_strengths`
- `key_gaps`
- `unresolved_questions`
- `recommendation`

Use these `assessment_status` values:

- `FINAL`: sufficient verified information is available
- `PRELIMINARY`: unresolved information could materially change the level

The recommendation may say the candidate appears ready to apply, could apply after strengthening the resume or confirming facts, or may benefit from targeting another role. Do not discourage an application solely because the match is not high.
