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

## Fast setup

`cli/install.mjs` implements the one-question recommended setup, creates `.jhste/profile.yaml`, keeps mode advisory, appends bridge blocks idempotently, and does not touch target CI, hooks, `package.json`, or lockfiles.

## Deep scan

`cli/deep-scan.mjs` excludes generated/vendor/build/dependency/lock/secret-like files, detects stack hints, reports local instruction presence, separates existing debt candidates from new-code guard candidates, redacts secret-like values, includes advisory responsibility budget candidates, and writes only `.jhste/deep-scan-report.md` and `.jhste/profile.recommended.yaml`.

## Rule/profile model

Rule modes are documented in `docs/RULES.md`, example profile defaults to advisory, and rule metadata covers file size, silent failure, secret logging, external input validation, DB/API boundaries, side effects, and crawler producer seams.

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
