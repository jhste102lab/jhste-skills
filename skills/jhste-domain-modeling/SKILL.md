---
name: jhste-domain-modeling
description: Clarify domain terminology, concept boundaries, and relationships while continuously maintaining a project glossary and automatically recording qualifying ADRs. Use when the user asks to define domain language, resolve conflicting terms, build a glossary, model domain concepts, or record a significant domain decision. Do not invoke for ordinary coding, generic architecture discussion, or incidental naming choices.
---

# JHSTE Domain Modeling

## Goal

Establish precise shared language that matches the intended domain and the behavior implemented by the code, and keep the repository's domain documents synchronized as decisions settle.

## Investigate

Read existing glossary, context-map, ADR, issue, and code conventions before proposing terms. Treat implementation as evidence, not unquestioned truth. Surface contradictions between the user's model, documentation, and code.

Clarify one material concept at a time. Use concrete scenarios and edge cases to test boundaries, identities, state transitions, and relationships. Prefer one canonical term per concept and distinguish concepts that only appear similar.

Keep the glossary free of implementation details. Keep specifications, task notes, and temporary decisions in their own artifacts.

## Maintain the model continuously

In a writable repository, treat the domain-modeling request as authorization to maintain local glossary and ADR files. Follow the repository's existing locations and formats. If no convention exists, create `CONTEXT.md` at the root and `docs/adr/` lazily when the first corresponding entry is needed.

When a term's meaning and boundary are agreed, test it with at least one concrete scenario. If no material contradiction remains, update the glossary immediately rather than waiting for the end of the session.

Write an ADR immediately, without requesting separate confirmation, when the user selects a decision that is all three:

- costly to reverse;
- surprising without its rationale;
- the result of a real trade-off between alternatives.

Do not create an ADR for routine, temporary, self-evident, or still-unresolved choices. Follow the repository's ADR format. If none exists, use the next available `docs/adr/NNNN-<slug>.md` filename with `Status`, `Context`, `Decision`, `Alternatives considered`, and `Consequences` sections.

If the user requests analysis only or forbids edits, present the exact proposed glossary and ADR changes instead. Do not commit, push, or publish repository changes without explicit authorization for those actions.

## Completion

Report:

- terms added, changed, rejected, or still ambiguous;
- scenarios used to test the model;
- code or document mismatches found;
- glossary and ADR files changed;
- unresolved decisions that materially block the model.
