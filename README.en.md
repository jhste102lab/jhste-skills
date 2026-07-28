# jhste-skills

[한국어](README.md) | ENG

A personal engineering skill set maintained around GPT-5.6's outcome-first, lean-prompt guidance. Each skill works independently and may be selected implicitly when the user's intent matches its narrow trigger.

## Skills

- **[`jhste-coding`](skills/jhste-coding/SKILL.md)** — implements sufficiently understood features, bug fixes, refactors, and ordinary continuation from a handoff's exact resume point with a small change and relevant validation.
- **[`jhste-prototype`](skills/jhste-prototype/SKILL.md)** — tests one important design question before production implementation with the smallest disposable runnable evidence.
- **[`jhste-diagnosing-bugs`](skills/jhste-diagnosing-bugs/SKILL.md)** — diagnoses difficult bugs and performance regressions whose cause or correct fix is uncertain through reproduction, hypotheses, and measurement.
- **[`jhste-grill`](skills/jhste-grill/SKILL.md)** — resolves consequential decision branches one question at a time while continuously maintaining settled domain context and ADRs.
- **[`jhste-domain-modeling`](skills/jhste-domain-modeling/SKILL.md)** — clarifies domain terms, boundaries, and relationships, immediately recording settled glossary entries and qualifying ADRs.
- **[`jhste-to-spec`](skills/jhste-to-spec/SKILL.md)** — synthesizes an already discussed or defined change into a reviewable engineering specification grounded in repository evidence.
- **[`jhste-to-tickets`](skills/jhste-to-tickets/SKILL.md)** — splits defined work into GitHub parent/sub-issues with native dependencies.
- **[`jhste-handoff`](skills/jhste-handoff/SKILL.md)** — creates or updates executor-neutral implementation handoffs with ownership, phase progress, verification, blockers, and an exact resume point.
- **[`jhste-implementation-finalizer`](skills/jhste-implementation-finalizer/SKILL.md)** — independently audits and verifies claimed-complete or submitted implementation work, fixes gaps, finishes it, and completes already-authorized PR updates.
- **[`jhste-pr-review`](skills/jhste-pr-review/SKILL.md)** — reviews explicitly requested PRs against the actual diff and posts only high-confidence actionable findings.
- **[`jhste-review-followup`](skills/jhste-review-followup/SKILL.md)** — validates existing PR feedback and pushes only justified fixes to the existing PR branch.

The skills do not require or automatically call one another, and `jhste-prototype` is not a mandatory pre-step for coding. A sufficiently clear implementation belongs to `jhste-coding`; only an important uncertainty about what to build that needs runnable evidence belongs to `jhste-prototype`; an unexplained failure in existing behavior belongs to `jhste-diagnosing-bugs`; and a user-owned policy decision belongs to `jhste-grill`. Once a prototype direction is selected, `jhste-coding` implements it for production and `jhste-to-spec` records it only when a specification is requested.

## Behavioral boundaries

- `jhste-coding` applies to sufficiently understood code changes and ordinary continuation from an existing handoff or partial implementation. Executable experiments that test an important design assumption before production belong to `jhste-prototype`.
- `jhste-prototype` answers one concrete question about a state model, business rule, data shape, API surface, interaction flow, or UI structure with disposable runnable evidence. It does not take over ordinary implementation, diagnosis of an existing failure, static mockups, open-ended ideation, or production-ready delivery.
- `jhste-diagnosing-bugs` applies when an observed failure needs a reproduction signal, competing hypotheses, instrumentation, or measurement. Testing a design that has not been built yet belongs to `jhste-prototype`.
- `jhste-grill` applies when the user wants an interview or decision stress test. It does not let a prototype guess a user-owned choice; once a decision is settled, representability or ergonomics that need executable evidence can move to `jhste-prototype`.
- `jhste-domain-modeling` owns focused domain-language clarification and the corresponding glossary and qualifying ADR updates, not incidental code naming or generic architecture discussion.
- `jhste-to-spec` defines settled behavior, contracts, validation, and scope. It does not freeze a guess into a specification when an unresolved design assumption should first be tested.
- `jhste-to-tickets` drafts or publishes a GitHub issue graph. It does not duplicate local handoff state across issue bodies.
- `jhste-handoff` runs only when the user asks to create, update, refresh, or phase a handoff document. It does not own implementation merely because an existing handoff must be read.
- `jhste-implementation-finalizer` applies to production implementation explicitly submitted for independent audit, verification, correction, or final completion. It does not promote disposable prototype code; a selected direction is implemented properly with `jhste-coding`.
- `jhste-pr-review` applies only to an explicit review-only request and does not modify the branch.
- `jhste-review-followup` applies only when existing PR feedback defines the scope. It is not the general completion workflow for a worker result or partially implemented branch.

This package does not include a mandatory TDD workflow, Wayfinder, a generic delivery orchestrator, or a separate architecture-audit skill. Existing skills and available implementation mechanisms can be composed without adding a routing layer until repeated real failures justify its context and maintenance cost.

## Install user-wide from npm

This package has no CLI. It distributes the eleven skills and their Codex metadata.

```sh
npm install -g jhste-skills
mkdir -p "$HOME/.agents/skills"
cp -R "$(npm root -g)/jhste-skills/skills/." "$HOME/.agents/skills/"
```

Run the copy command again after updating the npm package. Restart Codex if the updated skills do not appear.

## Install user-wide from the repository

```sh
mkdir -p "$HOME/.agents/skills"
cp -R skills/. "$HOME/.agents/skills/"
```

If another agent expects a different global skills directory, copy the eleven directories under `skills/` there. This package does not require project-local skill copies.

## Development and validation

```sh
npm test
npm pack --dry-run
```

`npm test` checks package, metadata, and documentation consistency plus 78 static routing scenarios across nine covered skills. The fixture does not invoke a model or measure live automatic-trigger accuracy.

External sources and license attribution are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). When a change containing a new package version is merged to `main`, or a `v*.*.*` release tag is pushed, GitHub Actions runs release checks and publishes the version through npm trusted publishing if it is not already present.
