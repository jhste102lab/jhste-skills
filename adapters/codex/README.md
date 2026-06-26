# Codex adapter

The Codex adapter keeps repository instructions authoritative and uses a short bridge block in `AGENTS.md` when that file already exists.

Bridge block:

```md
## Agent skills
This repo uses jhste skills as shared guidance.
Repo-local instructions in this file remain authoritative.
File, repo, command, issue, PR, or other external side effects are allowed when the user directly requested that workflow or repo-local standing approval covers it.
Ask for destructive, irreversible, ambiguous, production, secret, cost-bearing, broad existing-item, or out-of-scope changes.
For reversible in-scope choices, make a reasonable assumption, proceed, and report it in the final summary.
See `.jhste/profile.yaml` for local skill preferences.
Before non-trivial code changes, use the `jhste-engineering-groundwork` skill to check scope, boundaries, failure paths, final behavior predicates, and assumptions.
For changed code, name the one main responsibility of each changed class, module, and function, and reject adjacent responsibilities unless they are on the changed execution path and prevent a concrete failure.
Use SOLID-informed coding discipline as a clean-code review lens for concrete failure modes, not a compliance claim or automatic abstraction trigger; guard findings are review candidates, not proof.
After code changes, run `jhste-skills guard --scope changed --format text --fail-on error` when available.
Report guard warnings/errors; do not treat guard runtime/config failures as validation success.
Treat guard output as review evidence, not proof by itself; completion review should separate current proof, skipped/not-run checks, consumer-path proof when feasible, and residual risk.
If guard or red-team review reports new warnings on changed files, attempt a bounded fix before declaring completion, then rerun guard. Do not commit automatically.
Before declaring non-trivial code work complete, use the `jhste-red-team-review` skill.
Skip red-team review for docs-only, comment-only, formatting-only, or trivial rename-only changes.
Do not enter an unbounded fix/review loop; stop after at most two fix + re-review cycles and report remaining risks.
```

Default install copies skills to a kit-managed skill directory and does not delete or rewrite existing Codex skills.

Explicit user instructions set task scope but do not silently override verified safety, privacy, data-loss, or repo-architecture constraints.
