# Acceptance check

This document maps the implementation to the planned acceptance criteria.

## Repository structure

Implemented directories: `skills/`, `rules/`, `packs/`, `adapters/`, `cli/`, `vendor/matt-pocock/`, `examples/`, `docs/`, and `scripts/`.

Core skills implemented:

- `skills/setup/SKILL.md`
- `skills/jhste-code-quality/SKILL.md`
- `skills/jhste-architecture-review/SKILL.md`
- `skills/jhste-db-api-boundary/SKILL.md`
- `skills/jhste-crawler-automation/SKILL.md`
- `skills/jhste-final-review/SKILL.md`

## Fast setup

`cli/install.mjs` implements the one-question recommended setup, creates `.jhste/profile.yaml`, keeps mode advisory, appends bridge blocks idempotently, and does not touch target CI, `package.json`, or lockfiles. Hook automation installs a managed advisory pre-commit hook by default, with `--skip-hooks` as opt-out and blocking mode as explicit opt-in. Installed bridge/profile guidance points agents at `jhste-final-review` before non-trivial code work is declared complete.

## Deep scan

`cli/deep-scan.mjs` excludes generated/vendor/build/dependency/lock/secret-like files, detects stack hints, reports local instruction presence, separates existing debt candidates from new-code guard candidates, redacts secret-like values, includes advisory responsibility budget candidates, and writes only `.jhste/deep-scan-report.md` and `.jhste/profile.recommended.yaml`.

`cli/guard.mjs` provides the repeatable guard contract: explicit scope, text/json output with meta, fixed exit codes, baseline use/update/ratchet modes, stable fingerprints without message text, profile command integration, hook read-only protections, and guard failures reported separately from rule violations.

`cli/hooks.mjs` provides local automation management. It installs advisory hooks by default, can be made blocking explicitly, refuses to overwrite non-managed hooks, skips nested managed runs, and uninstalls only managed hooks.

## Rule/profile model

Rule modes are documented in `docs/RULES.md`, example profile defaults to advisory, and rule metadata covers file size, silent failure, secret logging, external input validation, null/state safety, auth/data isolation, build/runtime env safety, write safety/idempotency, API contract compatibility, performance duplication, DB/API boundaries, side effects, and crawler producer seams.

## Conflict handling

`docs/CONFLICT_RESOLUTION.md` and installer behavior preserve existing repo instructions, skip existing differing profiles/skills by default, and make bridge insertion idempotent.

## Verification commands

```bash
npm test
npm run public-safety:check
npm run vendor:check
npm run docs:check
npm run smoke:test
```

Record actual command output in release notes before publishing a release.
