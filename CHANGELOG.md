# Changelog

## 0.3.5 - 2026-06-28

### Added
- Added `jhste-long-running-work-loop`, a narrow orchestration skill for multi-session and long-running work that preserves goals, phases, approval boundaries, resume points, and durable-state routing without replacing code-quality, PRD, issue, triage, or handoff workflows.

### Changed
- Updated smoke-test expected skill counts now that the bundled/core skill set includes the new long-running work loop skill.

### Validation
- `npm test` passed.
- `jhste-skills guard --scope changed --format text --fail-on error` passed with 0 warnings/errors.

## 0.3.4 - 2026-06-26

### Changed
- Shifted groundwork and red-team review guidance away from fixed checklist axes and toward context-based failure-mode review of the changed execution path.
- Tightened DB/API and code-quality skill guidance around caller-appropriate response shapes, storage-backed invariants, authorization/data-isolation paths, and understandable failure behavior without turning those examples into a mandatory checklist.
- Clarified red-team review versus red-team questioning/interrogation triggers while preserving the red-team wording and intent.
- Clarified architecture, PRD, issue-slicing, and triage skill trigger boundaries to reduce accidental over-triggering.

### Added
- Added `sync`/`update --skills-only` to refresh installed skill files without touching repository profiles, bridge blocks, hooks, or deep-scan outputs.

## 0.3.3 - 2026-06-26

### Removed
- Removed the global npm `postinstall` auto-sync. Updating the npm package no longer requires install-script approval or a persistent user-level `allow-scripts` npm config; run `jhste-skills update --yes --skip-hooks` explicitly when you want to refresh managed local skill copies.

## 0.3.2 - 2026-06-26

### Added
- Added a safe global postinstall sync for existing manifest-managed `~/.jhste/skills` so `npm update -g jhste-skills` refreshes local agent skill copies without touching repositories, hooks, or bridge files.

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
