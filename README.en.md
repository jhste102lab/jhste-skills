# jhste-skills

[한국어](README.md) | ENG

A personal engineering skill set maintained around GPT-5.6's outcome-first, lean-prompt guidance. Each skill works independently and may be selected implicitly when the user's intent matches its narrow trigger.

## Skills

- **[`jhste-coding`](skills/jhste-coding/SKILL.md)** — implements sufficiently understood features, bug fixes, refactors, and ordinary continuation from a handoff's exact resume point with a small change and relevant validation.
- **[`jhste-prototype`](skills/jhste-prototype/SKILL.md)** — tests one important design question before production implementation with the smallest disposable runnable evidence.
- **[`jhste-subagent-orchestration`](skills/jhste-subagent-orchestration/SKILL.md)** — coordinates bounded investigation, implementation, and acceptance workers under a decision-owning head when delegation is explicit or has concrete structural benefit.
- **[`jhste-diagnosing-bugs`](skills/jhste-diagnosing-bugs/SKILL.md)** — diagnoses difficult bugs and performance regressions whose cause or correct fix is uncertain through reproduction, hypotheses, and measurement.
- **[`jhste-grill`](skills/jhste-grill/SKILL.md)** — resolves consequential decision branches one question at a time while continuously maintaining settled domain context and ADRs.
- **[`jhste-domain-modeling`](skills/jhste-domain-modeling/SKILL.md)** — clarifies domain terms, boundaries, and relationships, immediately recording settled glossary entries and qualifying ADRs.
- **[`jhste-to-spec`](skills/jhste-to-spec/SKILL.md)** — synthesizes an already discussed or defined change into a reviewable engineering specification grounded in repository evidence.
- **[`jhste-to-tickets`](skills/jhste-to-tickets/SKILL.md)** — splits defined work into GitHub parent/sub-issues with native dependencies.
- **[`jhste-handoff`](skills/jhste-handoff/SKILL.md)** — creates or updates executor-neutral implementation handoffs with ownership, phase progress, verification, blockers, and an exact resume point.
- **[`jhste-implementation-finalizer`](skills/jhste-implementation-finalizer/SKILL.md)** — independently audits and verifies claimed-complete or submitted implementation work, fixes gaps, finishes it, and completes already-authorized PR updates.
- **[`jhste-pr-review`](skills/jhste-pr-review/SKILL.md)** — reviews explicitly requested PRs against the actual diff and posts only high-confidence actionable findings.
- **[`jhste-review-followup`](skills/jhste-review-followup/SKILL.md)** — validates existing PR feedback and pushes only justified fixes to the existing PR branch.

Most skills do not require or automatically call one another. `jhste-subagent-orchestration` composes existing task skills into bounded worker assignments only when real worker execution exists and delegation is explicit or provides concrete structural benefit; it does not copy their contracts or expand their authority. A sufficiently clear implementation belongs to `jhste-coding`; only an important uncertainty about what to build that needs runnable evidence belongs to `jhste-prototype`; an unexplained failure in existing behavior belongs to `jhste-diagnosing-bugs`; and a user-owned policy decision belongs to `jhste-grill`. Once a prototype direction is selected, `jhste-coding` implements it for production and `jhste-to-spec` records it only when a specification is requested.

## Behavioral boundaries

- `jhste-coding` applies to sufficiently understood code changes and ordinary continuation from an existing handoff or partial implementation. Executable experiments that test an important design assumption before production belong to `jhste-prototype`.
- `jhste-prototype` answers one concrete question about a state model, business rule, data shape, API surface, interaction flow, or UI structure with disposable runnable evidence. It does not take over ordinary implementation, diagnosis of an existing failure, static mockups, open-ended ideation, or production-ready delivery.
- `jhste-subagent-orchestration` applies whenever the user explicitly requests subagents, delegation, a head-and-worker split, parallel fan-out across agents, or a separate-agent acceptance pass. Implicit use requires decision-complete, independently verifiable work whose consequential judgment remains with the head. It does not take over ordinary linear work already owned by another task skill, unresolved user decisions, or domain meanings such as Kubernetes orchestration. Coordination weight is sized to the work: a single settled change gets one implementation worker, and the three-stage split is a ceiling for consequential work rather than a default. The harness owns worker limits, worker capability tiers, and actual permission or isolation enforcement.
- `jhste-diagnosing-bugs` applies when an observed failure needs a reproduction signal, competing hypotheses, instrumentation, or measurement. Testing a design that has not been built yet belongs to `jhste-prototype`.
- `jhste-grill` applies when the user wants an interview or decision stress test. It does not let a prototype guess a user-owned choice; once a decision is settled, representability or ergonomics that need executable evidence can move to `jhste-prototype`.
- `jhste-domain-modeling` owns focused domain-language clarification and the corresponding glossary and qualifying ADR updates, not incidental code naming or generic architecture discussion.
- `jhste-to-spec` defines settled behavior, contracts, validation, and scope. It does not freeze a guess into a specification when an unresolved design assumption should first be tested.
- `jhste-to-tickets` drafts or publishes a GitHub issue graph. It does not duplicate local handoff state across issue bodies.
- `jhste-handoff` runs only when the user asks to create, update, refresh, or phase a handoff document. It does not own implementation merely because an existing handoff must be read.
- `jhste-implementation-finalizer` applies to production implementation explicitly submitted for independent audit, verification, correction, or final completion. It does not promote disposable prototype code or serve as a read-only acceptance worker; a selected direction is implemented properly with `jhste-coding`.
- `jhste-pr-review` applies only to an explicit review-only request and does not modify the branch.
- `jhste-review-followup` applies only when existing PR feedback defines the scope. It is not the general completion workflow for a worker result or partially implemented branch.

This package does not include a mandatory TDD workflow, Wayfinder, or a separate architecture-audit skill. Orchestration is narrowly limited to real worker coordination and does not replace ordinary single-agent delivery.

## Install user-wide from npm

This package has no CLI. It distributes the twelve skills and their Codex metadata.

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

If another agent expects a different global skills directory, copy the twelve directories under `skills/` there. This package does not require project-local skill copies.

## Development and validation

```sh
npm test
npm pack --dry-run
```

`npm test` checks package, metadata, and documentation consistency plus 90 static routing scenarios across ten covered skills. The fixture does not invoke a model or measure live automatic-trigger accuracy.

External sources and license attribution are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). When a change containing a new package version is merged to `main`, or a `v*.*.*` release tag is pushed, GitHub Actions runs release checks and publishes the version through npm trusted publishing if it is not already present.
