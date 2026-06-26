# jhste-skills repo instructions

This file is authoritative for work in this repository.

## Workflow

1. Keep commit-time hook behavior fast, read-only, and loop-safe.
2. Before non-trivial code changes, use the `jhste-engineering-groundwork` skill to check scope, boundaries, failure paths, final behavior predicates, and assumptions.
3. After non-trivial code changes, run `jhste-skills guard --scope changed --format text --fail-on error` when available.
4. Treat guard output as review evidence, not proof by itself; completion review should separate current proof, skipped/not-run checks, consumer-path proof when feasible, and residual risk.
5. If guard or red-team review reports new warnings on changed files, attempt a bounded fix before declaring completion, then rerun guard. Do not commit automatically.
6. Before declaring non-trivial code work complete, use the `jhste-red-team-review` skill.
7. Skip red-team review for docs-only, comment-only, formatting-only, and trivial rename-only changes.
8. Do not enter an unbounded fix/review loop; stop after at most two fix + re-review cycles and report remaining risks.
9. Report guard runtime/config failures separately from rule violations.

## Agent autonomy and standing approval

Minimize user interruption. For the current task, agents may proceed without asking for routine, reversible, repo-local work needed to satisfy the request.
Standing approval includes:
- reading and searching the repo;
- editing source, tests, docs, fixtures, config, and managed local outputs within the requested scope;
- running local tests, guards, linters, formatters, smoke tests, and fixture tests;
- adding or updating tests and docs needed for the change;
- drafting PRDs, issue-ready tickets, handoffs, prototypes, and review notes;
- creating normal PRD or implementation ticket tracker items when the user asks for PRDs/issues/tickets or when the invoked workflow normally creates them;
- updating CONTEXT.md, ADRs, or glossary docs when the user asks for documentation/domain-decision workflow.
Ask before:
- git commit, push, merge, tag, release, or package publish;
- production deploys or production data writes;
- applying DB migrations to a live database;
- deleting user data or modifying files outside the repo;
- printing, committing, or documenting real secret values;
- rotating or syncing secrets when the destination is unclear;
- creating cost-bearing cloud resources;
- adding major runtime dependencies;
- closing, overwriting, bulk-editing, assigning, milestone-changing, or broadly relabeling existing tracker items;
- making broad breaking API, schema, or architecture changes beyond the requested scope.
If a choice is reversible and within scope, make a reasonable assumption, proceed, and report the assumption in the final summary. If a choice is irreversible, destructive, external, costly, secret-bearing, production-affecting, or materially changes existing tracker/user data, ask first.

## Secrets and env

- Do not print, commit, or document the real value of tokens, API keys, passwords, cookies, or other secrets.
- If a user asks to input, replace, rotate, sync, or apply a token/API key/secret, perform the operation when the workflow is otherwise allowed; do not refuse merely because the task touches a secret.
- Keep the secret value itself out of responses, logs, commits, and docs. When confirmation is needed, report only the key name, destination, status, or a masked hint.

<!-- jhste-skills:start -->
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
<!-- jhste-skills:end -->
