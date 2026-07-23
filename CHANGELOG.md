# Changelog

## Unreleased

### Added
- Added `jhste-review-followup` to validate existing pull request review feedback and push only justified fixes without merging or cleanup.

## 0.6.0 - 2026-07-13

### Added
- Added `jhste-grill` for focused, one-question-at-a-time decision interviews.
- Added `jhste-to-tickets` for GitHub-native parent issues, sub-issues, and dependency graphs.
- Added `jhste-domain-modeling` for domain terminology, concept boundaries, glossaries, and selective ADR capture.
- Added Codex UI metadata and explicit implicit-invocation policy for every bundled skill.

### Changed
- Reworked `jhste-coding` from a SOLID tutorial into a lean outcome, contract, autonomy, and validation discipline for GPT-5.6.
- Expanded the npm package, documentation, and validation from one skill to four independent skills.
- Replaced the recommendation to install Matt Pocock workflows separately with a curated JHSTE-owned workflow set.

### Removed
- Removed SOLID-first branding and exhaustive SOLID restatement from the coding skill.
- Kept TDD, code review, debugging-process, Wayfinder, and architecture-audit workflows outside the package.

## 0.5.2 - 2026-07-12

### Changed
- Updated installation examples to use the current `.agents/skills` locations for user-wide and repository-scoped skills.
- Clarified when `jhste-coding` should not trigger and required relevant non-destructive validation after code changes.

## 0.5.1 - 2026-07-10

### Changed
- Refined final-response guidance to report validation and material caveats without generic brevity instructions.

## 0.5.0 - 2026-07-02

### Changed
- Reworked the package into a single personal `jhste-coding` skill.
- Removed bundled Matt Pocock workflow skills; users can install `mattpocock/skills` separately.
- Removed jhste workflow/review/guard/setup skills and shared review doctrine from the model-facing package.
- Simplified docs, package files, and validation around the one-skill structure.
