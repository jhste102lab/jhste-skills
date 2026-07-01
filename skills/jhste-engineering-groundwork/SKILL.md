---
name: jhste-engineering-groundwork
description: "Pre-change engineering groundwork for non-trivial code work: verify user premises against repo instructions and code, reject unnecessary scope expansion, identify ownership boundaries, failure paths, data contracts, and safer alternatives before implementing."
---

# jhste-engineering-groundwork

Use before non-trivial code changes. Repo-local instructions and architecture docs remain authoritative. Skip the full block for docs-only, comment-only, formatting-only, and trivial rename-only work unless behavior, public API shape, data ownership, safety, or repo architecture changes; still keep a short scope and verification note.

## Contract

- Restate the concrete goal and reject unnecessary scope expansion.
- Check the user's premise against repo instructions, code, tests, and relevant issue/PR context before accepting it.
- Use this as a pre-edit check, not a reason to interrupt: make reversible in-scope assumptions and report them later; ask only when scope, safety, data ownership, API contract, or user-visible behavior would change.
- Identify the smallest ownership boundary being changed: UI, route/controller, usecase/service, repository/query, adapter, job, script, or test fixture.
- Name the **Changed responsibility**: one main responsibility and one main reason to change for each changed class, module, and function.
- Apply SOLID-informed coding discipline only as a lens for concrete failure modes: responsibility, extension boundary, substitutability, interface size, and dependency direction.
- Reject adjacent responsibilities unless they are on the changed execution path and leaving them out creates a concrete failure mode.
- State data in/out, important failure paths, smallest safe change, and verification plan before editing.
- If the requested implementation conflicts with repo architecture, say so directly and propose the safer alternative.
- Treat new guard or review warnings on changed files as **bounded fix** candidates when the fix stays on the changed execution path; rerun guard after the fix and do not commit automatically.
- Do not praise, agree, or proceed based on unsupported assumptions.

## Required pre-edit evidence check

For non-trivial code changes, check and keep internally:

1. **Goal** — concrete behavior or safety property being changed.
2. **Evidence inspected** — repo instructions, issue/PR context, files, tests, and code paths actually inspected.
3. **Ownership boundary** — the smallest module boundary being changed.
4. **Changed responsibility** — changed class/module/function responsibility and adjacent responsibilities intentionally rejected.
5. **SOLID-informed lens** — extension boundaries, substitutability contracts, broad interfaces/configs/props, or concrete side-effect dependencies affected.
6. **Data in/out** — inputs entering the boundary and outputs/errors leaving it.
7. **Failure paths** — important ways this can fail or mislead users/tools.
8. **Rejected scope** — adjacent refactors or old problems intentionally not touched.
9. **Smallest safe change** — why the plan is minimal.
10. **Verification plan** — tests, guards, builds, or manual checks to run, plus checks likely skipped.
11. **Final behavior predicates** — public behavior that must change, shape that must not change, expected errors, persistence/side effects, and compatibility constraints.

For changes touching user data, API/DB, permissions, files, external calls, batch writes, async UI actions, exports, or lifecycle state, follow the changed execution path instead of a fixed checklist. Use repo-local rules, domain invariants, caller expectations, persistence behavior, side effects, user-visible states, operational impact, and verification evidence to identify concrete failure modes.

## User-facing summary

Keep the full evidence available internally. Usually report one or two plain sentences covering scope checked, main risks, smallest-change plan, anything important **not checked**, and the key final behavior predicate when useful.

Say **not checked** for premises or paths not inspected. Say **not found** only after inspecting the relevant path. When guard or review warnings remain, briefly state whether they are new, pre-existing, or not checked; name categories/counts; and say whether tracking is warranted.

Default to report-only for pre-existing, low-impact, heuristic-only warnings. Propose an `Issue candidate` only when follow-up is actionable, material, likely to be forgotten, or introduced by the change. State why tracking is warranted before asking to create or update tracker items; ask for explicit approval before tracker writes unless the user directly requested that workflow or repo-local standing approval covers it. Label heuristic findings as candidates, not proof, and never include raw secrets or private data.

## Senior-quality pre-edit gate

For non-trivial code changes, compare the smallest local patch with one cleaner boundary-preserving alternative. State the invariant, changed responsibility, caller contract entering/leaving the boundary, test boundary, rejected alternative, and recovery or rollback expectation after a side effect. Keep this quiet for docs-only, comment-only, formatting-only, and trivial rename-only work.

**Adjacent-code scope creep** is allowed only when adjacent code sits on the changed execution path and leaving it untouched creates a concrete failure mode; otherwise report the follow-up instead of widening the change.

## Shape guidance

For common structures, read `references/structure-templates.md` and follow the closest template unless repo-local conventions say otherwise.
