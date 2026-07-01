# jhste-skills

Languages: [English](README.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md)

An installable working-rules kit that helps AI coding agents consistently follow your engineering standards.

`jhste-skills` gives Codex, Claude Code, and other AI coding agents a shared engineering workflow. It helps agents verify assumptions before editing, respect repo-local instructions, keep API/database/automation boundaries clear, apply SOLID-informed coding discipline and design review, run changed-file guards, and perform a red-team code review before claiming work is complete. Guard findings are review candidates, not automatic SOLID proof, and completion reports should separate current proof, checks not run, and residual risk.

## What SOLID means here

SOLID is used here as a design review lens for concrete maintenance and failure risks, not as an automatic compliance checklist or abstraction trigger.

- **S — Single Responsibility:** each changed function, module, or class should have one main job and one main reason to change.
- **O — Open/Closed:** adding a new variant, provider, or policy should not force repeated edits to core branching when a real extension boundary would be safer.
- **L — Liskov Substitution:** implementations should not weaken caller expectations for return shape, nullability, errors, side effects, or documented behavior.
- **I — Interface Segregation:** callers should not depend on broad config, interface, or props objects when they only need a small, stable slice.
- **D — Dependency Inversion:** high-level policy should not be tightly coupled to concrete DB, API, browser, filesystem, email, payment, or queue effects unless that boundary is intentional and visible.

This tool does **not** take over your project. Repo-local `AGENTS.md`, `CLAUDE.md`, and docs remain authoritative. The default setup is advisory, marker-managed, and designed to be low-risk to try.

Skills are designed to be used automatically when the situation calls for them. For example, when an agent edits API code, it is guided to use the API/database boundary skill; before completion, it is guided to use the red-team review skill. You can also call a skill directly, for example: `use jhste-engineering-groundwork to review this change premise`, or `run jhste-red-team-review on this diff`.

## Why install this?

AI coding agents are fast, but they fail in predictable ways:

- They silently accept unclear requirements or incorrect premises.
- They expand the scope while trying to be helpful.
- They mix UI, route/controller, service, database, and side-effect responsibilities in one place, or add abstractions without a real SOLID-informed boundary.
- They apply broad cleanup or search/replace edits directly from raw search results.
- They hide failures or produce unsafe logs.
- They say “done” before the changed code has been checked.
- They forget repo-specific rules when you switch machines or repositories.

`jhste-skills` gives agents a repeatable loop for reducing those failures:

```text
Before a non-trivial code change:
  check the goal, premise, ownership boundary, data contract, failure path, final behavior predicates, and SOLID-informed review lens
  identify the failure modes that matter for the changed execution path instead of filling out a fixed checklist

While editing:
  treat repo-local instructions as the authority

After changing code:
  run a fast changed-file guard when available

Before saying “done”:
  run a read-only red-team code review and prefer actual consumer-path proof when feasible

If warnings appear:
  attempt a bounded fix, re-check, and stop instead of looping forever
```

The expected result is smaller diffs, clearer SOLID-informed boundaries, safer API/database code, fewer silent assumptions, safer cleanup/search-replace behavior, and more honest completion reports grounded in current proof of the changed public behavior.

## Who should install this?

Install `jhste-skills` if you:

- use Codex, Claude Code, or another coding agent across multiple repositories;
- want agents to verify assumptions before non-trivial code changes;
- want existing repo docs to remain the source of authority;
- want lightweight advisory checks before commit or before declaring work complete;
- care about SOLID-informed coding discipline, API/database boundaries, safe logging, input validation, cleanup safety, side effects, and automation reliability;
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

### Global setup (Codex + Claude Code + OpenCode, advisory-only)

If you want the skills available in every repository without per-repo files or git hooks, set up once at the user level:

```bash
npm install -g jhste-skills
jhste-skills global
```

This copies the skills (and shared companion resources) to `~/.jhste/skills` and writes a marker-managed bridge block into each agent's global instruction file (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, `~/.config/opencode/AGENTS.md`), creating them if needed. No git hooks and no per-repo files are written; guard stays advisory (`jhste-skills guard --scope changed`). Choose agents with `--agents codex,claude,opencode`, and remove everything with `jhste-skills global --uninstall`.

After this one-time global setup, later `npm update -g jhste-skills` runs a safe global-only refresh of the managed skill copies and existing managed global bridge blocks. Re-run `jhste-skills global` when you want to change agents or options.

The default (per-repo) install uses Normal mode.

- Installs all bundled skills: jhste core skills + vendored workflow skills.
- Creates `.jhste/profile.yaml` when missing; `--force` refreshes generated/managed profiles, while modified profiles require `--force --allow-profile-overwrite`.
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

To refresh only the installed skill files after pulling this repository, without touching a project bridge, profile, hook, or scan output:

```bash
jhste-skills update --yes --skills-only
```

To run an optional repo-wide advisory scan:

```bash
jhste-skills deep-scan
```

To remove managed outputs:

```bash
jhste-skills uninstall --yes --repo /path/to/repo
```

`uninstall` removes managed hooks, marker-managed bridge blocks, and manifest-managed skill directories. It does not touch non-managed files. `.jhste/profile.yaml` is removed only when it still matches the current or legacy generated shape; use `--force-profile` only after reviewing a modified profile.

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
- completion review should prefer actual consumer-path proof when feasible and separate current proof, skipped checks, checks not run, and residual risk;
- cleanup/search-replace work should classify editable paths separately from protected evidence/history-like paths before writing;
- guard runtime/config failures must be reported separately from rule violations;
- install/update/uninstall flows leave non-managed hooks, bridge text, and skill directories untouched.

## Core jhste skills

These are the jhste-authored guardrail skills. They are installed by default as part of the bundled skill set. Use `--skill-set core` to install only these core skills.

| Skill | Use it when | What it helps reduce |
|---|---|---|
| [`setup`](skills/setup/SKILL.md)<br>A safe setup skill that prevents install/connect/update flows from overwriting existing project instructions | Installing or connecting the kit to a repository | Unsafe overwrite, unmanaged hook conflict, repo instruction replacement |
| [`ask-jhste`](skills/ask-jhste/SKILL.md)<br>A user-invoked router for choosing the right jhste skill or workflow | You are not sure which jhste skill or workflow to use next | Wrong workflow selection, unnecessary always-on context, accidental side effects from routing |
| [`jhste-engineering-groundwork`](skills/jhste-engineering-groundwork/SKILL.md)<br>A pre-change groundwork skill that verifies goal, premise, scope, boundary, failure path, and final behavior predicates before code edits | Before non-trivial code changes | Blind agreement, scope creep, unverified assumptions, unclear boundaries |
| [`jhste-code-quality`](skills/jhste-code-quality/SKILL.md)<br>A code-quality skill for input validation, observable failure handling, secret-safe logging, and oversized-file review | Touching external input, failure handling, logging, env/config, cleanup/search-replace, or code-quality review paths | Unvalidated input, silent failure, secret logging, unsafe broad cleanup, oversized files |
| [`jhste-architecture-review`](skills/jhste-architecture-review/SKILL.md)<br>An architecture review skill for module boundaries, side-effect placement, and SOLID-informed design risks | Changing module boundaries, app structure, side-effect placement, or responsibility splits | Pass-through abstraction, mixed responsibility, side-effect leakage |
| [`jhste-db-api-boundary`](skills/jhste-db-api-boundary/SKILL.md)<br>A boundary skill that checks responsibility and data contracts across API routes, services, repositories, and SQL | Touching API, controller, service, repository, SQL, or persistence code | Fat routes, unsafe SQL, missing auth/data scoping, leaky DTOs |
| [`jhste-crawler-automation`](skills/jhste-crawler-automation/SKILL.md)<br>An automation skill for crawler/scraper/worker/scheduler producer-consumer boundaries and side effects | Touching crawlers, scrapers, workers, schedulers, or browser automation | Fragile automation, unclear producer/consumer boundaries, hidden side effects |
| [`jhste-red-team-review`](skills/jhste-red-team-review/SKILL.md)<br>A read-only red-team code review skill that aggressively re-checks changed code before completion | Before declaring non-trivial code work complete | Premature “done”, missing consumer-path proof, missed null/auth/env/write/API/performance risks |
| [`jhste-long-running-work-loop`](skills/jhste-long-running-work-loop/SKILL.md)<br>A narrow orchestration skill for preserving work state across sessions, wait states, and durable decisions | Losing state could make work wrong, duplicated, unsafe, or hard to resume: multi-session work, recurring reviews, same-day or multi-day external wait states, multiple repos, PRD→issue→implementation→review flows, or durable decisions | Lost context, stale scratchpads, unclear approval boundaries, unsafe resume points |

## Bundled workflow skills

Normal install also includes 14 workflow skills vendored from Matt Pocock's [`mattpocock/skills`](https://github.com/mattpocock/skills). These are useful for implementation, debugging, planning, architecture, issue workflows, prototyping, handoffs, and skill-writing guidance. Use `--skill-set core` if you do not want them installed.

| Skill | Use it when |
|---|---|
| [`diagnosing-bugs`](skills/diagnosing-bugs/SKILL.md)<br>A debugging skill that narrows root cause around a fast pass/fail feedback loop | You need a reproduce → minimise → hypothesise → instrument → fix loop |
| [`grill-me`](skills/grill-me/SKILL.md)<br>A direct personal grilling skill for aggressively questioning your own plan or reasoning | You ask to be grilled, challenged, pressure-tested, or questioned aggressively |
| [`grill-with-docs`](skills/grill-with-docs/SKILL.md)<br>A grilling skill that records resulting domain terms and decisions in CONTEXT.md or ADRs | You want stress-testing plus documentation, ADR, glossary, or CONTEXT updates |
| [`grilling`](skills/grilling/SKILL.md)<br>A general read-only grilling skill for pressure-testing plans and designs before implementation | You ask to challenge, pressure-test, red-team, grill, or find gaps without docs updates |
| [`domain-modeling`](skills/domain-modeling/SKILL.md)<br>A skill for sharpening project terminology, domain models, and architectural decisions | Refining domain terms, ubiquitous language, or architectural decisions |
| [`codebase-design`](skills/codebase-design/SKILL.md)<br>A codebase design skill for deep modules, small interfaces, and clear boundaries | You need better module interface, boundary, and testability vocabulary |
| [`improve-codebase-architecture`](skills/improve-codebase-architecture/SKILL.md)<br>An architecture skill that finds shallow modules and coupling that can be improved into deeper modules | You want to find deepening opportunities and reduce architectural friction |
| [`prototype`](skills/prototype/SKILL.md)<br>A prototyping skill for validating logic/state models or UI directions with throwaway local code | You ask to prototype, mock up, try designs, sanity-check behavior, or “let me play with it” |
| [`to-prd`](skills/to-prd/SKILL.md)<br>A PRD-writing skill that drafts requirements and makes them ready for the normal project workflow | You want a PRD; tracker publication happens only when directly requested or repo-approved |
| [`to-issues`](skills/to-issues/SKILL.md)<br>A skill that breaks a plan into issue-ready vertical slices | You want implementation tickets or work breakdown; tracker creation follows direct request or repo approval |
| [`triage`](skills/triage/SKILL.md)<br>An issue triage skill that classifies issues and plans next actions through a structured workflow | You want issue classification, next-action planning, or repo-approved triage writes |
| [`handoff`](skills/handoff/SKILL.md)<br>A handoff skill that compresses context so the next agent or session can continue | You ask for a handoff, session summary, continuation brief, or next-agent context |
| [`implement`](skills/implement/SKILL.md)<br>An implementation workflow skill for scoped PRD/issue/spec work using jhste groundwork, verification, guard, and review | You want an agent to implement focused work from a PRD, issue, spec, or handoff |
| [`writing-great-skills`](skills/writing-great-skills/SKILL.md)<br>A skill-writing reference for predictable invocation, progressive disclosure, context load control, and pruning | You want to create, replace, or refine an agent skill |

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
5. Before non-trivial code changes, use `jhste-engineering-groundwork` to check scope, boundary, failure path, data contract, assumptions, and the SOLID-informed review lens for changed classes/modules/functions.
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
- Use SOLID-informed coding discipline as a clean-code review lens: name responsibilities, review extension boundaries, preserve caller contracts, keep interfaces right-sized, and make concrete dependencies visible when they create maintenance or failure risk.
- Make failures observable.
- Treat automated guard output as evidence, not proof.
- Run a red-team code review before calling non-trivial work complete.

Fast agents need guardrails. `jhste-skills` gives them a repo-respecting engineering workflow.

Skills share cross-cutting doctrine (SOLID lens, evidence discipline, issue-candidate protocol, scope discipline) from `skills/_shared/`. Directories under `skills/` whose name starts with `_` are shared companion resources, not skills: they are excluded from skill listing, selection, and missing-skill checks, but are copied alongside the skills whenever any skill is installed so cross-skill `../_shared/...` references never dangle in the installed artifact.

Installed skill directories are tracked with `.jhste-skills-manifest.json`. `--force` refreshes manifest-managed skill copies and generated/managed profiles; modified profiles need `--force --allow-profile-overwrite`; overwriting unmanaged differing skill directories still requires the separate `--allow-unmanaged-skill-overwrite` flag after review. `sync` and `update` can also adopt additional known jhste skills into an already managed skills directory so older mixed installs can be reconciled without a manual overwrite flag. Legacy managed renames are also reconciled during `sync` and `update`, so older managed installs that still have `diagnose` or `jhste-engineering-judgment` are migrated to `diagnosing-bugs` or `jhste-engineering-groundwork`. Managed copies of retired `write-a-skill` are removed rather than kept as a compatibility fallback.
