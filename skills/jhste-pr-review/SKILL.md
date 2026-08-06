---
name: jhste-pr-review
description: Review an identifiable GitHub pull request against its actual diff and directly related execution paths. Use when the user explicitly asks for PR code review or problems in PR changes. Discover candidate defects broadly, then post only verified, material, actionable findings. Do not use for summaries, CI diagnosis, implementation, or review-feedback follow-up.
---

# JHSTE PR Review

## Outcome

Inspect the real pull request, search broadly for defects introduced or exposed by the change, then publish only findings supported by inspected evidence.

Do not add an unrequested overview, score, praise, or generic quality assessment.

## Resolve the review surface

Require an identifiable GitHub repository and pull request plus access to the actual diff and changed-file contents. Resolve supplied identifiers or an unambiguous current-branch pull request; do not guess.

Read applicable repository guidance, the complete accessible diff, and only the callers, tests, contracts, configuration, or surrounding code needed to understand changed execution paths. State any material inspection limit without implying a complete review.

## Discover broadly

Identify every plausible defect introduced or directly exposed by the pull request. Do not suppress a candidate merely because confidence is not yet established.

Look for concrete risks to behavior, accessibility, runtime correctness, stability, error handling, data integrity, authorization, sensitive information, performance on affected paths, and compatibility with existing callers or documented contracts. Consider maintainability only when the change creates a demonstrated divergence or makes directly related work unsafe.

Do not treat formatting, naming without impact, optional abstractions, hypothetical extensions, praise, unrelated legacy issues, or repository-wide refactors as defects.

## Validate and publish narrowly

For each candidate, verify:

- the triggering condition or execution path;
- the concrete consequence;
- the affected scope;
- that the issue is introduced or exposed by this pull request;
- the narrowest accurate changed location; and
- a scoped correction direction when clear.

Cluster duplicate symptoms by root cause. Discard speculative, stylistic, unrelated, immaterial, or weakly supported candidates. Prefer no published finding over a low-confidence one.

Make each remaining finding self-contained and actionable. Do not add severity labels, category headers, scores, or principle names unless requested. Never include credentials, private payloads, or unrelated sensitive information.

## GitHub actions

Treat an explicit PR review request as authorization to post review comments on that pull request. Prefer the narrowest accurate inline location and use a general review comment only when no changed line is correct. Submit with `COMMENT` by default.

Use `APPROVE` or `REQUEST_CHANGES` only when the user explicitly requests that exact action. Do not post an empty review or modify code, commits, branches, metadata, labels, reviewers, issues, or merge state unless separately authorized.

## Completion

Report the number of findings posted and summarize each in one sentence. If a verified finding cannot be attached accurately, provide it in full and explain the posting limit.

When no finding survives validation, report that no high-confidence actionable finding was found. Do not imply approval or absence of every defect.
