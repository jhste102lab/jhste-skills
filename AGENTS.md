# jhste-skills repo instructions

This file is authoritative for work in this repository.

## Workflow

1. Keep commit-time hook behavior fast, read-only, and loop-safe.
2. Before non-trivial code changes, use the `jhste-engineering-judgment` skill to check scope, seams, failure paths, and assumptions.
3. After non-trivial code changes, run `jhste-skills guard --scope changed --format text --fail-on error` when available.
4. Treat guard output as review evidence, not proof by itself.
5. If guard or red-team review reports new warnings on changed files, attempt a bounded fix before declaring completion, then rerun guard. Do not commit automatically.
6. Before declaring non-trivial code work complete, use the `jhste-red-team-review` skill.
7. Skip red-team review for docs-only, comment-only, formatting-only, and trivial rename-only changes.
8. Do not enter an unbounded fix/review loop; stop after at most two fix + re-review cycles and report remaining risks.
9. Report guard runtime/config failures separately from rule violations.
