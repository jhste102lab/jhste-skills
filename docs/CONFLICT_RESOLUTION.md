# Conflict resolution

This kit is a shared guidance layer. It does not replace repository-specific rules.

Priority order:

1. Explicit user instruction.
2. Current repo `AGENTS.md`, `CLAUDE.md`, and docs.
3. `.jhste/profile.yaml`.
4. jhste shared skills.
5. General clean-code principles.

## Existing profile

If `.jhste/profile.yaml` exists, default install keeps it. Overwrite requires `--force` or explicit interactive approval in a future richer workflow. Invalid profiles should be fixed by the user; the installer should not guess a repair.

## Existing skills

If a target skill directory already exists and differs, the installer skips it by default. The user can inspect the diff and rerun with an explicit overwrite option.

## Bridge block

The bridge block is short and idempotent:

```md
## Agent skills
This repo uses jhste skills as shared guidance.
Repo-local instructions in this file remain authoritative.
See `.jhste/profile.yaml` for local skill preferences.
After code changes, run `jhste-skills guard --scope changed --format text --fail-on error` when available.
Report guard warnings/errors; do not treat guard runtime/config failures as validation success.
Before declaring non-trivial code work complete, use the `jhste-final-review` skill.
Skip final review for docs-only, comment-only, formatting-only, or trivial rename-only changes.
Do not enter an unbounded fix/review loop; stop after at most two fix + re-review cycles and report remaining risks.
```

If a similar section exists, the installer prints the snippet instead of editing automatically.
