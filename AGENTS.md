# jhste-skills repo instructions

This file is authoritative for work in this repository.

## Workflow

1. Keep commit-time hook behavior fast, read-only, and loop-safe.
2. After non-trivial code changes, run `jhste-skills guard --scope changed --format text --fail-on error` when available.
3. Before declaring non-trivial code work complete, use the `jhste-final-review` skill.
4. Skip final review for docs-only, comment-only, formatting-only, and trivial rename-only changes.
5. Do not enter an unbounded fix/review loop; stop after at most two fix + re-review cycles and report remaining risks.
6. Report guard runtime/config failures separately from rule violations.
