# jhste-skills

[한국어](README.md) | ENG

A personal engineering skill set maintained around GPT-5.6's outcome-first, lean-prompt guidance. Each skill works independently and may be selected implicitly when the user's intent matches its narrow trigger.

## Skills

- **`jhste-coding`** — implements sufficiently understood features, bug fixes, and refactors with a small change and relevant validation.
- **`jhste-diagnosing-bugs`** — diagnoses difficult bugs and performance regressions whose cause or correct fix is uncertain through reproduction, hypotheses, and measurement.
- **`jhste-grill`** — resolves consequential decision branches one question at a time while continuously maintaining settled domain context and ADRs.
- **`jhste-domain-modeling`** — clarifies domain terms, boundaries, and relationships, immediately recording settled glossary entries and qualifying ADRs.
- **`jhste-to-spec`** — synthesizes an already discussed or defined change into a reviewable engineering specification grounded in repository evidence.
- **`jhste-to-tickets`** — splits defined work into GitHub parent/sub-issues with native dependencies.
- **`jhste-handoff`** — creates executor-neutral implementation handoffs with ownership, phase progress, verification, blockers, and an exact resume point.
- **`jhste-implementation-finalizer`** — independently audits and finishes an existing implementation, synchronizes its handoff, and completes already-authorized PR updates.
- **`jhste-pr-review`** — reviews explicitly requested PRs against the actual diff and posts only high-confidence actionable findings.
- **`jhste-review-followup`** — validates existing PR feedback and pushes only justified fixes to the existing PR branch.

The skills do not require or automatically call one another. A request may use more than one when it contains multiple intents. Consequential choices can be resolved with `jhste-grill` and domain language with `jhste-domain-modeling`; settled behavior can become a `jhste-to-spec` artifact and GitHub work can be split with `jhste-to-tickets`. `jhste-handoff` preserves execution state for any implementation mechanism, while `jhste-implementation-finalizer` independently verifies and completes the resulting implementation. Difficult root-cause work remains with `jhste-diagnosing-bugs`, and a known correction belongs to `jhste-coding`.

## Behavioral boundaries

- `jhste-coding` applies to implementation and fixes whose code-change path is sufficiently understood. Problems centered on uncertain root cause, intermittency, or performance measurement belong to `jhste-diagnosing-bugs`; an existing worker result that needs an independent completion audit belongs to `jhste-implementation-finalizer`.
- `jhste-diagnosing-bugs` applies when root-cause work needs a reproduction signal, competing hypotheses, instrumentation, or measurement. It avoids imposing the full diagnostic loop on an obvious typo, direct compile or lint error, or already established fix.
- `jhste-grill` applies when the user wants an interview or decision stress test; ordinary ambiguity alone does not start a long interview. In a writable repository it maintains settled glossary entries and qualifying ADRs unless the request is analysis-only or forbids edits.
- `jhste-domain-modeling` owns focused domain-language clarification and the corresponding glossary and qualifying ADR updates, not incidental code naming or generic architecture discussion.
- `jhste-to-spec` defines settled behavior, contracts, validation, and scope. It does not act as a worker-progress tracker or durable resume document.
- `jhste-to-tickets` drafts or publishes a GitHub issue graph. It does not duplicate local handoff state across issue bodies.
- `jhste-handoff` runs only for an explicit handoff, resume, or implementation-context request. It follows an existing repository convention or defaults to `docs/handoff/indexes/` plus optional `docs/handoff/phases/`, and it remains independent of the eventual executor.
- `jhste-implementation-finalizer` starts from an existing or partial implementation and treats completion claims as unverified. It fixes in-scope gaps and may commit, push, or update the named existing PR only when those writes were already authorized; it does not merge by default.
- `jhste-pr-review` applies only to an explicit review-only request and does not modify the branch.
- `jhste-review-followup` applies only when existing PR feedback defines the scope. It is not the general completion workflow for a worker result or partially implemented branch.

This package does not include a mandatory TDD workflow, Wayfinder, a generic delivery orchestrator, or a separate architecture-audit skill. Existing skills and available implementation mechanisms can be composed without adding a routing layer until repeated real failures justify its context and maintenance cost.

## Install user-wide from npm

This package has no CLI. It distributes the ten skills and their Codex metadata.

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

If another agent expects a different global skills directory, copy the ten directories under `skills/` there. This package does not require project-local skill copies.

## Development and validation

```sh
npm test
npm pack --dry-run
```

`npm test` checks package, metadata, and documentation consistency plus 48 static routing scenarios for the eight changed skills. The fixture does not invoke a model or measure live automatic-trigger accuracy.

External sources and license attribution are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Pushing a `v*.*.*` release tag runs GitHub Actions checks and publishes the package through npm trusted publishing.
