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
This repo uses jhste skills as installed workflow guidance.
Repo-local instructions in this file remain authoritative.
Use `ask-jhste` as the router for jhste coding, review, setup, and workstate workflows; detailed policy lives in the installed skills and their `_shared` docs, not this block.
For non-trivial code changes: run `jhste-preflight` before editing, `jhste-skills guard --scope changed` and `jhste-change-review` on the changed path, then `jhste-redteam` before completion.
Before destructive, irreversible, production, secret-bearing, cost-bearing, commit, push, release, publish, or broad out-of-scope actions, follow repo-local instructions and the side-effect policy in the installed skills directory's `_shared/side-effect-policy.md`.
See `.jhste/profile.yaml` for local skill preferences.
<!-- jhste-skills:end -->
```

If a similar section exists, the installer prints the snippet instead of editing automatically.

## Existing hooks

Managed hooks are identified by the jhste-skills hook markers. Existing non-managed hooks are never overwritten, including in `Full` mode and with `--force`. Full may install multiple hook targets, but each target is reported separately as installed, refreshed, skipped because non-managed, or failed.

Retired and renamed skills are pruned, not aliased. During `sync` and `update`, managed copies of skills the kit no longer ships — including the pre-reform `jhste-engineering-groundwork`, `jhste-code-quality`, `jhste-architecture-review`, `jhste-red-team-review`, and `jhste-long-running-work-loop`, plus the older `diagnose`, `jhste-engineering-judgment`, and `write-a-skill` names — are removed, and the current skills install fresh, so the skills directory does not keep duplicate or removed names.
