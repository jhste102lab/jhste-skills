---
name: jhste-prototype
description: Build a deliberately disposable, runnable experiment to answer one concrete design question before production implementation. Use when the user explicitly asks for a prototype, or when an important uncertainty about a state model, business rule, data shape, API or module surface, interaction flow, or UI structure is best resolved through executable evidence. Do not use for ordinary implementation with a clear path, known fixes, root-cause diagnosis of existing failures, user-owned policy decisions, static mockups or image generation, open-ended ideation without a testable question, trivial reversible choices, or production-ready delivery.
---

# JHSTE Prototype

## Goal

Answer one concrete and important design question with the smallest deliberately disposable runnable evidence before production implementation.

A prototype is not a mandatory pre-step for coding and is not production code. Use `jhste-coding` when the direction is sufficiently understood, `jhste-diagnosing-bugs` when an existing observed failure needs a root cause, `jhste-grill` when a user-owned policy or trade-off is unresolved, and `jhste-to-spec` when settled behavior needs a written contract. A selected direction returns to `jhste-coding` for a clean production implementation rather than promoting prototype code directly.

## Frame the experiment

State the exact question, why it matters, what observation would support or falsify the assumption, and what the prototype will not decide. Inspect the host repository first and reuse its language, runtime, task runner, routing, component system, data conventions, and domain vocabulary. Do not add a framework or general architecture merely to run the experiment.

If the question is open-ended, trivial and reversible, or still depends on a user-owned choice, do not build a prototype to manufacture certainty. Narrow the question, use `jhste-grill`, or proceed with ordinary implementation as appropriate.

## Choose evidence for its judge

Choose the execution surface by who must judge the result and by the cheapest artifact that exposes the answer clearly.

- When developers alone can judge the result, prefer the smallest host-native script, focused test harness, REPL interaction, fixture-driven module, terminal surface, browser route, or existing development surface.
- When a non-developer must inspect a logic, state, business-rule, or data-shape question, prefer one self-contained HTML file that opens directly, uses domain language, shows readable state after every action, and offers both free-play actions and guided walkthroughs for the cases that distinguish the decision.
- Do not force HTML when a smaller host-native surface answers the question better.

Make the prototype runnable through one obvious command, URL, or direct file open. Mark prototype-only files, routes, flags, variants, fixtures, and notes clearly enough that they cannot be mistaken for production behavior.

Keep state in memory and side effects stubbed, fixture-backed, or read-only by default. Use a scratch dependency only when persistence or integration is itself the question and the target is safe and authorized. Never treat a prototype request as permission for destructive or production mutation.

Expose the relevant state, outputs, transitions, or variant identity after each meaningful action. Skip production polish, broad error handling, compatibility layers, speculative abstraction, and generalization beyond the question. A focused executable test or fixture is allowed when it is the smallest useful experiment; do not build a production regression suite to legitimize disposable code.

## Logic and contract questions

Isolate the experiment behind the smallest clear interface: a reducer, state machine, pure functions, fixture-driven module, or small stateful object according to the question. Keep the driver thin and use awkward cases that distinguish the alternatives, including an invalid or surprising transition when relevant.

For a non-developer-facing HTML experiment, render labelled domain state rather than a raw implementation dump. Make every action available for free exploration and include short guided scenarios that reset to a known state and walk through the important edge cases.

## UI and interaction questions

Prefer variants inside an existing product surface with realistic data density, header, navigation, permissions, and surrounding context. Create a new prototype-only route only when no existing surface can host the question without distortion.

Default to three materially different variants and cap at five; fewer are enough when the design space is narrower. Variants must differ in structure, information hierarchy, interaction flow, or primary affordance rather than only color, spacing, typography, or copy. Avoid sharing so much layout code that the variants cannot disagree meaningfully. Make them easy to identify and switch, stub mutations and externally visible actions, and ensure losing variants or prototype switchers cannot ship.

## Validate and record the answer

Run the documented command, open the file, or visit the documented URL. Exercise the target cases or variants and confirm that the evidence needed to answer the question is observable. Record the question, observations, verdict or remaining uncertainty, and the one obvious run instruction.

Smoke validation proves only that the experiment runs and exposes the intended evidence; it does not make the artifact production-ready. When a direction is accepted, give the verdict and decision-rich evidence to `jhste-coding`, which must implement the behavior with normal contracts, error handling, tests, and integration checks. Use `jhste-to-spec` only when the user requests a durable specification.

## Artifact and write policy

A request to build a prototype authorizes the in-scope local prototype edits, not branch creation, commit, push, issue comments, pull requests, or other external writes. Perform those actions only when the user explicitly names them.

If retention outside the main branch is authorized and the prototype has continuing evidence value, preserve it with a pointer from the relevant durable artifact. Otherwise keep it isolated locally and remove prototype-only artifacts before production delivery. Preserve the question, observations, and verdict even when the runnable shell is discarded.

## Completion

Finish when the question and observation criteria are explicit, the smallest useful experiment runs, the intended judge can inspect the relevant evidence, the verdict or remaining uncertainty is recorded, prototype-only artifacts are separated from production, and every external or destructive action stayed within explicit authorization.

Report the run command, URL, or file; cases or variants exercised; answer or remaining uncertainty; changed files; smoke validation; and the next owning skill.
