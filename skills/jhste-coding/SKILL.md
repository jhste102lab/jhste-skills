---
name: jhste-coding
description: Apply lightweight SOLID-first coding discipline while actively writing or editing repository code.
---

# jhste-coding

Use this skill to write small, direct, readable code guided primarily by SOLID.

SOLID is the main discipline. The guardrails below keep the code practical.

## Core rule

Prefer the smallest clear change that fits the requested problem and keeps the code SOLID-aligned.

Use SOLID for the current change; speculative architecture, broad refactors, and abstraction layers are outside this skill's purpose.

## SOLID discipline

- **S — Single Responsibility:** keep each changed function, module, or class centered on one clear job. Choose names that make the job easy to see.
- **O — Open/Closed:** add an extension seam when real variation or repeated branching would otherwise keep changing the same core logic. Keep simple branches when they read better.
- **L — Liskov Substitution:** preserve caller-facing expectations: return shape, nullability, errors, side effects, timing assumptions, and documented behavior.
- **I — Interface Segregation:** depend on the smallest useful contract. Prefer narrow parameters over broad objects, global context, or large config bags when only a small slice is needed.
- **D — Dependency Inversion:** keep business rules separate from concrete side effects when that separation makes the code clearer. Make database, network, filesystem, browser, queue, email, payment, clock, environment, and secret boundaries easy to see.

## Practical guardrails

- Interfaces, factories, base classes, dependency containers, and strategy layers fit best when they clarify a real boundary, remove real repeated change, or protect a caller contract.
- Validate external input where it enters the code path.
- Make uncertain, partial, and failed states visible rather than silently treating them as success.
- Keep secrets, tokens, credentials, cookies, authorization headers, sessions, and raw sensitive payloads out of logs and responses.
- When adding or changing tests, focus on observable behavior related to the change.

## Final response

Briefly say what changed.
