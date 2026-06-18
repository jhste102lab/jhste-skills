---
name: jhste-final-review
description: Read-only completion-time red-team review for non-trivial code changes. Use before declaring code work complete.
---

# jhste-final-review

Use this skill after non-trivial code changes and before reporting completion. Repo-local instructions remain authoritative.

## Scope

- Run for application, API, database, automation, or other non-trivial code changes.
- Skip docs-only, comment-only, formatting-only, and trivial rename-only changes unless the user asks for a full review anyway.

## Contract

- This review is read-only. Do not change code as part of the review itself.
- Inspect the actual changed files or diff before assigning `pass`.
- Do not assign `pass` from guard/test output alone; guard output is evidence, not a substitute for review.
- Report `guard` runtime/config failures separately from rule violations.
- Distinguish **not found** from **not checked**. Use **not found** only after inspecting the relevant path.
- Avoid recommending unrelated refactors unless they are on the changed execution path and required for safety.
- Do not enter an unbounded fix/review loop. Stop after at most two fix + re-review cycles and report residual risks.

## Output

- `pass` — no material follow-up found
- `changes required` — specific follow-up work is still needed
- `residual risk` — bounded review completed, but some risks remain and are being called out explicitly

Findings must include:

- affected path;
- concrete failure mode;
- impact;
- smallest safe fix.

Verification must state:

- tests/builds/guards actually run;
- checks not run;
- whether any guard failures were runtime/config failures or rule violations.

## References

- `references/final-review.md`
- `../jhste-engineering-judgment/SKILL.md`
