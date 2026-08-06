---
name: jhste-review-followup
description: Validate feedback already posted on an existing GitHub pull request, implement only justified fixes, verify the result, and update the existing PR head branch. Use when the user asks to inspect, address, or fix existing PR review comments. Do not use for an initial review, PR summary, unrelated implementation, CI diagnosis, merging, thread resolution, or issue closure.
---

# JHSTE Review Follow-up

## Outcome

Evaluate existing pull request feedback against the current code and execution context. Fix only verified root causes, validate the result, and update the existing pull request branch.

Existing feedback defines the scope. Do not perform a new general review or manufacture additional findings as a substitute.

## Resolve and assess the feedback

Identify the repository, pull request, base, head branch, working state, and thread-aware review data. Do not guess between possible pull requests or treat a flat comment list as complete when outdated or resolved state matters.

Inspect the referenced code and only the surrounding callers, tests, guidance, contracts, or execution paths needed to verify each comment. Cluster comments that describe the same root cause and classify them as:

- valid and requiring a change;
- valid but already satisfied;
- incorrect or based on a false assumption;
- outdated or duplicated;
- informational or better answered with explanation; or
- blocked by missing context.

Do not implement a reviewer's proposed solution mechanically. Verify the underlying problem.

## Apply justified fixes

Make the smallest change that fixes each supported root cause. Preserve established contracts and avoid unrelated refactoring, style cleanup, speculative hardening, generated-file churn, or another workstream's changes.

If no change is justified, do not create an empty commit or push.

## Verify and update the existing PR

Use the strongest available signal that directly exercises the corrected behavior. Expand validation only when risk, integration surface, or an observed failure justifies it. Distinguish task-caused failures from pre-existing, unrelated, or environmental failures.

Inspect the final task-owned diff, commit only traceable fixes, and push to the existing pull request head branch. Do not replace the pull request, push to the base branch, rewrite unrelated commits, or force-push without explicit authorization.

Do not merge, enable auto-merge, reply to or resolve review threads, alter issues, or delete branches or worktrees unless separately requested.

## Completion

Report the feedback inspected, its dispositions, fixes made, evidence used, and commit and push status. Mention an omitted action only when it materially affects what the user should do next.
