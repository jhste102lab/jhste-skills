---
name: jhste-implementation-finalizer
description: Independently audit, correct, verify, and finish an implementation already produced or partially produced and, when applicable, synchronize an existing handoff and complete already-authorized updates to the same pull request. Use when the user asks to take over, inspect and finish, finalize, or independently verify a branch, diff, worktree, worker result, or incomplete implementation. Do not use for an initial PR review, existing review-comment follow-up alone, ordinary implementation from scratch, CI-log diagnosis alone, or merging.
---

# JHSTE Implementation Finalizer

## Goal

Treat completion claims as unverified input. Determine whether the requested outcome is complete, correct, integrated, and ready to publish, then directly fix in-scope gaps instead of stopping at review comments.

## Route the right work

Use `jhste-coding` when no prior implementation needs an independent audit and the requested change is sufficiently understood. Use `jhste-diagnosing-bugs` when uncertain root cause or measurement is the primary work. Use `jhste-pr-review` for review-only findings and `jhste-review-followup` when existing review comments define the scope.

Do not merge, enable auto-merge, resolve review threads, or make unrelated issue changes unless the user explicitly requests those actions.

## Establish the contract

Reconcile evidence in this order: current user instructions, repository guidance, current specs and ADRs, domain context and interfaces, related issues and acceptance criteria, handoff documents, tests and caller-visible behavior, then the worker report. Verify the handoff itself; correct it when stronger evidence or the implementation disproves it.

Identify the repository, base, working branch or workspace, starting commit, complete task-owned diff, unrelated changes, parallel ownership, and shared integration points. An uncommitted tree is not a blocker when ownership and isolation are clear.

For nontrivial work, map each material requirement to implementation and verification evidence in one compact table in the handoff or final report. Skip ceremony for a tiny change, but never mark a requirement complete from self-report alone.

## Audit and finish

Inspect the complete task-owned diff and relevant surrounding code, callers, tests, contracts, configuration, and documentation. Check for missing behavior, edge cases, partial integration, compatibility regressions, stale assumptions, weak tests, temporary artifacts, unnecessary abstraction, relevant performance or usability regressions, and accidental absorption of another workstream.

Make one consolidated correction pass for related findings. Directly fix in-scope omissions, defects, integration gaps, regression coverage, stale handoff or documentation, temporary code, unnecessary complexity, and relevant performance or usability problems. Do not invent unresolved product policy, redesign another workstream's owned contract, or make unsettled destructive, migration, authentication, or authorization decisions.

When a material decision remains unresolved after inspecting available evidence, record a compact blocker with the decision, consequence, evidence, options, recommendation, safe work completed, verification, and exact resume point.

## Verify and synchronize

Run focused verification in useful batches: changed-behavior tests first, then applicable regressions, type checks, lint, build, packaging, manual scenarios, and integration checks. Re-run affected checks after corrections. Record exact commands, results, skipped checks, and reasons; never claim an unrun check passed.

Update an existing task handoff with actual implementation locations, requirement status, verification evidence, completed and remaining work, ownership, risks, and the exact next entry point or final completion state. Do not create a new handoff merely because this skill ran unless the user also requested one.

## Publish when authorized

When the user's request already authorizes commit, push, or updating an existing pull request, inspect the final diff, keep unrelated changes out, commit intentionally, push the correct head branch, and update that same pull request's title and body to match the actual scope, validation, limitations, and risks. Never create a duplicate pull request when an existing one was named.

## Completion

Finish only when every material requirement has a traceable status, the complete task-owned diff has been inspected, in-scope gaps are corrected, relevant verification passed or has an honest limitation, parallel ownership remains intact, the handoff reflects reality when present, and authorized publication is complete.
