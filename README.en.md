# jhste-skills

[한국어](README.md) | ENG

A personal engineering skill set designed to remain independent of any model or execution harness. The skills do not select models or reasoning levels. They respect the user's harness configuration and focus on routing work correctly, minimizing unnecessary questions, and carrying authorized work through to a verifiable result.

## Decide what to build

- **[`jhste-grill`](skills/jhste-grill/SKILL.md)** — asks all currently answerable consequential decisions in compact rounds while recording settled language and qualifying ADRs.
- **[`jhste-domain-modeling`](skills/jhste-domain-modeling/SKILL.md)** — clarifies project-specific terms, concept boundaries, and relationships while updating the owning glossary and qualifying ADRs.
- **[`jhste-to-spec`](skills/jhste-to-spec/SKILL.md)** — turns an already discussed or defined change into a reviewable behavioral specification without restarting the interview.

## Build and fix

- **[`jhste-prototype`](skills/jhste-prototype/SKILL.md)** — tests one important design question before production implementation with the smallest useful runnable experiment.
- **[`jhste-coding`](skills/jhste-coding/SKILL.md)** — implements sufficiently understood features, bug fixes, refactors, and ordinary continuation from a handoff's exact resume point with a small change and relevant validation.
- **[`jhste-diagnosing-bugs`](skills/jhste-diagnosing-bugs/SKILL.md)** — diagnoses uncertain bugs and performance regressions through a useful signal, hypotheses, runtime evidence, and measurement.

## Divide and continue work

- **[`jhste-subagent-orchestration`](skills/jhste-subagent-orchestration/SKILL.md)** — coordinates only the investigation, implementation, and independent checks that create real value under a decision-owning head.
- **[`jhste-to-tickets`](skills/jhste-to-tickets/SKILL.md)** — turns defined work into the smallest useful GitHub issue or an issue graph with real dependencies.
- **[`jhste-handoff`](skills/jhste-handoff/SKILL.md)** — creates either a single portable handoff for another session, agent, or harness, or a durable handoff for shared long-running state.

## Review and finish

- **[`jhste-implementation-finalizer`](skills/jhste-implementation-finalizer/SKILL.md)** — independently audits claimed-complete or submitted implementation work, fixes in-scope gaps, verifies it, and finishes it.
- **[`jhste-pr-review`](skills/jhste-pr-review/SKILL.md)** — reviews explicitly requested PRs against the actual diff and posts only high-confidence actionable findings.
- **[`jhste-review-followup`](skills/jhste-review-followup/SKILL.md)** — validates existing PR feedback and pushes only justified fixes to the existing PR branch.

## Core principles

- Discover repository, documentation, and tool facts directly instead of asking the user.
- Involve the user only for product policy, compatibility, security or data policy, external writes, and other decisions or permissions only they can supply. Batch independent questions into one round.
- Model, provider, reasoning or effort, worker count, concurrency, and actual isolation belong to the user and harness. Skills do not choose or override them.
- Use subagents only when separation saves more than repeated reading and coordination cost. Reuse a current worker for missing evidence or a small correction in the same scope; use a fresh worker when independent judgment matters.
- Do not maximize tests. Run the narrowest honest check that can distinguish success from failure, and do not impose mandatory TDD on every task.
- Requests for `jhste-grill` and `jhste-domain-modeling` include maintaining settled local glossary entries and qualifying ADRs. Commits, pushes, issues, PRs, releases, and other external writes remain limited to the authority in the request.

## Main boundaries

Use `jhste-coding` when the implementation direction is clear, `jhste-prototype` when a not-yet-built design question needs runnable evidence, and `jhste-diagnosing-bugs` when an existing failure has an uncertain cause. User-owned decisions belong to `jhste-grill`; changes to the domain model itself belong to `jhste-domain-modeling`.

`jhste-subagent-orchestration` composes task skills into bounded assignments without copying or expanding their contracts. It does not manufacture multiple stages for one linear task or add an acceptance worker merely because implementation completed.

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

## Development and validation

```sh
npm test
npm pack --dry-run
```

`npm test` checks package, metadata, and documentation consistency plus 90 static routing contracts. The fixture does not invoke a model or measure live automatic-trigger accuracy.

External sources and license attribution are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). When a change containing a new package version is merged to `main`, or a `v*.*.*` release tag is pushed, GitHub Actions runs release checks and publishes the version through npm trusted publishing if it is not already present.
