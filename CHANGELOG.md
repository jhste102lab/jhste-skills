# Changelog


## 0.3.1 - 2026-06-26

### Changed
- Strengthened completion review around current proof, consumer-path and fresh-client verification, skipped checks, checks not run, and residual risk.
- Added final behavior predicates to pre-change engineering groundwork.
- Clarified cleanup/search-replace safety by separating editable product paths from protected evidence/history-like surfaces.
- Kept SOLID-informed coding discipline while emphasizing concrete failure modes over automatic abstraction.
- Clarified that `grilling` and `grill-me` are read-only by default.
- Made architecture improvement Markdown-first, with HTML visual reports optional when requested or materially useful.

## 0.3.0 - 2026-06-24

### Added
- Added repo-local agent autonomy and standing approval guidance for routine reversible work, tracker/doc workflows, prototypes, handoffs, and bounded review follow-up.
- Added shared generated-profile detection with legacy generated profile support, including legacy profiles that still contain `guard.exit_codes`.
- Added `--allow-profile-overwrite` for explicit modified profile replacement when used with `--force`.
- Added smoke and fixture coverage for profile overwrite safety, legacy generated profiles, deep-scan validation, baseline path handling, legacy guard exit-code no-op handling, and managed skill rename migration.

### Changed
- Renamed `jhste-engineering-judgment` to `jhste-engineering-groundwork`; managed `sync`/`update` migrate the old managed skill name automatically.
- Replaced general user-facing “seam” language with “boundary” while preserving stable rule/profile ids such as `extension_seam_advisory` for compatibility.
- Updated skill descriptions and bodies for grilling, PRD/issues, prototype, handoff, triage, domain modeling, codebase design, architecture review, code quality, groundwork, and red-team review triggers/side-effect policy.
- Refactored install/connect preset planning to table-driven plan factories so the previous OCP advisory warning is no longer emitted.

### Fixed
- `install --force` no longer overwrites modified/custom `.jhste/profile.yaml` unless `--allow-profile-overwrite` is also supplied.
- `connect`, `sync`, and `update` now share the same profile overwrite safety policy.
- New generated/example profiles no longer advertise unsupported `guard.exit_codes`; existing profile `guard.exit_codes` blocks are accepted as legacy no-op configuration.
- `deep-scan` now validates `.jhste/profile.yaml` and exits with config failure before writing reports when the profile is invalid.
- `baseline` now validates profile configuration and shows/uses the effective baseline path from CLI args, profile, or the default consistently.

### Validation
- `npm test` passed.
- `jhste-skills guard --scope changed --format text --fail-on error` passed with 0 warnings/errors.
- `git diff --check` passed.
