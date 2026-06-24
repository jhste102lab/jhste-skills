# Conflict resolution

This kit is a shared guidance layer. It does not replace repository-specific rules.

Priority order:

1. Explicit user instruction for the concrete task goal and scope.
2. Current repo `AGENTS.md`, `CLAUDE.md`, and docs.
3. `.jhste/profile.yaml`.
4. jhste shared skills.
5. General clean-code principles.

Explicit user instructions can narrow or redirect the task, but they do not silently override verified safety, privacy, security, data-loss, managed-output, or repo-architecture constraints. If a request conflicts with repo-local architecture or safety rules, report the conflict and choose the smallest safe alternative instead of guessing.

## Existing profile

If `.jhste/profile.yaml` is missing, install creates the generated advisory profile. If it exists and matches the current generated shape or the legacy generated shape that contained `guard.exit_codes`, `--force` may refresh it. If it exists and is modified/custom, default install keeps it and `--force` alone still keeps it; overwriting requires `--force --allow-profile-overwrite`. `--allow-profile-overwrite` without `--force` is a config error. `--force` is limited to jhste-managed outputs; it must not overwrite user source, CI, package files, lockfiles, non-managed hooks, or modified profiles without the explicit profile override. Invalid profiles should be fixed by the user; the installer should not guess a repair.

## Existing skills

Installed skill directories are tracked in `.jhste-skills-manifest.json` inside the skills directory. If a target skill directory already exists and differs, default install skips it; `--force` can refresh manifest-managed copies, but unmanaged differing directories are refused unless `--allow-unmanaged-skill-overwrite` is also explicit. During `sync`/`update`, an already managed skills directory may adopt additional known jhste skills into the manifest and refresh them without the extra overwrite flag. The manifest stores skill digests, not absolute local paths.

## Bridge block

The bridge block is short, marker-managed, and idempotent. The installer may add or refresh only the text between:

```md
<!-- jhste-skills:start -->
<!-- jhste-skills:end -->
```

User-authored text outside those markers remains authoritative and must be preserved. Existing legacy exact bridge text may be migrated into the managed block; similar but non-managed sections are printed for manual review instead of being rewritten.

Managed block content:

```md
<!-- jhste-skills:start -->
## Agent skills
This repo uses jhste skills as shared guidance.
Repo-local instructions in this file remain authoritative.
File, repo, command, issue, PR, or other external side effects are allowed when the user directly requested that workflow or repo-local standing approval covers it.
Ask for destructive, irreversible, ambiguous, production, secret, cost-bearing, broad existing-item, or out-of-scope changes.
For reversible in-scope choices, make a reasonable assumption, proceed, and report it in the final summary.
See `.jhste/profile.yaml` for local skill preferences.
Before non-trivial code changes, use the `jhste-engineering-groundwork` skill to check scope, boundaries, failure paths, and assumptions.
For changed code, name the one main responsibility of each changed class, module, and function, and reject adjacent responsibilities unless they are on the changed execution path and prevent a concrete failure.
Use SOLID-informed coding discipline as a review lens, not a compliance claim; guard findings are review candidates, not proof.
After code changes, run `jhste-skills guard --scope changed --format text --fail-on error` when available.
Report guard warnings/errors; do not treat guard runtime/config failures as validation success.
Treat guard output as review evidence, not proof by itself.
If guard or red-team review reports new warnings on changed files, attempt a bounded fix before declaring completion, then rerun guard. Do not commit automatically.
Before declaring non-trivial code work complete, use the `jhste-red-team-review` skill.
Skip red-team review for docs-only, comment-only, formatting-only, or trivial rename-only changes.
Do not enter an unbounded fix/review loop; stop after at most two fix + re-review cycles and report remaining risks.
<!-- jhste-skills:end -->
```

If a similar section exists, the installer prints the snippet instead of editing automatically.

## Existing hooks

Managed hooks are identified by the jhste-skills hook markers. Existing non-managed hooks are never overwritten, including in `Full` mode and with `--force`. Full may install multiple hook targets, but each target is reported separately as installed, refreshed, skipped because non-managed, or failed.

Legacy managed renames are treated differently from unmanaged conflicts. During `sync` and `update`, older managed `diagnose` and `jhste-engineering-judgment` installs are migrated to `diagnosing-bugs` and `jhste-engineering-groundwork` automatically so the skills directory does not keep both names.
