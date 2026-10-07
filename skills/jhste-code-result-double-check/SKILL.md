---
name: jhste-code-result-double-check
description: Independently recheck existing code results against requirements, the task-owned diff, current code, and verification evidence. Use when the user asks for a second pass on completed or submitted implementation work. Treat review, recheck, verify, and audit as read-only unless the request also asks to fix, correct, repair, or apply changes; when correction is authorized, fix in-scope omissions or errors and verify the resulting state.
---

# JHSTE Code Result Double Check

## Goal

Establish whether an existing code result satisfies its requested outcome and leave an honestly verified final assessment. Treat completion claims as unverified input, not acceptance evidence. Independent judgment does not require another worker.

## Recover the contract and scope

Resolve material requirements from the current request and authoritative repository evidence, including linked specifications, issues, ADRs, handoffs, interfaces, tests, and caller-visible contracts. Do not treat the implementation or passing tests alone as the specification.

Inspect the complete task-owned change, including relevant committed and uncommitted work, the current source, and directly related integration points. Distinguish unrelated changes and other workstreams' ownership; neither a clean worktree nor a completion report proves the result is complete.

## Respect the requested authority

A request to review, recheck, verify, audit, or double-check an existing result is read-only with respect to code and repository files unless the same request also asks to fix, correct, repair, apply, or otherwise make changes.

Under read-only authority, return evidence-backed findings and do not edit files. When correction is authorized, fix omissions, incorrect behavior, incomplete wiring, compatibility regressions, or misleading verification required by the established outcome. Preserve caller-visible contracts, authorization, and sensitive-data boundaries. Leave sound code alone and report unrelated problems rather than expanding into general cleanup.

Make safe, reversible, repository-consistent corrections without routine confirmation only when the request authorizes correction. Do not invent unresolved product, compatibility, security, data, or migration decisions. Complete safe authorized work and identify any consequential blocker, its impact, and the point where work can resume.

Invoking this skill grants no additional mutation, ownership, delegation, destructive-action, or external-write authority. Local correction does not by itself authorize commits, pushes, publication, or changes to external systems.

## Verify the assessed or resulting state

Use the strongest available signal that distinguishes each material requirement's success from failure. Expand verification only for relevant risk, integration surface, or an observed failure. Reuse evidence only when its source state and coverage remain applicable; re-run checks invalidated by authorized corrections or integration changes. Never claim that an unrun check passed.

When an existing handoff is authoritative and writable within the request's scope, synchronize changed status only if the request authorizes that document update. Do not create a new handoff or other document merely because a second pass ran.

## Completion

Account for every material requirement with evidence or an explicit incomplete, blocked, or unverified status. Report the verified outcome, findings, any authorized corrections, current verification, and remaining limitations. A completed inspection is not a claim that unresolved implementation gaps are complete.

Keep any separately authorized publication outcome distinct from the code-verification result.
