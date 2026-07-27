# jhste-skills

[한국어](README.md) | ENG

A personal engineering skill set maintained around GPT-5.6's outcome-first, lean-prompt guidance. Each skill works independently and may be selected implicitly when the user's intent matches its narrow trigger.

## Skills

- **`jhste-coding`** — implements sufficiently understood features, bug fixes, refactors, and ordinary continuation from a handoff's exact resume point with a small change and relevant validation.
- **`jhste-diagnosing-bugs`** — diagnoses difficult bugs and performance regressions whose cause or correct fix is uncertain through reproduction, hypotheses, and measurement.
- **`jhste-grill`** — resolves consequential decision branches one question at a time while continuously maintaining settled domain context and ADRs.
- **`jhste-domain-modeling`** — clarifies domain terms, boundaries, and relationships, immediately recording settled glossary entries and qualifying ADRs.
- **`jhste-to-spec`** — synthesizes an already discussed or defined change into a reviewable engineering specification grounded in repository evidence.
- **`jhste-to-tickets`** — splits defined work into GitHub parent/sub-issues with native dependencies.
- **`jhste-handoff`** — creates or updates executor-neutral implementation handoffs with ownership, phase progress, verification, blockers, and an exact resume point.
- **`jhste-implementation-finalizer`** — independently audits and verifies claimed-complete or submitted implementation work, fixes gaps, finishes it, and completes already-authorized PR updates.
- **`jhste-pr-review`** — reviews explicitly requested PRs against the actual diff and posts only high-confidence actionable findings.
- **`jhste-review-followup`** — validates existing PR feedback and pushes only justified fixes to the existing PR branch.

The skills do not require or automatically call one another. Merely reading a handoff does not select `jhste-handoff` or `jhste-implementation-finalizer`. Ordinary continuation from a clear resume point belongs to `jhste-coding`, unresolved root-cause work belongs to `jhste-diagnosing-bugs`, and an explicit independent audit or final acceptance of a completion claim belongs to `jhste-implementation-finalizer`.

## Behavioral boundaries

- `jhste-coding` applies to sufficiently understood code changes and ordinary continuation from an existing handoff or partial implementation.
- `jhste-diagnosing-bugs` applies when root-cause work needs a reproduction signal, competing hypotheses, instrumentation, or measurement. It avoids imposing the full diagnostic loop on an obvious typo, direct compile or lint error, or already established fix.
- `jhste-grill` applies when the user wants an interview or decision stress test; ordinary ambiguity alone does not start a long interview. In a writable repository it maintains settled glossary entries and qualifying ADRs unless the request is analysis-only or forbids edits.
- `jhste-domain-modeling` owns focused domain-language clarification and the corresponding glossary and qualifying ADR updates, not incidental code naming or generic architecture discussion.
- `jhste-to-spec` defines settled behavior, contracts, validation, and scope. It does not act as a worker-progress tracker or durable resume document.
- `jhste-to-tickets` drafts or publishes a GitHub issue graph. It does not duplicate local handoff state across issue bodies.
- `jhste-handoff` runs only when the user asks to create, update, refresh, or phase a handoff document. It does not own implementation merely because an existing handoff must be read.
- `jhste-implementation-finalizer` applies when existing work is explicitly submitted for independent audit, verification, correction, or final completion. The existence of a handoff, partial implementation, branch, diff, worktree, or worker result alone is not enough.
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

`npm test` checks package, metadata, and documentation consistency plus 52 static routing scenarios for the eight changed skills. The fixture does not invoke a model or measure live automatic-trigger accuracy.

External sources and license attribution are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). When a change containing a new package version is merged to `main`, or a `v*.*.*` release tag is pushed, GitHub Actions runs release checks and publishes the version through npm trusted publishing if it is not already present.
