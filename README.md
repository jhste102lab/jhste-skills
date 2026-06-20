# jhste-skills

Languages: [English](README.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md)

An installable working-rules kit that helps AI coding agents consistently follow your engineering standards.

`jhste-skills` gives Codex, Claude Code, and other AI coding agents a shared engineering workflow. It helps agents verify assumptions before editing, respect repo-local instructions, keep API/database/automation boundaries clear, check whether each module has one clear responsibility under SRP (Single Responsibility Principle), run changed-file guards, and perform a red-team code review before claiming work is complete.

This tool does **not** take over your project. Repo-local `AGENTS.md`, `CLAUDE.md`, and docs remain authoritative. The default setup is advisory, marker-managed, and designed to be low-risk to try.

Skills are designed to be used automatically when the situation calls for them. For example, when an agent edits API code, it is guided to use the API/database boundary skill; before completion, it is guided to use the red-team review skill. You can also call a skill directly, for example: `use jhste-engineering-judgment to review this change premise`, or `run jhste-red-team-review on this diff`.

## Why install this?

AI coding agents are fast, but they fail in predictable ways:

- They silently accept unclear requirements or incorrect premises.
- They expand the scope while trying to be helpful.
- They mix UI, route/controller, service, database, and side-effect responsibilities in one place, breaking the “one module, one responsibility” principle (SRP).
- They hide failures or produce unsafe logs.
- They say “done” before the changed code has been checked.
- They forget repo-specific rules when you switch machines or repositories.

`jhste-skills` gives agents a repeatable loop for reducing those failures:

```text
Before a non-trivial code change:
  check the goal, premise, ownership seam, data contract, failure path, and SRP responsibility

While editing:
  treat repo-local instructions as the authority

After changing code:
  run a fast changed-file guard when available

Before saying “done”:
  run a read-only red-team code review

If warnings appear:
  attempt a bounded fix, re-check, and stop instead of looping forever
```

The expected result is smaller diffs, clearer SRP boundaries, safer API/database code, fewer silent assumptions, and more honest completion reports.

## Who should install this?

Install `jhste-skills` if you:

- use Codex, Claude Code, or another coding agent across multiple repositories;
- want agents to verify assumptions before non-trivial code changes;
- want existing repo docs to remain the source of authority;
- want lightweight advisory checks before commit or before declaring work complete;
- care about SRP, API/database boundaries, safe logging, input validation, side effects, and automation reliability;
- want to restore the same AI coding workflow across machines and repositories.

You may not need this if you only want a single prompt file, want strict CI enforcement immediately after installation, do not want generated `.jhste/` files or bridge blocks, or expect this tool to automatically refactor code.

## Quick start

```bash
npx jhste-skills install
```

Or install the CLI globally with npm and use it from any repository:

```bash
npm install -g jhste-skills
jhste-skills install
```

Use `npx` when you want a one-off run without a global install. Use `npm install -g` when you want `jhste-skills` available as a normal shell command.

The default install uses Normal mode.

- Installs all bundled skills: jhste core skills + vendored workflow skills.
- Creates `.jhste/profile.yaml` when missing.
- Adds or refreshes a marker-managed bridge block in `AGENTS.md` or `CLAUDE.md` when project guidance is enabled.
- Installs an advisory pre-commit hook when safe.
- Does not modify CI, target `package.json`, lockfiles, or source code.

To connect another repository:

```bash
cd /path/to/another-repo
jhste-skills connect
```

To install only the jhste core guardrail skills:

```bash
npx jhste-skills install --skill-set core
```

To run the changed-file guard manually:

```bash
jhste-skills guard --scope changed --format text --fail-on error
```

To run an optional repo-wide advisory scan:

```bash
jhste-skills deep-scan
```

To remove managed outputs:

```bash
jhste-skills uninstall --yes --repo /path/to/repo
```

`uninstall` removes managed hooks, marker-managed bridge blocks, and manifest-managed skill directories. It does not touch non-managed files. `.jhste/profile.yaml` is removed only when it still matches the generated shape; use `--force-profile` only after reviewing a modified profile.

## Install modes

```text
Minimal  - installs only jhste core skills; no project files or hooks
Normal   - recommended default; all bundled skills + project profile/bridge + advisory pre-commit hook
Full     - all bundled skills + profile/bridge + advisory pre-commit/pre-push hooks + deep scan
Custom   - asks effect-oriented questions so you can choose the setup
```

`Full` still follows the safety contract. It does not overwrite non-managed hooks, source files, CI, `package.json`, or lockfiles, and it does not enable strict mode. Interactive Full mode only asks how automatic checks should behave: warning-only, block at commit time, or block at commit and push time. `--yes` uses warning-only unless `--hooks blocking` is explicit.

## Safety contract

`jhste-skills` is safe-by-default:

- repo-local `AGENTS.md`, `CLAUDE.md`, and docs remain authoritative;
- explicit user instructions set task scope, but do not silently override verified safety, privacy, data-loss, or repo-architecture constraints;
- default install does not modify CI;
- default install does not modify target `package.json` or lockfiles;
- default install does not automatically refactor source code;
- managed hooks are advisory by default;
- strict mode requires explicit opt-in;
- bridge blocks use `<!-- jhste-skills:start -->` / `<!-- jhste-skills:end -->` markers;
- guard output is review evidence, not proof by itself;
- guard runtime/config failures must be reported separately from rule violations;
- install/update/uninstall flows leave non-managed hooks, bridge text, and skill directories untouched.

## Core jhste skills

These are the jhste-authored guardrail skills. They are installed by default as part of the bundled skill set. Use `--skill-set core` to install only these core skills.

| Skill | Use it when | What it helps reduce |
|---|---|---|
| [`setup`](skills/setup/SKILL.md)<br>A safe setup skill that prevents install/connect/update flows from overwriting existing project instructions | Installing or connecting the kit to a repository | Unsafe overwrite, unmanaged hook conflict, repo instruction replacement |
| [`jhste-engineering-judgment`](skills/jhste-engineering-judgment/SKILL.md)<br>A pre-change judgment skill that verifies goal, premise, scope, seam, and failure path before code edits | Before non-trivial code changes | Blind agreement, scope creep, unverified assumptions, unclear seams |
| [`jhste-code-quality`](skills/jhste-code-quality/SKILL.md)<br>A code-quality skill for input validation, observable failure handling, and secret-safe logging | Writing or reviewing application code | Unvalidated input, silent failure, secret logging, oversized files |
| [`jhste-architecture-review`](skills/jhste-architecture-review/SKILL.md)<br>An architecture review skill for module boundaries, side-effect placement, and possible SRP violations | Changing module boundaries or app structure | Pass-through abstraction, mixed responsibility, side-effect leakage |
| [`jhste-db-api-boundary`](skills/jhste-db-api-boundary/SKILL.md)<br>A boundary skill that checks responsibility and data contracts across API routes, services, repositories, and SQL | Touching API, controller, service, repository, SQL, or persistence code | Fat routes, unsafe SQL, missing auth/data scoping, leaky DTOs |
| [`jhste-crawler-automation`](skills/jhste-crawler-automation/SKILL.md)<br>An automation skill for crawler/scraper/worker/scheduler producer-consumer seams and side effects | Touching crawlers, scrapers, workers, schedulers, or browser automation | Fragile automation, unclear producer/consumer boundaries, hidden side effects |
| [`jhste-red-team-review`](skills/jhste-red-team-review/SKILL.md)<br>A read-only red-team code review skill that aggressively re-checks changed code before completion | Before declaring non-trivial code work complete | Premature “done”, missed null/auth/env/write/API/performance risks |

## Bundled workflow skills

Normal install also includes 14 workflow skills vendored from Matt Pocock's [`mattpocock/skills`](https://github.com/mattpocock/skills). These are useful for debugging, planning, architecture, issue workflows, prototyping, and handoffs. Use `--skill-set core` if you do not want them installed.

| Skill | Use it when |
|---|---|
| [`diagnose`](skills/diagnose/SKILL.md)<br>A diagnosis-loop skill that forces reproduce, minimize, hypothesize, instrument, fix, and regression-check steps | Diagnosing a hard bug or performance regression systematically |
| [`diagnosing-bugs`](skills/diagnosing-bugs/SKILL.md)<br>A debugging skill that narrows root cause around a fast pass/fail feedback loop | You need a reproduce → minimise → hypothesise → instrument → fix loop |
| [`grill-me`](skills/grill-me/SKILL.md)<br>A skill that asks persistent questions until a plan or design has no obvious gaps | You want the agent to question your plan or design until it becomes clear |
| [`grill-with-docs`](skills/grill-with-docs/SKILL.md)<br>A design-challenge skill that documents domain terms and decisions while questioning the plan | You want project vocabulary and docs/ADRs updated during the questioning process |
| [`grilling`](skills/grilling/SKILL.md)<br>A general grilling skill for pressure-testing plans and designs before implementation | You need a general plan/design stress-test questioning loop |
| [`domain-modeling`](skills/domain-modeling/SKILL.md)<br>A skill for sharpening project terminology, domain models, and architectural decisions | Refining domain terms, ubiquitous language, or architectural decisions |
| [`codebase-design`](skills/codebase-design/SKILL.md)<br>A codebase design skill for deep modules, small interfaces, and clear seams | You need better module interface, seam, and testability vocabulary |
| [`improve-codebase-architecture`](skills/improve-codebase-architecture/SKILL.md)<br>An architecture skill that finds shallow modules and coupling that can be improved into deeper modules | You want to find deepening opportunities and reduce architectural friction |
| [`prototype`](skills/prototype/SKILL.md)<br>A prototyping skill for validating logic or UI direction with throwaway code before implementation | You want a throwaway logic/UI prototype before committing to an approach |
| [`to-prd`](skills/to-prd/SKILL.md)<br>A PRD-writing skill that structures conversation context into product requirements | You want to turn conversation context into a PRD |
| [`to-issues`](skills/to-issues/SKILL.md)<br>A skill that breaks a plan into independently workable vertical-slice issues | You want to split a plan into implementation issues that can be worked independently |
| [`triage`](skills/triage/SKILL.md)<br>An issue triage skill that classifies issues and decides next actions through a structured workflow | You want issues handled through a structured triage workflow |
| [`handoff`](skills/handoff/SKILL.md)<br>A handoff skill that compresses context so the next agent or session can continue | You want to hand context to another agent or session |
| [`write-a-skill`](skills/write-a-skill/SKILL.md)<br>A skill-writing skill for creating agent skills with the right structure and progressive disclosure | You want to create or refine an agent skill |

## Attribution: Matt Pocock skills

This repository vendors the 14 skills listed above from Matt Pocock's [`mattpocock/skills`](https://github.com/mattpocock/skills).

Those skills are vendored under the upstream MIT License. This repository preserves the required copyright/license notice and records the imported sources.

- Upstream: [`mattpocock/skills`](https://github.com/mattpocock/skills)
- License: MIT
- Attribution: [`vendor/matt-pocock/NOTICE.md`](vendor/matt-pocock/NOTICE.md)
- Upstream license copy: [`vendor/matt-pocock/LICENSE`](vendor/matt-pocock/LICENSE)
- Allowlist: [`vendor/matt-pocock/allowlist.json`](vendor/matt-pocock/allowlist.json)
- Source lock: [`vendor/matt-pocock/source-lock.json`](vendor/matt-pocock/source-lock.json)

Do not add vendored skills outside the allowlist without separate review. When updating vendored copies, refresh the source lock and review the diff.

## CLI commands

```bash
jhste-skills install
jhste-skills connect
jhste-skills guard
jhste-skills deep-scan
jhste-skills tune
jhste-skills baseline
jhste-skills sync
jhste-skills update
jhste-skills hooks
jhste-skills uninstall
```

See [`docs/CLI.md`](docs/CLI.md) for detailed command behavior.

## Recommended rollout

1. Run the default install and dogfood the advisory workflow first.
2. Keep advisory hooks at first. Use `--skip-hooks` if you do not want commit-time checks, and enable blocking mode only after reviewing noise and false positives.
3. Start with the default 300-line advisory limit. Use `--line-limit-mode blocking` only when the team is ready for warning-level hook enforcement.
4. During code changes, run `guard --scope changed --format text --fail-on error` manually.
5. Before non-trivial code changes, use `jhste-engineering-judgment` to check scope, seam, failure path, data contract, assumptions, and each changed class/module/function's main responsibility.
6. Before declaring non-trivial code work complete, use `jhste-red-team-review`. Skip docs-only, comment-only, formatting-only, and trivial rename-only changes.
7. Limit fix + re-review loops to two cycles, then report remaining risks instead of looping indefinitely.
8. Create a baseline only after reviewing existing debt. Treat the baseline as a known-issues ledger and use ratchet behavior to stop new debt, not to hide scanner failures.

## Repository layout

```text
skills/                 AI-readable skill guidance
rules/                  Stable rule metadata used by skills and scans
packs/                  Core, web, API, database, and crawler rule bundles
adapters/               Codex, Claude, and generic adapter notes
cli/                    install, uninstall, deep-scan, guard, hooks, tune, and baseline commands
vendor/matt-pocock/     Matt Pocock allowlist, source lock, license, and attribution
examples/profile.yaml   Default advisory profile example
```

## Verification

```bash
npm test
npm run public-safety:check
npm run vendor:check
npm run docs:check
```

See [`docs/ACCEPTANCE_CHECK.md`](docs/ACCEPTANCE_CHECK.md) for release acceptance notes.

## Philosophy

`jhste-skills` is not a tool for giving agents more authority. It is a tool for making fast agents more reliable.

- Do not agree blindly.
- Do not overwrite local project authority.
- Keep changes scoped.
- Name responsibility boundaries from an SRP perspective.
- Make failures observable.
- Treat automated guard output as evidence, not proof.
- Run a red-team code review before calling non-trivial work complete.

Fast agents need guardrails. `jhste-skills` gives them a repo-respecting engineering workflow.

Installed skill directories are tracked with `.jhste-skills-manifest.json`. `--force` refreshes manifest-managed skill copies; overwriting unmanaged differing skill directories still requires the separate `--allow-unmanaged-skill-overwrite` flag after review. `sync` and `update` can also adopt additional known jhste skills into an already managed skills directory so older mixed installs can be reconciled without a manual overwrite flag.
