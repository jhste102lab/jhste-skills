---
name: jhste-redteam
description: "Read-only red-team review of actual diffs or changed files before declaring non-trivial code work complete."
---

# jhste-redteam

Read-only review of the code you just changed — step 5 of `../_shared/core-loop.md`: run after non-trivial code changes, before reporting completion. This is changed-code review, not plan interrogation. Skip docs-only, comment-only, formatting-only, and trivial rename-only changes unless asked. Repo-local instructions remain authoritative.

Inspect the actual diff or changed files before any `pass`. For non-trivial changes, name changed responsibilities, apply the SOLID lens where relevant (`../_shared/solid-lens.md`), and trace at least one changed execution path from entrypoint through validation/auth/state to side effect or result; state paths **not checked**. The full risk checklist and severity rubric live in `references/red-team-review.md`.

## Output contract

Return one verdict:

- `pass` — no material follow-up found, with current proof (or a clear reason consumer-path proof was not feasible).
- `changes required` — new guard/review warnings on changed files, or a P0/P1 risk: data loss, security/privacy exposure, misleading success, broken runtime behavior, or failed documented acceptance.
- `residual risk` — bounded review done, lower-severity or out-of-scope risks remain.

Then report **material findings only**. Each finding names:

- affected path;
- concrete failure mode;
- impact;
- smallest safe fix;
- current proof / not checked / residual risk.

Then verification: current proof; checks intentionally skipped; checks not run / not checked; guard runtime/config failures versus rule violations; residual risk (`../_shared/evidence-discipline.md`).

**Do not print a full checklist. Do not praise. Do not pass from summaries, stated intent, old passes, test output, or guard output alone.** Keep the user-facing write-up to a few short sentences.

## Bounded fix

If the verdict is `changes required` and the fix stays on the changed execution path, apply a bounded fix after the review, then re-run verification. Stop after at most two fix + re-review cycles (`../_shared/scope-discipline.md`). Do not commit automatically. Emit an `Issue candidate` only when separate tracking is warranted (`../_shared/issue-candidate.md`); ask before tracker writes unless standing approval covers it.

## References

- `references/red-team-review.md`
- `../_shared/core-loop.md`
- `../_shared/solid-lens.md`
- `../_shared/evidence-discipline.md`
- `../_shared/scope-discipline.md`
- `../_shared/issue-candidate.md`
