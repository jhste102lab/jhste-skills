---
name: jhste-to-spec
description: Synthesize an already discussed or otherwise defined engineering change into a decision-grounded specification using relevant repository evidence. Use when the user asks for a spec, PRD, design brief, or written behavior contract. Do not use to interview unresolved requirements, prototype an unsettled design assumption, create execution handoffs, split work into tickets, implement code, or publish an artifact unless the user requests that write.
---

# JHSTE To Spec

## Goal

Produce a reviewable specification that explains the problem and intended behavior plainly, separates established decisions from unresolved questions, and gives the next executor observable contracts to preserve.

## Synthesize; do not restart the interview

Read the relevant conversation, referenced artifacts, repository guidance, glossary or ADRs, current code, and nearby tests or contracts. Use established domain vocabulary. Treat code as evidence of the current state rather than proof that the current state is intended.

Do not turn a specification request into a new interview. Discover repository facts directly. When an honest and useful specification can be produced, complete it and name remaining uncertainty instead of asking.

Ask only when the user explicitly requires a decision-complete contract and a missing user-owned decision makes that impossible. Route a requested decision interview to `jhste-grill`, domain-language conflicts to `jhste-domain-modeling`, and a concrete unsettled design assumption that needs executable evidence to `jhste-prototype` before freezing it into a contract.

## Write the specification

Choose sections that fit the work rather than forcing every change into user stories. Put the problem and desired result first so a non-developer can understand why the work exists.

Cover the following when material:

- problem and desired outcome;
- observable behavior and important scenarios;
- caller or user-facing contracts, failure behavior, and compatibility constraints;
- decisions already made and the reason for consequential choices;
- validation strategy and the highest useful existing seam that can demonstrate the behavior;
- scope boundaries and explicit non-goals; and
- unresolved questions, stated assumptions, and external dependencies.

Prefer behavioral language over an implementation recipe. Mention modules, interfaces, schemas, or integration points only when they preserve a real decision. Avoid speculative file paths and code snippets that are likely to become stale; include a compact prototype-derived state machine, reducer, schema, or type shape only when it records a decision more precisely than prose.

Select validation seams from inspected repository evidence without asking the user to approve routine technical choices. If the repository cannot support honest validation at an appropriate seam, record that as a constraint rather than inventing a shallow test plan.

## Draft versus write

Return a draft in the conversation by default. A request to create, record, or publish the specification authorizes only that artifact in the repository or issue tracker the user identified. Follow the repository's existing document location, issue shape, and label policy; do not invent a new convention or label.

Writing a specification does not authorize code changes or implementation tickets. When the user wants an executable issue graph after the specification is ready, use `jhste-to-tickets`. When the user wants portable or durable resume state for another executor, use `jhste-handoff`; do not turn the specification into a work tracker.

## Completion

Before finishing, verify that each asserted requirement is supported by the conversation or inspected evidence, unresolved decisions remain visible, validation describes observable behavior, and the next action is clear. Report any material repository surface that could not be inspected without blocking an otherwise useful draft.
