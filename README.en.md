# jhste-skills

[한국어](README.md) | ENG

A personal engineering skill set maintained around GPT-5.6's outcome-first, lean-prompt guidance. Each skill works independently and may be selected implicitly when the user's intent matches its narrow trigger.

## Skills

- **`jhste-coding`** — implements features, fixes bugs, and refactors code with a small change and relevant validation.
- **`jhste-grill`** — sharpens a plan or design through one consequential decision question at a time.
- **`jhste-pr-review`** — reviews explicitly requested pull requests against the actual diff and posts only high-confidence findings.
- **`jhste-to-tickets`** — splits defined work into GitHub parent/sub-issues with native dependencies.
- **`jhste-domain-modeling`** — clarifies domain terms, boundaries, and relationships, and records them in a glossary or ADR when requested.

The skills do not require or automatically call one another. A request may use more than one when it contains multiple intents. For example, invoke `jhste-grill` with `jhste-domain-modeling` to interview through a design and record the domain terms that become settled.

## Behavioral boundaries

- `jhste-coding` applies only when repository code must change.
- `jhste-grill` applies when the user wants an interview or decision stress test; ordinary ambiguity alone must not start a long interview.
- `jhste-pr-review` applies only when the user explicitly requests a pull request code review. It reviews the actual diff, posts only high-confidence findings, and uses `COMMENT` as the default review event.
- `jhste-to-tickets` drafts by default. It writes to GitHub only when the user explicitly asks to create, post, or publish the issues.
- `jhste-domain-modeling` analyzes and proposes by default. It edits repository documentation only when the user asks to record or apply the decisions.

This package intentionally omits TDD, debugging-process, Wayfinder, and architecture-audit workflows. It favors the model's baseline capabilities and repository CI or guidance, adding another skill only after a repeated real failure justifies it.

## Install user-wide from npm

This package has no CLI. It distributes the five skills and their Codex metadata.

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

If another agent expects a different global skills directory, copy the five directories under `skills/` there. This package does not require project-local skill copies.

## Development and validation

```sh
npm test
npm pack --dry-run
```

Pushing a `v*.*.*` release tag runs GitHub Actions checks and publishes the package through npm trusted publishing.
