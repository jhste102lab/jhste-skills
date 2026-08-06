---
name: jhste-implementation-finalizer
description: Independently audit, correct, verify, and finish existing production implementation that is claimed complete or explicitly submitted for finalization. Use when the user asks to verify, finalize, or finish implemented work, including already-authorized updates to the same pull request. Do not use for ordinary continuation, initial PR review, review-feedback follow-up alone, CI diagnosis, merging, or promoting prototype code.
---

# JHSTE Implementation Finalizer

## Goal

Treat completion claims as unverified input. Determine whether the requested production outcome is complete, correct, integrated, and ready for the authorized next action, then directly fix in-scope gaps.

## Establish the real contract

Resolve the material requirements from current user instructions and authoritative repository evidence: guidance, specifications, ADRs, domain context, issues, interfaces, handoffs, tests, and caller-visible behavior. Inspect the complete task-owned diff, current source state, unrelated changes, parallel ownership, and shared integration points.

Do not require a fixed evidence order or a mandatory requirement table. Use a compact requirement-to-evidence map only when the work is complex enough that status would otherwise be ambiguous.

## Audit and finish

Inspect the implementation and directly related integration surface for missing behavior, partial wiring, compatibility regressions, weak or misleading verification, temporary artifacts, unnecessary complexity, and accidental overlap with another workstream.

Make a consolidated correction pass for related findings. Fix only gaps required by the established outcome. Do not invent product policy, take ownership from another workstream, or make unsettled destructive, migration, authentication, authorization, security, or data decisions.

When a consequential decision remains unresolved after inspecting available evidence, complete safe work and record one compact blocker: the decision, consequence, evidence, viable options, recommendation, and exact resume point.

## Verify the final state

For each material requirement, use the strongest available signal that distinguishes success from failure. Expand verification only when risk, integration surface, or an observed failure justifies it. Re-run evidence invalidated by corrections or integration changes, and never claim that an unrun check passed.

Synchronize an existing task handoff when it is part of the authoritative state. Do not create a new handoff merely because finalization ran.

## Publish when authorized

When the request already authorizes commit, push, or updating an existing pull request, keep unrelated changes out, publish to the correct existing branch, and update that pull request to match the actual scope, verification, limitations, and risks.

Do not merge, enable auto-merge, resolve review threads, create a duplicate pull request, or alter unrelated issues unless explicitly requested.

## Completion

Finish only when every material requirement has an honest status, the task-owned diff and integration surface have been inspected, in-scope gaps are corrected, current evidence supports the result or exposes a clear limitation, ownership remains intact, and authorized publication is complete.

Report the verified outcome, corrections made, evidence used, publication status, and any remaining blocker or risk.
