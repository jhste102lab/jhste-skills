---
name: jhste-domain-modeling
description: Clarify domain terminology, concept boundaries, and relationships, and optionally maintain a project glossary or ADRs. Use when the user asks to define domain language, resolve conflicting terms, build a glossary, model domain concepts, or record a significant domain decision. Do not invoke for ordinary coding, generic architecture discussion, or incidental naming choices.
---

# JHSTE Domain Modeling

## Goal

Establish precise shared language that matches the intended domain and the behavior implemented by the code.

## Investigate

Read existing glossary, context-map, ADR, issue, and code conventions before proposing terms. Treat implementation as evidence, not unquestioned truth. Surface contradictions between the user's model, documentation, and code.

Clarify one material concept at a time. Use concrete scenarios and edge cases to test boundaries, identities, state transitions, and relationships. Prefer one canonical term per concept and distinguish concepts that only appear similar.

Keep the glossary free of implementation details. Keep specifications, task notes, and temporary decisions in their own artifacts.

## Analyze versus write

Analyze and propose changes by default. Edit `CONTEXT.md`, a repository-equivalent glossary, or an ADR only when the user asks to record, update, or apply the decisions. Follow the repository's existing location and format; create a new convention only with user authorization.

Offer an ADR only when the decision is all three:

- costly to reverse;
- surprising without its rationale;
- the result of a real trade-off between alternatives.

Do not create an ADR for routine, temporary, or self-evident choices.

## Completion

Report:

- terms added, changed, rejected, or still ambiguous;
- scenarios used to test the model;
- code or document mismatches found;
- files changed, if writing was authorized;
- ADR candidates and unresolved decisions that materially block the model.
