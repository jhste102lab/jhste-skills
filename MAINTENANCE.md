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

The routing fixtures in this repository are static contracts. They verify structure and expected boundaries; they do not invoke a model or prove live trigger accuracy.

For a material skill change, use a small set of real sentinel tasks that cover the changed behavior. Compare:

- whether the result is correct;
- whether the user was interrupted unnecessarily;
- whether extra tools, workers, or validation were used without benefit; and
- whether authority or scope was exceeded.

Use token, time, and request data when the harness exposes it. Replace a sentinel when current models pass it routinely and it no longer distinguishes useful behavior.

## Change discipline

Prefer one behavioral hypothesis per change. Apply a no-op test to every new instruction: if removing it would not change behavior on a representative sentinel with current models, leave it out.

Update the skill, README files, metadata, validation, changelog, package version, and attribution together when they are affected.

Run `npm test` and `npm pack --dry-run` before release. The main-branch GitHub Actions workflow is the publication gate and verifies the exact npm registry version.

This policy was informed by public guidance from Boris Cherny on deleting legacy harness instructions, testing current model behavior, and restoring only evidence-backed constraints: https://www.youtube.com/watch?v=UkoosAsEA8w
