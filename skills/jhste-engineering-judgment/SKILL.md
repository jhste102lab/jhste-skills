---
name: jhste-engineering-judgment
description: "Pre-change engineering judgment for non-trivial code work: verify user premises against repo instructions and code, reject unnecessary scope expansion, identify ownership seams, failure paths, data contracts, and safer alternatives before implementing."
---

# jhste-engineering-judgment

Use before non-trivial code changes. Repo-local instructions and architecture docs remain authoritative.

## Contract

- Restate the goal in concrete terms and reject unnecessary scope expansion.
- Check the user's premise against code, tests, and repo-local instructions before accepting it.
- Before editing, run the pre-edit evidence check for non-trivial code changes and report only a concise user-facing summary.
- Identify the ownership seam: UI, route/controller, usecase/service, repository/query, adapter, job, script, or test fixture.
- Name the one main responsibility and one main reason to change for each changed class, module, and function.
- Apply SOLID-informed coding discipline as review guidance, not compliance proof: responsibility, extension seam, substitutability, interface size, and dependency direction.
- Reject adjacent responsibilities unless they are on the changed execution path and leaving them out creates a concrete failure mode.
- List the important failure paths before writing code.
- State the data contract entering and leaving the changed seam.
- Prefer the smallest change that preserves future extension.
- If the requested implementation conflicts with repo architecture, say so directly and propose the safer alternative.
- When inspection discovers a non-trivial follow-up outside the immediate fix, prepare an `Issue candidate` instead of silently creating or updating tracker issues.
- Ask for explicit approval before any issue tracker side effect unless the user has already authorized issue writes for this exact task.
- Do not praise, agree, or proceed based on unsupported assumptions.
- Avoid unrelated refactors unless they are on the changed execution path and required for safety.
- When guard or review warnings are new on changed files, plan a bounded fix before declaring completion; rerun guard after the fix, and do not commit automatically.

## Required pre-edit evidence check

For non-trivial code changes, check these before editing:

1. **Goal** — concrete behavior or safety property being changed.
2. **Evidence inspected** — repo instructions, issue/PR context, files, tests, and code paths actually inspected.
3. **Ownership seam** — the smallest module boundary being changed.
4. **Changed responsibility** — the one main responsibility of each changed class/module/function, plus adjacent responsibilities intentionally rejected.
5. **SOLID-informed review lens** — whether the change affects extension seams, substitutability contracts, broad interfaces/configs/props, or concrete side-effect dependencies.
6. **Data in/out** — inputs entering the seam and outputs/errors leaving it.
7. **Failure paths** — important ways this can fail or mislead users/tools.
8. **Rejected scope** — adjacent refactors or old problems intentionally not touched.
9. **Smallest safe change** — why the planned change is minimal.
10. **Verification plan** — tests, guards, builds, or manual checks to run, plus any checks likely to be skipped.

Keep these items available as internal review evidence, but do not make the user read the full evidence block every time. User-facing output should usually be one or two plain sentences covering:

- scope checked;
- main risks;
- smallest-change plan;
- anything important that was **not checked**.

Do not add a heading, label, or prefix unless the user asks for a structured block; start directly with the summary sentence.

If a premise was not checked, say **not checked**. Do not write "not found" unless you actually inspected the relevant path.

When mentioning guard, review, or pre-existing warnings, keep the user-facing report to 2-3 short sentences in a natural developer tone:

- sentence 1: say whether the warning is new, pre-existing, or not checked;
- sentence 2: name the warning categories and counts in plain language;
- sentence 3: say whether you are proposing an `Issue candidate`, and why or why not.

Do not hide warnings just because they are pre-existing. Do not dump raw tool output when a short paraphrase is enough.

When warnings remain after guard or review, always report them briefly even if they are pre-existing.

New changed-file warnings are bounded-fix candidates, not report-only by default. Try a small fix when it stays within the changed execution path; if fixing would require unrelated refactor or more than two fix/re-review cycles, stop and report residual risk or an Issue candidate. Do not commit automatically.

Default to report-only when the warning is pre-existing, low-impact, heuristic-only, or unlikely to be lost without tracking.

Propose an `Issue candidate` when any of the following is true:

- the warning was introduced by this change;
- the same warning has appeared repeatedly across tasks;
- the warning reflects actionable structural debt with meaningful impact on reliability, debuggability, or review cost;
- the work is out of scope for the current change but is likely to be forgotten without tracking.

Do not ask to create or update an issue unless you first state why tracking is warranted.
Prefer: "This is better tracked as follow-up work. I can draft an issue candidate now if you want."
Avoid: "Should I create an issue?" without supporting reasoning.


## Senior-quality pre-edit gate

For non-trivial code changes, compare at least two plausible shapes before editing: the smallest local patch and one cleaner seam-preserving alternative. State the invariant that must remain true, the changed class/module/function responsibility, the caller contract entering and leaving the seam, the test seam that will prove behavior, the rejected alternative, and the partial-failure or rollback path. Keep this quiet for docs-only, comment-only, formatting-only, and trivial rename-only work.

Adjacent-code scope creep is allowed only when the adjacent code is on the changed execution path and leaving it untouched creates a concrete failure mode. Otherwise emit an Issue candidate rather than widening the change.

## Issue candidate protocol

Use this when pre-change inspection finds a material old problem, adjacent risk, or remediation follow-up that should not be fixed in the current scope.

Emit a concise `Issue candidate` block with:

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

Do not treat regex or heuristic findings as proof. Do not include raw secrets, tokens, credentials, or private data in the candidate text. If an existing issue likely matches, explain the match evidence and ask before updating it.

## Shape guidance

For common structures, read `references/structure-templates.md` and follow the closest template unless repo-local conventions say otherwise.
