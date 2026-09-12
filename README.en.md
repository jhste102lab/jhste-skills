# jhste-skills

[한국어](README.md) | ENG

A personal engineering skill set designed to stay independent of any model or execution harness. The skills do not select models or reasoning levels. They respect the user's harness configuration, route work to the right contract, minimize unnecessary questions, and continue to a verifiable result.

Core `SKILL.md` files contain the task contract and important boundaries. Rare formats, recovery paths, and specialized variants live under `references/` and are loaded only when needed.

## Decide what to build

- **[`jhste-grill`](skills/jhste-grill/SKILL.md)** — asks currently answerable consequential decisions in compact rounds while recording settled language and qualifying ADRs.
- **[`jhste-to-questionnaire`](skills/jhste-to-questionnaire/SKILL.md)** — turns facts or decisions the current user cannot supply into a focused questionnaire for the person or role that owns them.
- **[`jhste-domain-modeling`](skills/jhste-domain-modeling/SKILL.md)** — clarifies project-specific terms, concept boundaries, and relationships while updating the owning glossary and qualifying ADRs.
- **[`jhste-to-spec`](skills/jhste-to-spec/SKILL.md)** — turns an already discussed or defined change into a reviewable behavioral specification without restarting the interview.

## Build and fix

- **[`jhste-prototype`](skills/jhste-prototype/SKILL.md)** — answers one pre-implementation design question with a disposable runnable experiment.
- **[`jhste-coding`](skills/jhste-coding/SKILL.md)** — implements clear features, known fixes, refactors, exact resume steps, and in-progress merge or rebase conflict resolution with relevant self-verification.
- **[`jhste-diagnosing-bugs`](skills/jhste-diagnosing-bugs/SKILL.md)** — diagnoses existing failures and performance regressions whose cause is unclear, using symptom-specific evidence and measurements.

## Divide and continue work

- **[`jhste-subagent-orchestration`](skills/jhste-subagent-orchestration/SKILL.md)** — coordinates bounded workers when separation creates value while the head retains decisions, ownership, integration, and final verification.
- **[`jhste-to-tickets`](skills/jhste-to-tickets/SKILL.md)** — turns defined work into one useful GitHub issue or an issue graph with real dependencies.
- **[`jhste-handoff`](skills/jhste-handoff/SKILL.md)** — preserves verified state, authoritative references, ownership, abandoned approaches, and the exact next action for another executor.

## Recheck existing code results

- **[`jhste-code-result-double-check`](skills/jhste-code-result-double-check/SKILL.md)** — independently compares a completed or submitted code result with requirements, the task-owned diff, current code, and verification evidence, fixes in-scope gaps, and verifies the resulting state.

## Core principles

- Discover repository, documentation, and tool facts directly instead of asking the user or an external stakeholder.
- Involve the user only for product policy, compatibility, security or data policy, external writes, and other decisions or permissions only they can supply. Batch independent questions.
- When missing knowledge belongs to another person rather than the current user, use `jhste-to-questionnaire` to ask the actual owner only for what is needed.
- Model, provider, reasoning or effort, worker count, concurrency, scheduling, and actual isolation belong to the user and harness. Skills do not choose or override them.
- Use subagents only when separation saves more than repeated reading and coordination cost. Reuse current context for missing evidence or a small same-scope correction when independent judgment is not needed.
- Choose the repository-native signal that most directly distinguishes the requested result from failure. Expand validation only for relevant risk, integration surface, or observed failures, and never claim an unrun check passed.
- Requests for `jhste-grill` and `jhste-domain-modeling` include maintaining settled local glossary entries and qualifying ADRs. Commits, pushes, issues, PRs, releases, and other external writes remain limited to the request's authority.

## Main boundaries

Use `jhste-coding` to implement a clear change and verify its own result. Use `jhste-code-result-double-check` when an existing result needs an independent second pass. A normal implementation request does not automatically chain into double-check. A branch, handoff, PR, or worker result alone is not a trigger; the requested outcome matters.

Use `jhste-diagnosing-bugs` when an existing symptom has an uncertain cause, and `jhste-prototype` when a not-yet-built design question needs runnable evidence. User-owned decisions belong to `jhste-grill`; externally owned facts or decisions to `jhste-to-questionnaire`; changes to the domain model itself to `jhste-domain-modeling`.

PR review-only work and read-only assessment of existing review comments use the harness or general GitHub tools. A verified review finding with a known correction belongs to `jhste-coding`; an uncertain root cause belongs to `jhste-diagnosing-bugs`. Double-check does not replace the removed review workflows or inherit automatic comment, commit, push, or merge authority.

`jhste-subagent-orchestration` composes task skills into bounded outcomes without expanding their contracts. Acceptance workers remain read-only even when using a task skill that normally corrects code. An assignment's authority ceiling takes precedence; corrections need an authorized implementation assignment. Neither implementation completion nor double-check requires another worker by itself.

`jhste-to-spec` records the behavior contract, `jhste-to-tickets` records executable issue boundaries and dependencies, and `jhste-handoff` records the current state another executor needs. They reference authoritative artifacts instead of duplicating them.

This package does not include a mandatory TDD workflow, Wayfinder, or a separate architecture-audit skill.

## Install user-wide from npm

This package has no CLI or automatic install-sync hook. It distributes skill directories and their Codex metadata. For a new copy-based installation:

```sh
npm install -g jhste-skills@latest
mkdir -p "$HOME/.agents/skills"
cp -R "$(npm root -g)/jhste-skills/skills/." "$HOME/.agents/skills/"
```

For an existing installation, use the upgrade instructions below rather than only overwriting files. Adjust the destination when your agent uses another skills directory.

## Install user-wide from the repository

For a new installation, run from the repository root:

```sh
mkdir -p "$HOME/.agents/skills"
cp -R skills/. "$HOME/.agents/skills/"
```

## Upgrade existing installations

`npm update -g jhste-skills` updates the npm package, not copies already placed in an agent's skills directory. Version 0.15.0 removes `jhste-pr-review` and `jhste-review-followup`, and replaces `jhste-implementation-finalizer` with `jhste-code-result-double-check`. Re-copying alone leaves retired directories discoverable.

First identify every active installation path and whether it is a copy, symlink, or managed by another installer. Inspect local customizations. For the standard copy-based installation, update npm and then run the block below. It moves only this package's current and retired directories to a unique backup outside the skill discovery directory, preserving local edits and unrelated skills. Review customizations in the backup before selectively reapplying them; do not restore retired skill directories.

```sh
npm install -g jhste-skills@latest
```

<!-- BEGIN COPY UPGRADE -->
```sh
(
  set -eu
  src="$(npm root -g)/jhste-skills/skills"
  dst="$HOME/.agents/skills"
  test -f "$src/jhste-code-result-double-check/SKILL.md"
  mkdir -p "$dst"
  test "$(cd "$src" && pwd -P)" != "$(cd "$dst" && pwd -P)"
  backup="$(mktemp -d "$HOME/jhste-skills-backup.XXXXXX")"
  for source in "$src"/*; do
    name="${source##*/}"
    if [ -e "$dst/$name" ] || [ -L "$dst/$name" ]; then
      mv "$dst/$name" "$backup/$name"
    fi
  done
  for name in jhste-pr-review jhste-review-followup jhste-implementation-finalizer; do
    if [ -e "$dst/$name" ] || [ -L "$dst/$name" ]; then
      mv "$dst/$name" "$backup/$name"
    fi
  done
  cp -R "$src/." "$dst/"
  printf 'Backup: %s\n' "$backup"
)
```
<!-- END COPY UPGRADE -->

For a repository copy, use the absolute path to its `skills/` directory as `src`. For symlink or installer-managed setups, follow that setup's update mechanism instead of blindly running the copy procedure. Never delete the whole skills directory or all `jhste-*` paths; older custom or legacy installations need ownership inspection first.

Refresh or restart the agent as its harness requires. Confirm the new skill is discovered, the three retired names are absent from every active discovery path, and unrelated skills remain intact. An npm version check alone is not proof that the agent loaded the new files.

## Maintenance

[MAINTENANCE.md](MAINTENANCE.md) defines the deletion-first policy: retain safety, authority, ownership, output interfaces, and completion conditions; remove instructions that do not improve real current-model behavior.

## Development and validation

Run these commands in the repository checkout, not the installed npm package:

```sh
npm test
npm pack --dry-run
```

Tests check package composition, metadata, Markdown links, static routing contracts, release-note extraction, and copy-upgrade regressions. Static fixtures do not invoke a model, measure automatic invocation, or prove that a follow-on skill was not called. [MAINTENANCE.md](MAINTENANCE.md) identifies the live sentinel checks to run separately.

External sources and licenses are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Pull requests run read-only validation. A new version in `package.json` merged to `main`, or a matching `v*.*.*` tag, runs the publication workflow: validate, publish an unpublished npm version through trusted publishing, verify that exact registry version, and create GitHub release notes from the matching [CHANGELOG.md](CHANGELOG.md) section. Existing releases are not overwritten on retries.
