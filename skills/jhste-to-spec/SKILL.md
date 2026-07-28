---
name: jhste-to-spec
description: Synthesize an already discussed or otherwise defined engineering change into a decision-grounded specification using relevant repository evidence. Use when the user asks for a spec, PRD, design brief, or written behavior contract. Do not use to interview unresolved requirements, prototype an unsettled design assumption, create execution handoffs, split work into tickets, implement code, or publish an artifact unless the user requests that write.
---

# JHSTE To Spec

## Goal

Produce a reviewable specification that separates established decisions from unresolved questions and gives the next worker observable behavior to preserve.

## Resolve the evidence

Read the relevant conversation, referenced artifacts, repository guidance, glossary or ADRs, current code, and nearby tests or contracts. Use repository vocabulary where it is established. Treat code as evidence of the current state rather than proof that the current state is intended.

Ask only when a missing decision would materially change the requested outcome. When useful progress is still possible, draft with the uncertainty named instead of inventing an answer. Route a decision interview to `jhste-grill`, domain-language conflicts to `jhste-domain-modeling`, and a concrete unsettled design assumption that needs executable evidence to `jhste-prototype` before freezing it into a contract.

## Write the specification

Choose sections that fit the work rather than forcing every change into user stories. Cover the following information when it is material:

- problem and desired outcome;
- observable behavior, caller contracts, failure behavior, and compatibility constraints;
- decisions already made and the reason for consequential choices;
- validation strategy and the existing highest useful seam that can demonstrate the behavior;
- scope boundaries and explicit non-goals;
- unresolved questions, assumptions, and external dependencies.

Prefer behavioral language over an implementation recipe. Mention modules, interfaces, schemas, or integration points when they record a real decision. Avoid speculative file paths and code snippets that are likely to become stale; include a compact prototype-derived shape only when it preserves a decision more precisely than prose.

## Draft versus write

Return a draft in the conversation by default. A request to create, record, or publish the specification authorizes only that artifact in the repository or issue tracker the user identified. Follow the repository's existing document location, issue shape, and label policy; do not invent a new convention or label.

Writing a specification does not authorize code changes or implementation tickets. When the user wants an executable issue graph after the specification is ready, use `jhste-to-tickets`. When the user wants durable progress, ownership, verification, and resume state for another executor, use `jhste-handoff`; do not turn the specification into a work tracker.

## Completion

Before finishing, check that each asserted requirement is supported by the conversation or inspected evidence, unresolved decisions remain visibly unresolved, validation describes observable behavior, and the next step is clear. Report any material repository surface that could not be inspected.
