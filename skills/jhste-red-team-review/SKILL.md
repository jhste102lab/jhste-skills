---
name: jhste-red-team-review
description: Read-only red-team review of actual diffs or changed files after implementation, with issue-candidate handoff for residual risks. Use before declaring non-trivial code work complete. For pre-implementation plan interrogation use grilling, grill-me, or grill-with-docs.
---

# jhste-red-team-review

Use after non-trivial code changes and before reporting completion. This is changed-code review, not plan interrogation. Repo-local instructions remain authoritative.

## Scope and side effects

- Run for application, API, database, automation, or other non-trivial code changes; skip docs-only, comment-only, formatting-only, and trivial rename-only changes unless asked.
- The review pass is read-only. If it reports `changes required`, apply a bounded fix only after the review when the fix stays inside the changed execution path, then re-run verification.
- Stop after at most two fix + re-review cycles. Ask before large rewrites, product decisions, destructive migrations, or risks that cannot be judged safely.

## Contract

- Inspect the actual diff or changed files before assigning `pass`; the full risk checklist is in `references/red-team-review.md`.
- Check that each changed class, module, and function has one clear main job; call out mixed responsibilities that create concrete review or failure risk.
- Apply shared doctrine as review prompts, not automatic violations: `../_shared/solid-lens.md` (SOLID), `../_shared/evidence-discipline.md` (proof vs not-checked), `../_shared/issue-candidate.md` (follow-up handoff), `../_shared/scope-discipline.md` (unrelated refactors, bounded fix).

## Severity rubric and path tracing

For non-trivial code changes, name changed responsibilities, apply the SOLID-informed lens where relevant, trace at least one changed execution path from entrypoint through validation/auth/state to side effect or result, and state paths not checked. Attack the changed path in the way most likely to reveal real failures for this repo, domain, caller, and runtime.

Use `changes required` for new guard or review warnings on changed files that can be fixed within the changed execution path, and for P0/P1 risks: data loss, security/privacy exposure, misleading success, broken runtime behavior, or failed documented acceptance. Use `residual risk` for bounded-review leftovers that are lower-severity, heuristic, environmental, or out of scope. Use `pass` only after inspecting the relevant diff and finding no material follow-up, with current proof or a clear reason consumer-path proof was not feasible.

## Output

Return one of:

- `pass` — no material follow-up found.
- `changes required` — specific follow-up work is still needed.
- `residual risk` — bounded review completed, but risks remain.

Findings should name affected path, concrete failure mode, impact, and smallest safe fix. Verification should state tests/builds/guards run, consumer or acceptance path checked when feasible, checks not run, checks intentionally skipped and why, guard runtime/config failures versus rule violations, and remaining residual risk.

When reporting warnings or residual risks, keep the user-facing write-up to 2-3 short sentences: whether warnings are new/pre-existing/not checked; category/counts; and whether an `Issue candidate` is warranted. Default to report-only for pre-existing, low-impact, heuristic-only, or unlikely-to-be-lost warnings. Before asking to create or update an issue, state why tracking is warranted.

## Issue candidate details

Emit an `Issue candidate` only when separate tracking is warranted; ask for explicit approval before tracker writes unless the user requested that workflow or repo-local standing approval covers it. Full shape in `../_shared/issue-candidate.md`.

## References

- `references/red-team-review.md`
- `../jhste-engineering-groundwork/SKILL.md`
- `../_shared/solid-lens.md`
- `../_shared/evidence-discipline.md`
- `../_shared/issue-candidate.md`
- `../_shared/scope-discipline.md`
