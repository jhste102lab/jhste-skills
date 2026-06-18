---
name: jhste-red-team-review
description: Read-only completion-time red-team review and issue-candidate handoff for non-trivial code changes. Use before declaring code work complete.
---

# jhste-red-team-review

Use this skill after non-trivial code changes and before reporting completion. Repo-local instructions remain authoritative.

## Scope

- Run for application, API, database, automation, or other non-trivial code changes.
- Skip docs-only, comment-only, formatting-only, and trivial rename-only changes unless the user asks for a full red-team review anyway.

## Contract

- This review is read-only. Do not change code as part of the review itself.
- Inspect the actual changed files or diff before assigning `pass`.
- Do not assign `pass` from guard/test output alone; guard output is evidence, not a substitute for review.
- Report `guard` runtime/config failures separately from rule violations.
- Distinguish **not found** from **not checked**. Use **not found** only after inspecting the relevant path.
- Avoid recommending unrelated refactors unless they are on the changed execution path and required for safety.
- When review finds a material follow-up that should become tracked work, emit an `Issue candidate` and ask for explicit approval before creating or updating issues unless already authorized for this exact task.
- Label heuristic findings as candidates, not proof; never include raw secrets or private data in issue text.
- Do not enter an unbounded fix/review loop. Stop after at most two fix + re-review cycles and report residual risks.

## Issue candidate protocol

Use this only for actionable, non-trivial follow-up work that should be tracked separately from the current fix. Do not create issue spam for every warning.

Each `Issue candidate` must include:

- title;
- existing issue search terms or likely duplicate issue;
- affected path(s);
- evidence inspected;
- concrete failure mode;
- impact;
- confidence, including whether the finding is heuristic;
- smallest safe fix;
- acceptance criteria;
- redaction note for secrets or sensitive data;
- suggested action: `new issue`, `update existing issue`, or `no issue`.

If an existing issue appears to match, propose updating it and state the match evidence. Ask the user before any tracker write unless they already explicitly authorized issue creation or updates for this exact task.

## Output

- `pass` — no material follow-up found
- `changes required` — specific follow-up work is still needed
- `residual risk` — bounded review completed, but some risks remain and are being called out explicitly

Start directly with the result sentence. Do not add a heading, label, or prefix unless the user asks for a structured block.

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

- `references/red-team-review.md`
- `../jhste-engineering-judgment/SKILL.md`
