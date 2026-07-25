# jhste-skills

[한국어](README.md) | ENG

A personal engineering skill set maintained around GPT-5.6's outcome-first, lean-prompt guidance. Each skill works independently and may be selected implicitly when the user's intent matches its narrow trigger.

## Skills

- **`jhste-coding`** — implements sufficiently understood features, bug fixes, and refactors with a small change and relevant validation.
- **`jhste-diagnosing-bugs`** — diagnoses difficult bugs and performance regressions whose cause or correct fix is uncertain through reproduction, hypotheses, and measurement.
- **`jhste-grill`** — sharpens a plan or design through one consequential decision question at a time.
- **`jhste-domain-modeling`** — clarifies domain terms, boundaries, and relationships, and records them in a glossary or ADR when requested.
- **`jhste-to-spec`** — synthesizes an already discussed or defined change into a reviewable engineering specification grounded in repository evidence.
- **`jhste-to-tickets`** — splits defined work into GitHub parent/sub-issues with native dependencies.
- **`jhste-pr-review`** — reviews explicitly requested PRs against the actual diff and posts only high-confidence actionable findings.
- **`jhste-review-followup`** — validates existing PR feedback and pushes only justified fixes to the existing PR branch.

The skills do not require or automatically call one another. A request may use more than one when it contains multiple intents. For example, unresolved decisions can go through `jhste-grill` or `jhste-domain-modeling`, settled decisions can become a `jhste-to-spec` artifact, and `jhste-to-tickets` can then create the executable issue graph. Once a difficult diagnosis establishes a clear correction, `jhste-coding` can apply it.

## Behavioral boundaries

- `jhste-coding` applies to implementation and fixes whose code-change path is sufficiently understood. Problems centered on uncertain root cause, intermittency, or performance measurement belong to `jhste-diagnosing-bugs` first.
- `jhste-diagnosing-bugs` applies when root-cause work needs a reproduction signal, competing hypotheses, instrumentation, or measurement. It avoids imposing the full diagnostic loop on an obvious typo, direct compile or lint error, or already established fix.
- `jhste-grill` applies when the user wants an interview or decision stress test; ordinary ambiguity alone does not start a long interview.
- `jhste-domain-modeling` analyzes and proposes by default. It edits repository documentation only when the user asks to record or apply the decisions.
- `jhste-to-spec` drafts in the conversation by default and leaves unsettled matters as open questions. It writes a repository file or tracker artifact only when the user requests that write.
- `jhste-to-tickets` drafts by default. It writes to GitHub only when the user explicitly asks to create, post, or publish the issues, and it does not invent workflow labels that are absent from repository policy.
- `jhste-pr-review` applies only to an explicit PR code-review request. That request authorizes high-confidence inline review comments with the `COMMENT` event; approval or change-request decisions still require the exact explicit action.
- `jhste-review-followup` applies only when the user explicitly asks to handle existing PR review feedback. It validates each item, fixes justified root causes, validates the result, and updates the existing PR branch. It does not merge, reply, resolve threads, change issues, or clean up work artifacts.

This package does not include a mandatory TDD workflow, Wayfinder, or a separate architecture-audit skill. Design judgments about module ownership, caller contracts, real variation, and test seams stay inside the current `jhste-coding` change. They can be split later if repeated usage failures justify the orchestration and maintenance cost.

## Install user-wide from npm

This package has no CLI. It distributes the eight skills and their Codex metadata.

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

If another agent expects a different global skills directory, copy the eight directories under `skills/` there. This package does not require project-local skill copies.

## Development and validation

```sh
npm test
npm pack --dry-run
```

`npm test` checks package, metadata, and documentation consistency plus a static routing-scenario contract for the four changed skills. The fixture does not invoke a model or measure live automatic-trigger accuracy.

External sources and license attribution are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Pushing a `v*.*.*` release tag runs GitHub Actions checks and publishes the package through npm trusted publishing.
