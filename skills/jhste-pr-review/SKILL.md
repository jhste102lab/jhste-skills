---
name: jhste-pr-review
description: Review GitHub pull requests against the actual PR diff and accessible repository code, post only high-confidence actionable findings, and briefly summarize the review for the user. Use only when the user explicitly asks to review a PR, perform a PR code review, or identify problems in PR changes. Do not invoke merely because a pull request is mentioned, or for PR summaries, explanations, review-comment follow-up, CI debugging, implementation, general code analysis, or branch inspection without an explicit review request.
---

# JHSTE PR Review

## Outcome

Review the actual pull request changes, identify concrete engineering problems, post actionable review comments to GitHub whenever possible, and give the user a brief bullet summary of what was reviewed.

Do not provide a general quality assessment, score, impression, praise, strengths-and-weaknesses summary, or broad explanation of the pull request.

## Required input

Require an identifiable GitHub repository and pull request.

Accept any of the following:

- a pull request URL;
- an owner/repository identifier and pull request number;
- a repository name and pull request number when the repository can be resolved unambiguously;
- an unambiguous pull request resolved from the current authenticated Git context.

Do not guess when multiple repositories or pull requests could match.

Require access to the actual pull request diff and changed file contents. Treat the repository as potentially private and rely only on content that is actually accessible.

## Workflow

1. Resolve the repository and pull request.
2. Read applicable repository guidance, including contributor instructions and agent guidance when available.
3. Inspect the pull request metadata, complete accessible diff, and changed files.
4. Read only the surrounding or existing code needed to understand a changed path, contract, dependency, or failure mode.
5. Identify concrete problems introduced or directly exposed by the pull request.
6. Validate every proposed finding against the inspected code and a plausible failure or maintenance scenario.
7. Remove speculative, duplicate, stylistic, or low-impact findings.
8. Post each remaining finding to the narrowest accurate changed line when possible.
9. Submit review feedback with the `COMMENT` event.
10. Return a concise completion result and a short bullet summary of the findings.

Do not imply that the complete pull request was reviewed when tool, size, access, or truncation limits prevented inspection of a material part of the diff.

## Review standard

Review from the perspective of a senior engineer responsible for a large production service.

Comment only when the change creates a material risk to one or more of the following:

- user-visible behavior or accessibility;
- runtime correctness, stability, or error handling;
- data integrity, authorization, or sensitive information;
- page loading, rendering, network, memory, or execution performance;
- maintainability and the safety of future changes;
- natural extension of the implemented behavior;
- compatibility with existing contracts, callers, types, APIs, and repository patterns.

Use SOLID principles as diagnostic tools rather than mandatory review categories.

Raise a SOLID-related finding only when the inspected code demonstrates a concrete consequence, such as:

- mixed responsibilities that make behavior difficult to change or verify safely;
- extension paths that require repeated modification of unrelated existing code;
- incompatible subtype, component, or interface behavior;
- oversized props, interfaces, APIs, or dependencies that force unrelated coupling;
- policy or domain logic coupled unnecessarily to a concrete implementation.

Also inspect for:

- invalid or unhandled states;
- unsafe assumptions about nullability, ordering, timing, retries, or external data;
- error paths that silently report success or leave inconsistent state;
- duplicated responsibility that can cause behavior to diverge;
- unnecessary work on loading or rendering paths;
- stale closures, race conditions, lifecycle errors, or resource leaks;
- changes that violate an established caller-visible contract;
- incomplete integration with directly related existing code.

Mention existing unchanged code only when the pull request directly depends on it, modifies its assumptions, or exposes a concrete problem through it.

Do not expand the review into an unrelated legacy audit or request a repository-wide refactor.

## Finding threshold

Write only findings that are supported by inspected code and have a credible impact.

Do not comment on:

- personal preferences;
- formatting, naming, or organization without material impact;
- optional abstractions with no demonstrated need;
- hypothetical extensions unsupported by the current change;
- low-probability speculation;
- broad clean-code advice;
- generic statements about complexity;
- praise or positive observations;
- improvements that are merely nice to have;
- issues unrelated to the pull request;
- large refactors outside the review scope.

Do not manufacture findings to increase the comment count. Prefer no comment over a low-confidence comment.

## Comment format

Write each comment as a concise, self-contained explanation that a developer or coding agent can act on directly.

Include naturally:

- the precise changed location or behavior involved;
- the condition or execution path that exposes the problem;
- the concrete consequence;
- the affected dimension, such as user experience, stability, performance, maintainability, or extensibility;
- a scoped correction direction when one is reasonably clear.

Describe observable behavior and failure conditions instead of relying on abstract principle names.

Do not add severity labels, category headers, scores, or boilerplate unless the user explicitly requests them.

Do not combine unrelated findings into one comment.

## GitHub actions

Treat an explicit request to review a pull request as authorization to post review comments to that pull request.

Prefer inline comments attached to relevant changed lines. Use a general pull request review comment only when a finding cannot be attached accurately to a changed line.

Submit the review with the `COMMENT` event.

Do not use `APPROVE` or `REQUEST_CHANGES` unless the user explicitly requests that exact action.

Do not modify code, create commits, push branches, edit the pull request description, change labels, assign reviewers, close, merge, or otherwise alter the repository unless separately requested.

Do not post an empty review.

## User summary

After the review, briefly tell the user what was reviewed.

Use one short bullet per finding. Paraphrase the issue instead of copying the full GitHub comment. Keep each bullet to one sentence and focus on the concrete risk or behavior reviewed.

Use this shape when all findings were posted:

```text
Posted <count> review comment(s) on <owner/repository>#<number>.
- <brief finding summary>
- <brief finding summary>
```

When some findings could not be posted accurately, state how many were posted, include the same brief summary bullets for all findings, then include only the unposted comments in full.

When review comments cannot be posted at all, provide each review comment in full, followed by the brief summary bullets.

Do not add a separate PR overview, quality assessment, progress report, or explanation of the review process.

## No-finding and access outcomes

When no high-confidence finding remains, return only:

`No high-confidence review comments to add.`

When the pull request diff or changed files cannot be accessed, return only:

`Unable to review the pull request because its changes were unavailable.`

## Final checks

Before posting each finding, verify that:

- the finding is supported by the inspected diff or directly related code;
- the pull request introduces, changes, or directly exposes the problem;
- the failure condition or engineering consequence is concrete;
- the impact is material enough to justify interrupting the author;
- the finding does not depend on an unverified assumption;
- the comment is attached to an accurate changed line when possible;
- the correction direction remains within the pull request scope;
- the finding does not duplicate another comment;
- the comment contains no credentials, tokens, private payloads, or unrelated sensitive information.

Before completing, verify that:

- every posted comment meets the finding threshold;
- the user summary includes one concise bullet per finding;
- no empty review was submitted;
- no approval or change-request decision was made without explicit authorization;
- no unsupported claim of complete review was made.
