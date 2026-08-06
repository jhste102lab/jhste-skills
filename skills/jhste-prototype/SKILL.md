---
name: jhste-prototype
description: Build the smallest disposable runnable experiment that answers one concrete design question before production implementation. Use for uncertain state models, business rules, data shapes, API surfaces, interaction flows, or UI structures that need executable evidence. Do not use for ordinary implementation, known fixes, root-cause diagnosis, user-owned policy decisions, static mockups, or production-ready delivery.
---

# JHSTE Prototype

## Goal

Answer one important design question with the cheapest runnable evidence that lets the intended judge make a decision.

A prototype is not a mandatory pre-step and is not production code. Once the question is answered, preserve the decision and reimplement the chosen behavior cleanly with `jhste-coding` rather than promoting prototype shortcuts.

## Frame the experiment

State the question, why it matters, what observation would support or falsify the assumption, and what the prototype will not decide. Reuse the host repository's language, runtime, task runner, routing, component system, data conventions, and domain vocabulary. Do not add a framework or general architecture merely to run the experiment.

Do not use a prototype to manufacture certainty around an open-ended, trivial, reversible, or user-owned choice.

## Choose the evidence surface

Use the smallest surface that exposes the answer clearly:

- For developer-only logic or contract questions, prefer a host-native script, focused test harness, REPL interaction, fixture-driven module, terminal surface, browser route, or existing development surface.
- When a non-developer must judge logic, state, business rules, or data shape, use the guidance in [references/logic.md](references/logic.md).
- For UI or interaction alternatives, use [references/ui.md](references/ui.md).

Make the experiment runnable through one obvious command, URL, or direct file open. Mark prototype-only artifacts so they cannot be mistaken for production behavior.

Keep state in memory and side effects stubbed, fixture-backed, or read-only by default. Use a scratch dependency only when persistence or integration is itself the question and the target is safe and authorized. A prototype request never authorizes destructive or production mutation.

Skip production polish, broad error handling, compatibility layers, speculative abstraction, and generalization beyond the question. A focused executable test is allowed when it is the smallest useful experiment; do not build a production regression suite around disposable code.

## Validate and record the answer

Run the documented entry point and exercise the cases or alternatives that distinguish the decision. Record the question, observations, verdict or remaining uncertainty, and the one obvious run instruction.

Smoke validation proves only that the experiment runs and exposes the intended evidence. It does not make the artifact production-ready.

A prototype request authorizes the in-scope local experiment, not branch creation, commit, push, issue comments, pull requests, or other external writes. Preserve runnable evidence outside the main line only when authorized and still useful; always preserve the question and verdict in the appropriate durable artifact.

## Completion

Finish when the experiment runs, the intended judge can inspect the relevant evidence, the answer or remaining uncertainty is recorded, prototype-only artifacts are separated from production, and all external or destructive actions remain within authorization.

Report the entry point, cases or alternatives exercised, verdict, changed files, smoke validation, and next owning work.
