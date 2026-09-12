# Skill Maintenance Policy

This repository treats every instruction as a recurring cost. Add or retain text only when it protects a real contract or fixes an observed failure.

## Delete before adding

When a major model or harness generation changes:

1. Identify instructions, hooks, examples, or workflow steps that may have become redundant.
2. Remove or isolate one candidate at a time.
3. Use the skill on representative real work.
4. Restore the smallest necessary instruction only when the same material failure repeats.

Do not preserve a rule merely because an older model needed it.

## What belongs in a shared skill

Keep instructions that define one or more of:

- safety, authority, privacy, destructive-action, or external-write boundaries;
- project- or workflow-specific knowledge a model cannot infer reliably;
- ownership and coordination contracts;
- an output interface, evidence requirement, or completion condition; or
- a repeated failure observed with current models and harnesses.

## What does not belong

Do not add or retain:

- model, provider, price, reasoning, effort, concurrency, or scheduling choices owned by the harness;
- fixed step sequences when only the outcome, guardrails, and done signal matter;
- generic reminders to think, re-read, or verify;
- examples that merely restate instructions;
- duplicated routing guidance in descriptions, bodies, README files, and references;
- repository facts that are cheap to rediscover from package scripts, configuration, layout, or tool help; treat documentation that restates them as a cache that must earn its maintenance cost;
- work splitting based only on file count, task length, or context-window size; or
- speculative rules for failures that have not been observed.

## Progressive disclosure

Treat `SKILL.md` as the control plane. It should contain the task contract, important boundaries, and pointers needed to begin.

Move rare branches, detailed templates, recovery protocols, and specialized variants into one-hop files under `references/`. State exactly when each reference should be read. Do not move text into a reference merely to avoid deleting it.

## Evaluation

The routing fixtures in this repository are static contracts. They verify structure and expected boundaries; they do not invoke a model or prove live trigger accuracy. An `expected_skill` of `null` means no skill in this package is selected, not that the request must be refused.

For a material skill change, use a small set of real sentinel tasks that cover the changed behavior. Compare:

- whether the result is correct;
- whether the user was interrupted unnecessarily;
- whether extra tools, workers, or validation were used without benefit; and
- whether authority or scope was exceeded.

Use token, time, and request data when the harness exposes it. Replace a sentinel when current models pass it routinely and it no longer distinguishes useful behavior.

### Code-result routing sentinels

Use the request text in the repository's `scripts/routing-scenarios.json` and `scripts/routing-scenarios-orchestration.json`, rather than putting skill names into user requests. Start with these cases:

| Intent | Fixture IDs |
| --- | --- |
| Natural completion-claim recheck | `double-check-trigger-korean-done`, with `double-check-trigger-korean-gaps` and `double-check-trigger-korean-requirements` as paraphrases |
| Ordinary implementation without an automatic second pass | `coding-trigger-korean-feature`, `double-check-non-handoff-resume` |
| Existing uncertain failure versus pre-implementation experiment | `double-check-non-uncertain-resume`, `double-check-non-design-experiment` |
| Read-only result verification and review-only work | `double-check-trigger-read-only`, `coding-non-review` |
| Known review correction versus whole-result rechecking | `double-check-handoff-feedback` |
| Worker-result authorship versus explicit delegation | `orchestration-non-double-check`, `orchestration-trigger-separate-acceptance` |

Run against a clean installed skill set with retired directories absent. Use a small code task with a known missing integration, an already-correct variant, stale pre-correction evidence, and unrelated owned changes. Inspect actual skill/tool calls as well as the final code: a correct first choice alone cannot prove that no unnecessary follow-on skill or worker ran. Check that corrections invalidate and refresh the relevant evidence, read-only assignments stay read-only, and unavailable checks are not reported as passed.

Record the model and harness version, source state, installed skill set, observed choices, outcome, and limits outside model-facing instructions. Mark live evaluation as not run when no suitable harness is available; neither `npm test` nor the release workflow supplies live-model evidence.

## Change discipline

Prefer one behavioral hypothesis per change. Apply a no-op test to every new instruction: if removing it would not change behavior on a representative sentinel with current models, leave it out.

Update the skill, README files, metadata, validation, changelog, package version, and attribution together when they are affected.

Run `npm test` and `npm pack --dry-run` before release. Pull requests run read-only validation. The publication workflow verifies the exact npm registry version and tarball integrity before creating GitHub release notes from the matching changelog section. Publishing and updating installed user files require authority for those targets; a version bump merged to `main` can publish externally.

This policy was informed by public guidance from Boris Cherny on deleting legacy harness instructions, testing current model behavior, and restoring only evidence-backed constraints: https://www.youtube.com/watch?v=UkoosAsEA8w
