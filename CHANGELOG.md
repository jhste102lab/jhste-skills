# Changelog

## 0.12.0 - 2026-08-06

### Changed
- Reworked `jhste-subagent-orchestration` around harness-owned runtime settings and proportional coordination: the skill no longer assumes disposable workers, permits current-context worker reuse, allows bounded investigation-and-implementation assignments, avoids acceptance workers that merely duplicate completion or harness review, prefers shared context and artifact-first returns, and keeps peer communication factual and head-authorized.
- Updated the orchestration worker contract and control-state references for compact packets, reusable worker identities, artifact-backed evidence, factual peer exchange, non-duplicative acceptance, and assignment-defect recovery.
- Changed `jhste-grill` from one-question-at-a-time interviewing to dependency-aware decision rounds that batch the full currently answerable frontier while continuing to maintain settled glossary entries and qualifying ADRs without separate confirmation.
- Refined `jhste-prototype` to choose evidence by its intended judge, conditionally prefer a self-contained domain-language HTML experiment for non-developer logic review, prefer existing product surfaces for UI variants, and continue requiring a clean production reimplementation rather than direct promotion.
- Strengthened `jhste-diagnosing-bugs` with autonomous evidence gathering, symptom-specific signal quality, quantitative treatment of intermittent failures, direct runtime inspection when available, and explicit limits on root-cause certainty when evidence cannot distinguish alternatives.
- Expanded `jhste-domain-modeling` with bounded-context ownership, dependency-aware concept rounds, canonical terms and discouraged synonyms, exclusion of generic programming vocabulary, and compact variable-length fallback ADRs while preserving automatic local glossary and ADR updates.
- Made `jhste-to-spec` explicitly synthesis-first and non-interviewing: it now completes useful drafts with visible uncertainty and asks only when a requested decision-complete contract is impossible without a user-owned decision.
- Reformed `jhste-to-tickets` so one reviewable unit becomes one issue, a parent must justify itself with shared context across multiple execution issues, native relationship fallbacks happen automatically, and wide migrations that cannot stay independently green receive an explicit final integration issue.
- Split `jhste-handoff` behavior into a portable single-file default for context that must travel and a durable repository-maintained form only for shared evolving state; added minimal source inspection, sensitive-data redaction, authoritative references, suggested skills, and one exact next action.
- Rewrote both READMEs in simpler language, grouped the twelve skills by user goal, removed GPT-5.6-specific positioning, and documented autonomy, harness ownership, proportional delegation, and minimal honest validation.
- Re-reviewed and updated Matt Pocock attribution, including `jhste-handoff` and the latest prototype and grilling changes.

## 0.11.1 - 2026-08-06

### Removed
- Removed the worker capability-tier guidance from `jhste-subagent-orchestration`. Worker model and tier selection is harness configuration owned by the user, so the skill states no preference. The 0.11.0 coordination-sizing rules are unchanged.

## 0.11.0 - 2026-08-06

### Changed
- Removed the vendor-specific assistant name from the `jhste-subagent-orchestration` trigger description so the skill matches delegation requests on any harness, and added the head-and-worker split and parallel fan-out phrasings that previously failed to select it.
- Shortened the implicit-invocation exclusion list to ordinary linear work owned by another task skill, unresolved user decisions, and domain uses of the word orchestration, so the description no longer biases against legitimate selection.
- Sized coordination to the work: a settled single-owner change takes one implementation worker with a fixed check, and the investigation, implementation, and acceptance split became a ceiling for consequential work instead of a default sequence.
- Added harness-neutral worker-tier guidance that assigns the least capable worker type able to satisfy a stage, without naming models or fixing a routing table.
- Made the written head ledger conditional on dependent waves, multiple live leases, or returns that must survive a wave, instead of requiring it for every delegation.
- Inlined the assignment and report shapes into `SKILL.md` and demoted `references/worker-contract.md` and `references/control-state.md` to on-demand detail, removing two mandatory head reads before the first dispatch.
- Replaced the absolute worker re-delegation ban with a report-first grant, so nested fan-out stays visible to the head instead of being silently impossible or silently unbounded.
- Expanded static routing coverage from 88 to 90 scenarios with head-role and parallel-fan-out triggers.

## 0.10.0 - 2026-08-03

### Added
- Added `jhste-subagent-orchestration` for bounded investigation, implementation, and read-only acceptance workers under a decision-owning head.
- Added static routing contracts for explicit delegation, implicit structural benefit, ordinary-work exclusions, handoff boundaries, and external-write authority.

### Changed
- Reduced the reviewed orchestration package from 469 to 264 lines while preserving the four-file structure and critical head, worker, ownership, and verification invariants.
- Separated worker stage from task skill, read-only acceptance from corrective finalization, worker lifecycle from head verification and disposition, and logical mutation leases from harness-enforced permissions.
- Moved worker concurrency limits entirely to the harness boundary and excluded worker model and reasoning-effort routing from the skill.
- Added wave-level result dispositions, source-basis checks for stale verification, resumable clarification rules, live-activity transfer, and assignment-defect recovery after repeated independent failures.
- Updated both READMEs and package metadata from eleven to twelve skills and expanded static routing coverage from 78 to 88 scenarios across ten covered skills.
- Recorded the reviewed Codexclaw revision and the orchestration concepts adapted or deliberately omitted.

## 0.9.0 - 2026-07-28

### Added
- Added `jhste-prototype` for deliberately disposable, runnable experiments that answer one concrete design question before production implementation.
- Added static prototype routing contracts for state models, API surfaces, data shapes, UI structures, handoffs, non-triggers, and external-write policy.

### Changed
- Clarified prototype boundaries with `jhste-coding`, `jhste-diagnosing-bugs`, `jhste-grill`, `jhste-to-spec`, and `jhste-implementation-finalizer`.
- Linked every skill name in both READMEs directly to its `SKILL.md`, synchronized the descriptions, and updated installation text from ten to eleven skills.
- Bumped the package minor version for the new published capability and expanded static routing coverage from 52 to 78 scenarios across nine covered skills.
- Updated upstream attribution to the reviewed Matt Pocock revision and documented which prototype concepts were adapted or deliberately softened.

## 0.8.1 - 2026-07-27

### Changed
- Narrowed `jhste-implementation-finalizer` so an existing handoff, partial implementation, branch, diff, worktree, or worker result does not select finalization without an explicit independent audit, verification, or completion intent.
- Routed ordinary implementation continuation from a handoff's exact resume point to `jhste-coding`, with unresolved root-cause work remaining in `jhste-diagnosing-bugs`.
- Clarified that `jhste-handoff` authors and updates handoff documents rather than owning implementation merely because a handoff must be read.
- Expanded static routing coverage from 48 to 52 scenarios for handoff continuation, uncertain diagnosis, and independent finalization boundaries.
- Updated npm publishing so a package version bump merged to `main` runs release checks and publishes an unpublished version, while tag pushes remain supported without duplicate publication.

## 0.8.0 - 2026-07-26

### Added
- Added `jhste-to-spec` to synthesize established decisions and repository evidence into a draft-first engineering specification without inventing unresolved requirements.
- Added `jhste-diagnosing-bugs` for difficult bugs and performance regressions that need reproduction, falsifiable hypotheses, targeted instrumentation, or measurement before a fix is clear.
- Added `jhste-handoff` for compact executor-neutral implementation handoffs with optional outcome-based phase documents, parallel ownership, verification evidence, and an exact resume point.
- Added `jhste-implementation-finalizer` to independently audit and finish existing or partial implementations, synchronize an existing handoff, and complete already-authorized updates to the same pull request.
- Added static trigger, non-trigger, handoff, and external-write scenario contracts for the eight changed skills, covering 48 cases.
- Added `THIRD_PARTY_NOTICES.md` and included it in the npm package for upstream attribution and MIT license preservation.

### Changed
- Refined `jhste-coding` to frame caller contracts, owning modules, test seams, bounded preparatory refactors, difficult-bug diagnosis, and the boundary with independent implementation finalization.
- Refined `jhste-to-spec` to keep behavioral specifications separate from worker progress, ownership, and resume state.
- Refined `jhste-to-tickets` to inspect repository seams and validation paths, keep preparatory work bounded, route unresolved behavior before ticketing, follow established label policy, and avoid duplicating local handoff state in issues.
- Refined `jhste-grill` to resolve every consequential decision branch while continuously updating settled glossary entries and automatically writing qualifying ADRs.
- Refined `jhste-domain-modeling` to update the repository glossary as terms settle and automatically record accepted decisions that meet the ADR threshold.
- Expanded package metadata, validation, and both READMEs from six to ten independent skills.

## 0.7.0 - 2026-07-23

### Added
- Added `jhste-pr-review` for explicit, evidence-based pull request reviews that post only high-confidence actionable comments.
- Added `jhste-review-followup` to validate existing PR feedback, apply only justified fixes, and update the existing PR branch.

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
- Simplified docs, package files, and validation around the one-skill structure.
