---
name: jhste-red-team-review
description: Read-only red-team code review for actual diffs or changed files after implementation, with issue-candidate handoff for residual risks. Use before declaring non-trivial code work complete. For pre-implementation red-team questioning or interrogation of a plan, use grilling, grill-me, or grill-with-docs.
---

# jhste-red-team-review

Use this skill after non-trivial code changes and before reporting completion. This is red-team code review for changed code, not plan interrogation. Repo-local instructions remain authoritative.

## Automation and side effects

Perform the changed-code review, inspect guard/test output, and run bounded fix/re-review follow-up without asking when the fix stays inside the changed execution path. The review pass itself is read-only; apply fixes after reporting `changes required`, then re-run verification. Stop after at most two fix + re-review cycles. Ask before scope-out large rewrites, product decisions, destructive migrations, or residual risks that cannot be judged safely.

## Scope

- Run for application, API, database, automation, or other non-trivial code changes.
- Skip docs-only, comment-only, formatting-only, and trivial rename-only changes unless the user asks for a full red-team review anyway.

## Contract

- This review is read-only. Do not change code as part of the review itself.
- New warnings on changed files should be reported as changes required when they can be fixed within the changed execution path; the follow-up fix happens after the review, not inside it.
- Inspect the actual changed files or diff before assigning `pass`.
- Check that each changed class, module, and function has one clear main job, and call out mixed responsibilities that create concrete review or failure risk.
- Apply SOLID-informed review as a coding-discipline lens: extension boundaries, substitutability, right-sized interfaces, and dependency direction are prompts for concrete failure modes, not automatic violations or automatic abstractions.
- Do not assign `pass` from guard/test output alone; guard output is evidence, not a substitute for review.
- Treat old passes, intent, skipped checks, partial artifacts, internal reasoning, and guard output alone as current proof gaps, not proof of completion.
- Prefer proof through the actual consumer path when feasible: public API route, CLI command, UI route, worker/scheduler path, service entrypoint, fresh-client flow, or documented acceptance path.
- Keep current proof, checks not run, checks intentionally skipped, and residual risks separate in the final report.
- Report `guard` runtime/config failures separately from rule violations.
- Distinguish **not found** from **not checked**. Use **not found** only after inspecting the relevant path.
- Avoid recommending unrelated refactors unless they are on the changed execution path and required for safety.
- When review finds a material follow-up that should become tracked work, emit an `Issue candidate` and ask for explicit approval before creating or updating issues unless the user directly requested that tracker workflow or repo-local standing approval covers it.
- Label heuristic findings as candidates, not proof; never include raw secrets or private data in issue text.
- Do not enter an unbounded fix/review loop. Stop after at most two fix + re-review cycles and report residual risks.


## Severity rubric and path tracing

For non-trivial code changes, name the main responsibility of changed classes/modules/functions, apply the SOLID-informed review lens where relevant, trace at least one changed execution path from entrypoint through validation/auth/state to the side effect or result, and state any changed paths not checked. Do not stop at a fixed checklist; attack the changed path in the way most likely to reveal real failures for this repo, domain, caller, and runtime. Use `changes required` for new guard or review warnings on changed files that can be fixed within the changed execution path, and for P0/P1 issues that can cause data loss, security/privacy exposure, misleading success, broken runtime behavior, or failed documented acceptance. Use `residual risk` when the bounded review completed but lower-severity, heuristic, environmental, or out-of-scope risks remain. Use `pass` only after inspecting the relevant diff and finding no material follow-up, with current proof for the changed public behavior or a clear explanation of why consumer-path proof was not feasible.

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

If an existing issue appears to match, propose updating it and state the match evidence. Ask the user before any tracker write unless the user directly requested that tracker workflow or repo-local standing approval covers it.

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
- actual consumer, entrypoint, fresh-client, or documented acceptance path checked when feasible;
- checks not run;
- checks intentionally skipped and why;
- whether any guard failures were runtime/config failures or rule violations;
- residual risk that remains after bounded review.

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
- `../jhste-engineering-groundwork/SKILL.md`
