---
name: jhste-preflight
description: "Pre-edit groundwork for non-trivial code changes: verify premise, scope, boundaries, failure paths, and final behavior predicates."
---

# jhste-preflight

Pre-edit grounding for non-trivial code changes — step 1 of `../_shared/core-loop.md`. Repo-local instructions and architecture docs remain authoritative. Skip the full block for docs-only, comment-only, formatting-only, and trivial rename-only work unless behavior, public API shape, data ownership, safety, or repo architecture changes; still keep a short scope and verification note.

This is a pre-edit check, not a reason to interrupt: make reversible in-scope assumptions and report them later; ask only when scope, safety, data ownership, API contract, or user-visible behavior would change (`../_shared/side-effect-policy.md`). Do not praise, agree, or proceed on unsupported assumptions.

## Owns — work through this, keep the evidence internally

1. **Goal** — concrete behavior or safety property being changed; restate it and reject unnecessary scope expansion.
2. **Premise + evidence** — repo instructions, issue/PR context, files, tests, and code paths actually inspected; check the user's premise before accepting it. Distinguish **not found** from **not checked**.
3. **Ownership boundary** — the smallest module boundary changing: UI, route/controller, service, repository/query, adapter, job, script, or fixture.
4. **Changed responsibility** — one main responsibility and one reason to change per changed unit, plus adjacent responsibilities intentionally rejected.
5. **Data in/out** — inputs entering the boundary and outputs/errors leaving it.
6. **Failure paths** — important ways this can fail or mislead users/tools.
7. **Rejected scope** — adjacent refactors or old problems intentionally not touched.
8. **Smallest safe change** — compare the minimal patch with one cleaner boundary-preserving alternative; state the invariant, caller contract, test boundary, and recovery/rollback after a side effect. If the plan conflicts with repo architecture, say so and propose the safer alternative.
9. **Verification plan** — tests, guards, builds, or manual checks to run, plus checks likely skipped.
10. **Final behavior predicates** — public behavior that must change, shape that must not change, expected errors, persistence/side effects, and compatibility constraints.

For changes touching user data, API/DB, permissions, files, external calls, batch writes, async UI actions, exports, or lifecycle state, follow the changed execution path instead of a fixed checklist.

## Delegates to

- common loop → `../_shared/core-loop.md`
- SOLID lens (extension, substitutability, interface size, dependency direction) → `../_shared/solid-lens.md`
- proof vs not-checked wording → `../_shared/evidence-discipline.md`
- adjacent scope + bounded fix → `../_shared/scope-discipline.md`
- approval boundaries → `../_shared/side-effect-policy.md`
- structure templates → `references/structure-templates.md`

## Does not own

Changed-path quality or design review (`jhste-change-review`), post-change review and verdict (`jhste-redteam`), durable multi-session state (`jhste-workstate`).

## User-facing summary

Report one or two plain sentences: scope checked, main risks, smallest-change plan, anything important **not checked**, and the key final behavior predicate when useful. Propose an `Issue candidate` (`../_shared/issue-candidate.md`) only when follow-up warrants separate tracking.

## References

- `references/structure-templates.md`
- `../_shared/core-loop.md`
- `../_shared/solid-lens.md`
- `../_shared/evidence-discipline.md`
- `../_shared/scope-discipline.md`
- `../_shared/issue-candidate.md`
- `../_shared/side-effect-policy.md`
