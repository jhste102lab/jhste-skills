---
name: jhste-review-followup
description: Validate and address review feedback already posted on an existing GitHub pull request, then commit and push only justified fixes to that PR's head branch. Use only when the user explicitly asks to inspect, verify, address, or follow up on existing PR review comments. Do not use for an initial PR review, general code review, PR status checks, unrelated implementation, merging, review-thread resolution, cleanup, or issue closure.
---

# JHSTE Review Follow-up

## Goal

Evaluate existing pull request review feedback against the code and its actual execution context. Fix only valid issues at their root cause, validate the result, and update the existing PR head branch with the smallest sufficient change.

Stop after the PR branch is updated. Do not merge the PR or perform post-review cleanup.

## Operating boundary

Invoke this skill only when the user explicitly asks to handle review feedback that is already present on a pull request.

Appropriate requests include:

- inspect the review comments already posted on this PR;
- verify whether the requested changes are correct and address the valid ones;
- handle the unresolved review threads and update the PR;
- follow up on the existing PR review feedback.

Do not invoke this skill for an initial PR review, an ordinary code review, a PR summary, a status check, or a general coding request.

If no existing review feedback is found, report that state and stop. Do not perform an initial review as a substitute.

## Workflow

### 1. Resolve the PR and workspace

Identify the repository, PR, head branch, and base branch from the request or current checkout. Inspect the working tree before editing and establish which changes belong to this task.

Use thread-aware review data when unresolved, resolved, or outdated state and inline context matter. Do not treat a flat comment list as a complete view of review threads.

If the PR or review state cannot be identified reliably, stop and report the missing context rather than guessing.

### 2. Assess the feedback

For each relevant review item, inspect the referenced code, nearby implementation, callers, tests, repository guidance, and execution path as needed.

Determine whether the item is:

- valid and requires a code change;
- valid but already satisfied;
- incorrect or based on a false assumption;
- outdated or duplicated;
- informational or better answered with explanation;
- blocked by missing context.

Do not implement a reviewer-proposed solution mechanically. Verify the underlying problem and prefer the smallest change that fixes the actual root cause without creating a regression.

When multiple comments describe the same problem, handle them as one root-cause cluster.

### 3. Inspect the directly related scope

Check the directly affected module, call path, data flow, and equivalent branches for the same verified root cause. Fix repeated instances only when they are clearly part of that same cause.

Do not expand into unrelated refactoring, style cleanup, feature work, speculative hardening, or repository-wide changes.

### 4. Modify the code

Implement only fixes justified by the assessment. Preserve established contracts, behavior, errors, ordering, nullability, and side-effect boundaries unless the verified issue requires changing them.

Keep the patch small and avoid unrelated formatting or generated-file churn.

Do not modify, stage, reset, clean, or include changes owned by another worker or session. Avoid broad commands such as `git add .`, repository-wide formatting, broad reset, or `git clean`. Stage by file or hunk.

Create a database migration only when this task directly requires one, and follow the repository's documented workflow. Do not apply changes to shared or production environments without separate authorization.

### 5. Validate the result

Run the narrowest checks that meaningfully exercise the changed behavior. Prefer targeted tests, then relevant module tests, type checks, lint, focused build, or smoke checks.

For failures, distinguish task-caused failures from pre-existing failures, unrelated worker changes, and environment problems. Fix failures caused by this task and rerun the relevant checks.

Never report a check as passed unless it was actually run successfully.

### 6. Review, commit, and push

Before committing, inspect changed, staged, unstaged, and untracked files and the final diff. Confirm that only task-owned changes are included and that each change is traceable to validated review feedback.

If task-owned changes cannot be separated safely, do not commit or push. Report the blocker.

Commit the task-owned changes with a message describing the corrected behavior or root cause. Push the commit to the existing PR head branch. If no code change is justified, do not create an empty commit or push.

Do not:

- push directly to the base branch;
- create a replacement PR;
- rewrite unrelated commits;
- force-push without explicit authorization;
- merge or enable auto-merge;
- submit a review, reply to comments, or resolve threads;
- close or update issues;
- delete branches, worktrees, `.ai` content, or temporary artifacts.

Cleanup and issue handling require a later, explicit user request.

## Blockers

Attempt safe, scoped recovery before stopping, such as retrieving missing review context, running narrower validation, installing an already-declared dependency, separating changes by hunk, or using an isolated worktree.

Stop when continuing would risk unrelated work, data loss, an unreliable push, remote-history rewriting, shared infrastructure, or scope expansion.

Report the blocked stage, likely cause, recovery attempts, remaining risk, and any commit or push step that was not completed.

## Final response

Report:

- review items inspected;
- items implemented and the resulting changes;
- items not implemented and why;
- the verified root cause and directly related scope checked;
- files changed;
- validation run and results;
- validation not run and why;
- migration status when relevant;
- commit and push status;
- resolved and remaining blockers.

State that the PR was not merged and that review threads, issues, branches, worktrees, and temporary artifacts were not cleaned up.
