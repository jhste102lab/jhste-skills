---
name: jhste-engineering-groundwork
description: "Pre-change groundwork for non-trivial code work: verify user premises against repo instructions and code, reject scope creep, identify ownership boundaries, failure paths, data contracts, and safer alternatives before implementing."
---

# jhste-engineering-groundwork

Use before non-trivial code changes. Repo-local instructions and architecture docs remain authoritative. Skip the full block for docs-only, comment-only, formatting-only, and trivial rename-only work unless behavior, public API shape, data ownership, safety, or repo architecture changes; still keep a short scope and verification note.

## Pre-edit contract

Work through this for non-trivial code changes and keep the evidence internally. This is a pre-edit check, not a reason to interrupt: make reversible in-scope assumptions and report them later; ask only when scope, safety, data ownership, API contract, or user-visible behavior would change. Do not praise, agree, or proceed on unsupported assumptions.

1. **Goal** — concrete behavior or safety property being changed; restate it and reject unnecessary scope expansion.
2. **Evidence inspected** — repo instructions, issue/PR context, files, tests, and code paths actually inspected; check the user's premise before accepting it. Distinguish **not found** from **not checked** (`../_shared/evidence-discipline.md`).
3. **Ownership boundary** — the smallest module boundary being changed: UI, route/controller, usecase/service, repository/query, adapter, job, script, or test fixture.
4. **Changed responsibility** — one main responsibility and one main reason to change for each changed class/module/function, plus adjacent responsibilities intentionally rejected.
5. **SOLID-informed lens** — extension boundaries, substitutability, interface size, and concrete side-effect dependencies affected; apply `../_shared/solid-lens.md` as a lens, not compliance or automatic abstraction.
6. **Data in/out** — inputs entering the boundary and outputs/errors leaving it.
7. **Failure paths** — important ways this can fail or mislead users/tools.
8. **Rejected scope** — adjacent refactors or old problems intentionally not touched, per `../_shared/scope-discipline.md`.
9. **Smallest safe change** — compare the minimal patch with one cleaner boundary-preserving alternative; state the invariant, caller contract entering/leaving the boundary, test boundary, and recovery or rollback expectation after a side effect. If the plan conflicts with repo architecture, say so and propose the safer alternative.
10. **Verification plan** — tests, guards, builds, or manual checks to run, plus checks likely skipped. Treat new guard/review warnings on the changed path as **bounded fix** candidates and rerun guard after (`../_shared/scope-discipline.md`); do not commit automatically.
11. **Final behavior predicates** — public behavior that must change, shape that must not change, expected errors, persistence/side effects, and compatibility constraints.

For changes touching user data, API/DB, permissions, files, external calls, batch writes, async UI actions, exports, or lifecycle state, follow the changed execution path instead of a fixed checklist. Use repo-local rules, domain invariants, caller expectations, persistence behavior, side effects, user-visible states, operational impact, and verification evidence to identify concrete failure modes.

## User-facing summary

Keep the full evidence internally; usually report one or two plain sentences covering scope checked, main risks, smallest-change plan, anything important **not checked**, and the key final behavior predicate when useful. When guard or review warnings remain, state whether they are new/pre-existing/not checked, name categories/counts, and whether tracking is warranted. Propose an `Issue candidate` (`../_shared/issue-candidate.md`) only when follow-up warrants separate tracking.

## Shape guidance

For common structures, read `references/structure-templates.md` and follow the closest template unless repo-local conventions say otherwise.

## References

- `references/structure-templates.md`
- `../_shared/solid-lens.md`
- `../_shared/evidence-discipline.md`
- `../_shared/issue-candidate.md`
- `../_shared/scope-discipline.md`
