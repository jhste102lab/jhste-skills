---
name: jhste-prototype
description: Build a deliberately disposable, runnable experiment to answer one concrete design question before production implementation. Use when the user explicitly asks for a prototype, or when an important uncertainty about a state model, business rule, data shape, API or module surface, interaction flow, or UI structure is best resolved through executable evidence. Do not use for ordinary implementation with a clear path, known fixes, root-cause diagnosis of existing failures, user-owned policy decisions, static mockups or image generation, open-ended ideation without a testable question, trivial reversible choices, or production-ready delivery.
---

# JHSTE Prototype

## Goal

Answer one concrete and important design question with the smallest deliberately disposable runnable evidence before production implementation.

A prototype is not a mandatory pre-step for coding and is not production code. Use `jhste-coding` when the direction is sufficiently understood, `jhste-diagnosing-bugs` when an existing observed failure needs a root cause, `jhste-grill` when a user-owned policy or trade-off is unresolved, and `jhste-to-spec` when settled behavior needs a written contract. A selected prototype direction returns to `jhste-coding` for proper implementation and validation rather than being promoted directly.

## Frame the experiment

State the exact question, why it matters, what observation would support or falsify the assumption, and what the prototype will not decide. Inspect the host repository first and reuse its language, runtime, task runner, routing, component system, data conventions, and nearby vocabulary. Do not add a new framework or general architecture merely to run the experiment.

If the question is open-ended, trivial and reversible, or still depends on a user-owned choice, do not build a prototype to manufacture certainty. Narrow the question, use `jhste-grill`, or proceed with ordinary implementation as appropriate.

## Build the smallest useful evidence

Make the prototype runnable through one obvious command or URL. Mark prototype-only files, routes, flags, variants, fixtures, and notes clearly enough that they cannot be mistaken for production behavior.

Keep state in memory and side effects stubbed, fixture-backed, or read-only by default. Use a scratch dependency only when persistence or integration is itself the question and the target is safe and authorized. Never treat a prototype request as permission for destructive or production mutation.

Expose the relevant state, outputs, transitions, or variant identity after each meaningful action so the evidence can be inspected. Skip production polish, broad error handling, compatibility layers, speculative abstraction, and generalization beyond the question. A focused executable test or fixture is allowed when it is the smallest useful harness; do not build a production regression suite to legitimize disposable code.

### Logic and contract questions

For state, business-rule, data-shape, or API-surface questions, isolate the experiment behind the smallest clear interface: a reducer, state machine, pure functions, fixture-driven module, or small stateful object according to the question. Keep the driver thin. Choose a script, focused test harness, REPL, terminal interaction, browser route, or existing development surface by fit rather than requiring a terminal UI. Show relevant before-and-after state and exercise the awkward cases that distinguish the alternatives.

### UI and interaction questions

Prefer variants inside the existing product surface with realistic data density and surrounding context when safe. Default to three materially different variants and cap at five; fewer are enough when the design space is narrower. Variants must differ in structure, information hierarchy, interaction flow, or primary affordance rather than only color, spacing, typography, or copy. Make them easy to identify and switch, stub mutations and externally visible actions, and ensure losing variants or prototype switchers cannot ship.

## Validate and record the answer

Run the documented command or open the documented URL, exercise the target cases or variants, and confirm that the evidence needed to answer the question is observable. Record the question, observations, verdict or remaining uncertainty, and the one obvious run instruction. Smoke validation proves only that the prototype runs and exposes the intended evidence; it does not make the artifact production-ready.

When a direction is accepted, hand the verdict and relevant evidence to `jhste-coding` for a clean implementation with normal contracts, error handling, tests, and integration checks. Use `jhste-to-spec` only when the user requests a durable specification. Do not send disposable prototype code to `jhste-implementation-finalizer` as though its intentional shortcuts were incomplete production work.

## Artifact and write policy

A request to build a prototype authorizes the in-scope local prototype edits, not branch creation, commit, push, issue comments, pull requests, or other external writes. Perform those actions only when the user explicitly names them. If retention outside the main branch is authorized, the runnable prototype may be preserved as primary-source evidence with a pointer from the relevant issue while the validated decision is implemented separately. Otherwise keep it isolated locally and remove prototype-only artifacts before production delivery.

## Completion

Finish when the question and observation criteria are explicit, the smallest useful experiment runs, the relevant evidence and verdict are recorded, prototype-only artifacts are separated from production, and every external or destructive action stayed within explicit authorization. Report the run command or URL, cases or variants exercised, answer or remaining uncertainty, changed files, smoke validation, and the next owning skill.
