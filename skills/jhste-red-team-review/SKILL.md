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

When reporting warnings or residual risks to the user, keep the write-up to 2-3 short sentences in a natural developer tone:

- sentence 1: say whether the warning is new, pre-existing, or not checked;
- sentence 2: name the warning categories and counts in plain language;
- sentence 3: say whether you are proposing an `Issue candidate`, and why or why not.

Do not hide pre-existing warnings. Do not paste raw guard output unless the user asks for the full log.

When warnings remain after guard or review, always report them briefly even if they are pre-existing.

Default to report-only when the warning is pre-existing, low-impact, heuristic-only, or unlikely to be lost without tracking.

Propose an `Issue candidate` when any of the following is true:

- the warning was introduced by this change;
- the same warning has appeared repeatedly across tasks;
- the warning reflects actionable structural debt with meaningful impact on reliability, debuggability, or review cost;
- the work is out of scope for the current change but is likely to be forgotten without tracking.

Do not ask to create or update an issue unless you first state why tracking is warranted.
Prefer: "This is better tracked as follow-up work. I can draft an issue candidate now if you want."
Avoid: "Should I create an issue?" without supporting reasoning.

## References

- `references/red-team-review.md`
- `../jhste-engineering-judgment/SKILL.md`
