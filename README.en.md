# jhste-skills

[한국어](README.md) | ENG

A personal engineering skill set designed to stay independent of any model or execution harness. The skills do not select models or reasoning levels. They respect the user's harness configuration, route work to the right contract, minimize unnecessary questions, and continue to a verifiable result.

Core `SKILL.md` files contain the task contract and important boundaries. Rare formats, recovery paths, and specialized variants live under `references/` and are loaded only when needed.

## Decide what to build

- **[`jhste-grill`](skills/jhste-grill/SKILL.md)** — asks all currently answerable consequential decisions in compact rounds while recording settled language and qualifying ADRs.
- **[`jhste-domain-modeling`](skills/jhste-domain-modeling/SKILL.md)** — clarifies project-specific terms, concept boundaries, and relationships while updating the owning glossary and qualifying ADRs.
- **[`jhste-to-spec`](skills/jhste-to-spec/SKILL.md)** — turns an already discussed or defined change into a reviewable behavioral specification without restarting the interview.

## Build and fix

- **[`jhste-prototype`](skills/jhste-prototype/SKILL.md)** — tests one design question with the smallest runnable experiment and loads logic or UI detail only when relevant.
- **[`jhste-coding`](skills/jhste-coding/SKILL.md)** — implements clear features, known fixes, refactors, and exact resume steps while preserving repository contracts.
- **[`jhste-diagnosing-bugs`](skills/jhste-diagnosing-bugs/SKILL.md)** — diagnoses uncertain failures and performance regressions through symptom-specific signals, competing explanations, runtime evidence, and measurement.

## Divide and continue work

- **[`jhste-subagent-orchestration`](skills/jhste-subagent-orchestration/SKILL.md)** — chooses the lightest useful structure among direct work, one owner, parallel owners, and dynamic verified waves.
- **[`jhste-to-tickets`](skills/jhste-to-tickets/SKILL.md)** — turns defined work into one useful GitHub issue or an issue graph with real dependencies.
- **[`jhste-handoff`](skills/jhste-handoff/SKILL.md)** — creates a portable transfer for another executor or a durable record for shared evolving state.

## Review and finish

- **[`jhste-implementation-finalizer`](skills/jhste-implementation-finalizer/SKILL.md)** — compares a completion claim with requirements, the task-owned diff, and actual evidence, then fixes in-scope gaps.
- **[`jhste-pr-review`](skills/jhste-pr-review/SKILL.md)** — discovers defect candidates broadly, then posts only verified material findings.
- **[`jhste-review-followup`](skills/jhste-review-followup/SKILL.md)** — validates existing PR feedback and pushes only justified fixes to the existing PR branch.

## Core principles

- Discover repository, documentation, and tool facts directly instead of asking the user.
- Involve the user only for product policy, compatibility, security or data policy, external writes, and other decisions or permissions only they can supply. Batch independent questions.
- Model, provider, reasoning or effort, worker count, concurrency, scheduling, and actual isolation belong to the user and harness. Skills do not choose or override them.
- Use subagents only when separation saves more than repeated reading and coordination cost. Reuse current context for missing evidence or a small same-scope correction when independent judgment is not needed.
- Do not maximize test count. Choose the repository-native signal that most directly distinguishes the requested result from failure, and expand validation only when risk or integration surface requires it.
- Requests for `jhste-grill` and `jhste-domain-modeling` include maintaining settled local glossary entries and qualifying ADRs. Commits, pushes, issues, PRs, releases, and other external writes remain limited to the request's authority.

## Main boundaries

Use `jhste-coding` when the implementation direction is clear, `jhste-prototype` when a not-yet-built design question needs runnable evidence, and `jhste-diagnosing-bugs` when an existing failure has an uncertain cause. User-owned decisions belong to `jhste-grill`; changes to the domain model itself belong to `jhste-domain-modeling`.

`jhste-subagent-orchestration` composes task skills into bounded outcomes without copying or expanding their contracts. It does not manufacture multiple stages for one linear task or add an acceptance worker merely because implementation completed.

`jhste-to-spec` records the behavior contract, `jhste-to-tickets` records executable issue boundaries and dependencies, and `jhste-handoff` records the current state another executor needs. They reference authoritative artifacts instead of duplicating them.

This package does not include a mandatory TDD workflow, Wayfinder, or a separate architecture-audit skill.

## Install user-wide from npm

This package has no CLI. It distributes the twelve skills and their Codex metadata.

```sh
npm install -g jhste-skills
mkdir -p "$HOME/.agents/skills"
cp -R "$(npm root -g)/jhste-skills/skills/." "$HOME/.agents/skills/"
```

Run the copy command again after updating the npm package. If another agent expects a different global skills directory, copy the twelve directories under `skills/` there.

## Install user-wide from the repository

```sh
mkdir -p "$HOME/.agents/skills"
cp -R skills/. "$HOME/.agents/skills/"
```

## Maintenance

[MAINTENANCE.md](MAINTENANCE.md) defines the deletion-first policy for new model and harness generations: remove candidates, observe real work, and restore only the smallest instruction that fixes a repeated material failure. Safety, authority, ownership, output interfaces, and completion conditions remain durable contracts.

## Development and validation

```sh
npm test
npm pack --dry-run
```

`npm test` checks package, metadata, documentation and reference links, plus 90 static routing contracts. The fixture does not invoke a model or measure live automatic-trigger accuracy.

External sources and license attribution are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). When a change containing a new package version is merged to `main`, or a `v*.*.*` release tag is pushed, GitHub Actions runs release checks and publishes the version through npm trusted publishing if it is not already present.
