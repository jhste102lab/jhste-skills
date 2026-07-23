---
name: jhste-review-followup
description: Validate review feedback already posted on an existing GitHub pull request, implement only justified fixes, validate the result, and update the existing PR head branch. Use when the user explicitly asks to inspect, verify, address, fix, or follow up on existing PR review comments. Do not use for an initial review, PR summary, CI debugging, unrelated implementation, merging, review-thread resolution, cleanup, or issue closure.
---

# JHSTE Review Follow-up

## Outcome

Evaluate existing pull request feedback against the code and actual execution context. Distinguish valid issues from incorrect, outdated, duplicate, informational, or already-satisfied comments. Fix only valid issues at their root cause, validate the result, and update the existing pull request branch.

Existing review feedback defines the scope. Do not perform an initial review or manufacture additional findings as a substitute. The feedback may come from `jhste-pr-review` or any other reviewer; this skill does not depend on another skill.

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

Do not implement a reviewer-proposed solution mechanically. Verify the underlying problem and the directly related scope.

### 3. Apply justified fixes

Implement the smallest change that fixes each verified root cause. Check directly equivalent branches only when they share that cause. Preserve established contracts, errors, ordering, nullability, and side-effect boundaries unless the verified issue requires changing them.

Avoid unrelated refactoring, style cleanup, speculative hardening, generated-file churn, or repository-wide changes. Do not modify or include changes owned by another worker or session. Stage by file or hunk rather than with broad add, reset, clean, or formatting commands.

If no code change is justified, do not create an empty commit or push.

### 4. Validate

Run the narrowest checks that exercise the changed behavior, then relevant module tests, type checks, lint, build, or smoke checks as needed. Distinguish task-caused failures from pre-existing failures, unrelated work, and environment problems. Never report a check as passed unless it ran successfully.

### 5. Commit and push

Inspect changed, staged, unstaged, and untracked files plus the final diff. Commit only task-owned changes traceable to validated feedback and push to the existing pull request head branch.

Do not push to the base branch, create a replacement pull request, rewrite unrelated commits, or force-push without explicit authorization. If task-owned changes cannot be separated safely, do not commit or push.

Do not merge or enable auto-merge, submit review replies, resolve threads, change issues, delete branches or worktrees, or clean temporary artifacts unless separately requested.

## Blockers

Attempt safe, scoped recovery such as retrieving missing thread context, running narrower validation, installing an already-declared dependency, separating changes by hunk, or using an isolated worktree. Stop when continuing would risk unrelated work, data loss, unreliable history, shared infrastructure, or scope expansion.

## Completion

Report the feedback inspected, classifications, fixes applied, items not changed and why, directly related scope checked, files changed, validation results and omissions, and commit and push status. State any material blocker or inspection limit.

State explicitly that the pull request was not merged and that review replies, thread resolution, issue changes, branch deletion, worktree cleanup, and temporary-artifact cleanup were not performed unless separately authorized.
