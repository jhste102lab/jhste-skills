---
name: jhste-review-followup
description: Assess review feedback already posted on an existing GitHub pull request and implement only justified fixes. Use when the user explicitly asks to inspect, verify, address, or follow up on existing PR review comments. Keep inspect or verify requests read-only. Modify, commit, and push the existing PR head branch only when the user explicitly asks to apply fixes and update or push the PR. Do not use for an initial review, PR summary, CI debugging, unrelated implementation, merging, review-thread resolution, cleanup, or issue closure.
---

# JHSTE Review Follow-up

## Outcome

Evaluate existing pull request feedback against the code and actual execution context. Distinguish valid issues from incorrect, outdated, duplicate, informational, or already-satisfied comments. Apply only justified fixes at their root cause.

Existing review feedback defines the scope. Do not perform an initial review or manufacture additional findings as a substitute. The feedback may come from `jhste-pr-review` or any other reviewer; this skill does not depend on another skill.

## Modes and authorization

Use assessment mode when the user asks to inspect, verify, summarize, or judge existing feedback. Report the assessment without editing, committing, or pushing.

Use update mode only when the user explicitly asks to apply or address fixes and update or push the pull request branch. Respect any selected threads. An unqualified request to address all review feedback means all unresolved, clearly actionable items; leave ambiguous or informational items unchanged and report them.

A request to update the branch does not authorize merging, auto-merge, review replies, thread resolution, issue changes, branch deletion, or cleanup.

## Workflow

### 1. Resolve the pull request and review state

Identify the repository, pull request, base, head branch, and workspace. Inspect the working tree before editing. Use thread-aware review data when resolution, outdated state, or inline context matters; do not treat a flat comment list as complete.

If the pull request or feedback cannot be identified reliably, report the missing context rather than guessing. If no existing feedback is found, report that state and stop.

### 2. Assess the feedback

Inspect the referenced code, nearby implementation, callers, tests, repository guidance, and execution path as needed. Cluster comments that describe the same root cause.

Classify each relevant item as:

- valid and requiring a change;
- valid but already satisfied;
- incorrect or based on a false assumption;
- outdated or duplicated;
- informational or better answered with explanation;
- blocked by missing context.

Do not implement a reviewer-proposed solution mechanically. Verify the underlying problem and the directly related scope. In assessment mode, report the classifications and stop.

### 3. Apply authorized fixes

In update mode, implement the smallest change that fixes each selected, verified root cause. Check directly equivalent branches only when they share that cause. Preserve established contracts, errors, ordering, nullability, and side-effect boundaries unless the verified issue requires changing them.

Avoid unrelated refactoring, style cleanup, speculative hardening, generated-file churn, or repository-wide changes. Do not modify or include changes owned by another worker or session. Stage by file or hunk rather than with broad add, reset, clean, or formatting commands.

### 4. Validate

Run the narrowest checks that exercise the changed behavior, then relevant module tests, type checks, lint, build, or smoke checks as needed. Distinguish task-caused failures from pre-existing failures, unrelated work, and environment problems. Never report a check as passed unless it ran successfully.

### 5. Commit and push

Inspect changed, staged, unstaged, and untracked files plus the final diff. Commit only task-owned changes traceable to validated feedback and push to the existing pull request head branch. Do not create an empty commit when no change is justified.

Do not push to the base branch, create a replacement pull request, rewrite unrelated commits, or force-push without explicit authorization. If task-owned changes cannot be separated safely, do not commit or push.

## Blockers

Attempt safe, scoped recovery such as retrieving missing thread context, running narrower validation, installing an already-declared dependency, separating changes by hunk, or using an isolated worktree. Stop when continuing would risk unrelated work, data loss, unreliable history, shared infrastructure, or scope expansion.

## Completion

Report the feedback inspected, classifications, fixes applied, items not changed and why, directly related scope checked, files changed, validation results and omissions, and commit and push status. State any material blocker or inspection limit.

State explicitly that the pull request was not merged and that review replies, thread resolution, issue changes, branch deletion, worktree cleanup, and temporary-artifact cleanup were not performed unless separately authorized.
