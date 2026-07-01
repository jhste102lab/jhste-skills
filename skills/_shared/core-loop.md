# Core jhste loop (shared doctrine)

Single source of truth for the common coding workflow across jhste skills. Skills cite this file instead of restating the loop.

Use for non-trivial code changes unless the change is docs-only, comment-only, formatting-only, or trivial rename-only and does not affect behavior, public API shape, data ownership, safety, or repo architecture.

1. **Before editing** — run `jhste-preflight` to verify goal, premise, scope, ownership boundary, failure path, data contract, and final behavior predicates.
2. **While editing** — repo-local instructions and architecture docs remain authoritative.
3. **Keep scope bounded** — do not widen into adjacent refactors unless the adjacent code is on the changed execution path and leaving it creates a concrete failure mode (`scope-discipline.md`).
4. **After code changes** — run `jhste-skills guard --scope changed --format text --fail-on error` when available; treat guard output as review evidence, not proof (`evidence-discipline.md`).
5. **Before completion** — run `jhste-redteam` on the actual diff or changed files.
6. **Bounded fix** — if new guard or review findings affect changed files, fix only when the fix stays inside the changed execution path, then rerun verification.
7. **Stop after at most two fix + re-review cycles**; ask before larger rewrites.
8. **Completion report** separates current proof, checks intentionally skipped, checks not run / not checked, guard runtime/config failures, and residual risk (`evidence-discipline.md`).

This file owns the loop only. Approval boundaries live in `side-effect-policy.md`; the SOLID review lens lives in `solid-lens.md`; issue handoff lives in `issue-candidate.md`. It does not restate those.
