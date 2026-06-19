# Acceptance check

This document maps the implementation to the planned acceptance criteria.

## Repository structure

Implemented directories: `skills/`, `rules/`, `packs/`, `adapters/`, `cli/`, `vendor/matt-pocock/`, `examples/`, `docs/`, and `scripts/`.

Core skills implemented:

- `skills/setup/SKILL.md`
- `skills/jhste-engineering-judgment/SKILL.md`
- `skills/jhste-code-quality/SKILL.md`
- `skills/jhste-architecture-review/SKILL.md`
- `skills/jhste-db-api-boundary/SKILL.md`
- `skills/jhste-crawler-automation/SKILL.md`
- `skills/jhste-red-team-review/SKILL.md`

## Fast setup

`cli/install.mjs` implements mode-based setup (`Minimal`, `Normal`, `Full`, `Custom`), creates `.jhste/profile.yaml` when project connection is enabled, keeps mode advisory by default, asks for a source-file line limit in interactive repo setup, defaults non-interactive setup to a 300-line advisory policy, uses marker-managed bridge blocks idempotently, and does not touch target CI, `package.json`, lockfiles, or source code. Skill installs write a managed manifest with digests and refuse unmanaged differing overwrites unless a separate explicit override is supplied. Hook automation installs a managed advisory pre-commit hook in Normal and advisory pre-commit/pre-push hooks in Full, with `--skip-hooks` as opt-out and blocking mode as explicit opt-in. `cli/connect.mjs` connects additional git repositories to an existing install without silently mutating global skills unless `--install-missing` is explicit. Installed bridge/profile guidance points agents at `jhste-engineering-judgment` before non-trivial code changes and `jhste-red-team-review` before non-trivial code work is declared complete.

## Deep scan

`cli/deep-scan.mjs` uses Git-backed collection by default, records fallback metadata, excludes generated/vendor/build/dependency/lock/secret-like files, detects stack hints, reports local instruction presence, separates existing debt candidates from new-code guard candidates, redacts secret-like values, includes advisory responsibility budget candidates, and writes only `.jhste/deep-scan-report.md` and `.jhste/profile.recommended.yaml`.

`cli/guard.mjs` provides the repeatable guard contract: explicit scope, text/json output with meta, fixed exit codes, baseline use/update/ratchet modes with repo-confined known-issues ledger paths, stable fingerprints without message text, `baseline_matched` summary counts with a legacy `suppressed` compatibility alias, trusted no-shell profile command integration, hook read-only protections, and guard failures reported separately from rule violations.

`cli/hooks.mjs` provides local automation management. It installs advisory hooks by default, can be made blocking explicitly, refuses to overwrite non-managed hooks, skips nested managed runs, and uninstalls only managed hooks.

## Rule/profile model

Rule modes are documented in `docs/RULES.md`, example profile defaults to advisory with a 300-line file-size policy, guard text output includes concise meaning/remediation guidance for warnings, and rule metadata covers file size, silent failure, secret logging, workflow security, external input validation, null/state safety, auth/data isolation, build/runtime env safety, write safety/idempotency, API contract compatibility, performance duplication, DB/API boundaries, side effects, type escapes, and crawler producer seams. Each rule declares whether guard support is built in or metadata-only.

## Conflict handling

`docs/CONFLICT_RESOLUTION.md` and installer behavior preserve existing repo instructions, skip existing differing profiles/skills by default, make bridge insertion marker-managed and idempotent, and refuse to overwrite non-managed hooks even in Full mode or with `--force`, and refuse unmanaged skill-directory overwrites without `--allow-unmanaged-skill-overwrite`.

## Verification commands

```bash
npm test
npm run public-safety:check
npm run vendor:check
npm run docs:check
npm run smoke:test
npm run syntax:check
npm run release:gates
npm pack --dry-run
```

Record actual command output in release notes before publishing a release.

Release gates include dependency-free syntax checking, a first-run `install -> deep-scan -> tune --yes -> guard` smoke flow, `npm pack --dry-run` contents checks, and packed-tarball bin execution in a fresh temp consumer. These gates are not part of commit-time hooks.
