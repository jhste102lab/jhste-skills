---
name: jhste-pr-review
description: Review an identifiable GitHub pull request against its actual diff and directly related code, return only high-confidence actionable findings, and optionally post them as GitHub review comments when the user explicitly asks to post or submit the review. Use when the user explicitly requests a PR code review or asks to identify problems in PR changes. Do not use merely because a pull request is mentioned, or for PR summaries, review-feedback follow-up, CI debugging, implementation, general code analysis, or branch inspection.
---

# JHSTE PR Review

## Outcome

Review the actual pull request changes and report only concrete, actionable problems supported by inspected evidence. Keep the review read-only unless the user separately authorizes GitHub comments.

Do not add an unrequested pull request overview, score, praise, or broad quality assessment. If the user explicitly requests an overall assessment, ground it in the findings and state any material inspection limit.

## Required context

Require an identifiable GitHub repository and pull request plus access to the actual diff and changed-file contents. Resolve a supplied URL, repository and number, or an unambiguous current-branch pull request. Do not guess between possible repositories or pull requests.

If access, size, or tool limits prevent inspection of a material part of the changes, state the exact limit and do not imply that the complete pull request was reviewed.

## Workflow

1. Resolve the repository, pull request, base, and head.
2. Read applicable repository and contributor guidance.
3. Inspect the complete accessible diff and every changed file relevant to the requested review.
4. Read only the surrounding code, callers, tests, contracts, or configuration needed to verify a changed path.
5. Identify problems introduced or directly exposed by the pull request.
6. For each candidate, verify the triggering condition, concrete consequence, affected scope, and correction direction.
7. Cluster duplicate symptoms by root cause and remove speculative, stylistic, unrelated, or low-impact findings.
8. Return the remaining findings and post them only under the GitHub write boundary below.

## Finding threshold

Report a finding only when inspected code supports a credible material risk to one or more of:

- user-visible behavior or accessibility;
- runtime correctness, stability, error handling, data integrity, authorization, or sensitive information;
- performance or resource use on an affected execution path;
- compatibility with existing callers, types, APIs, ordering, nullability, or documented behavior;
- maintainability when the change creates a concrete divergence or makes a directly related future change unsafe.

Use design principles only to diagnose a demonstrated consequence. Do not assume production scale, a threat model, or a future extension that the repository and change do not support.

Do not report personal preferences, formatting or naming without impact, optional abstractions, generic complexity advice, hypothetical extensions, praise, nice-to-have improvements, unrelated legacy issues, or repository-wide refactors. Prefer no finding over a low-confidence finding.

## Finding format

Make each finding self-contained and actionable. Include the changed location or behavior, the condition or execution path, the concrete consequence, and a scoped correction direction when clear.

Keep unrelated findings separate. Do not add severity labels, category headers, scores, or principle names unless the user requests them. Do not include credentials, tokens, private payloads, or unrelated sensitive information.

## GitHub write boundary

Treat an explicit request to review a pull request as authorization to analyze it, not as authorization to write to GitHub.

Post comments only when the user explicitly asks to post, leave, or submit review feedback on GitHub. Prefer an inline comment on the narrowest accurate changed line; use a general review comment only when no changed line is accurate. Submit with the `COMMENT` event by default.

Use `APPROVE` or `REQUEST_CHANGES` only when the user explicitly requests that exact action. Do not post an empty review. Do not modify code, commits, branches, pull request metadata, labels, reviewers, issues, or merge state unless separately authorized.

## Completion

For a read-only review, identify the pull request and provide one concise actionable item per finding. State that nothing was posted.

When comments were authorized and posted, report the number posted and summarize each finding in one sentence. If a finding could not be attached or posted accurately, provide it in full and explain the posting limit.

When no finding remains, report that no high-confidence actionable finding was found; do not imply approval or absence of all defects. When the changes were unavailable, report the access limitation without inventing findings.

Before completing, verify that every finding is supported by inspected code, introduced or exposed by the pull request, material, non-duplicative, and within scope, and that every GitHub write had explicit authorization.
