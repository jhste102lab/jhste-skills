---
name: jhste-domain-modeling
description: Clarify or change project-specific domain terms, identities, boundaries, and relationships while maintaining the owning glossary and qualifying ADRs. Use for conflicting or overloaded language, domain concepts, writing or editing the owning glossary or CONTEXT.md, or recording or editing an ADR about a significant domain decision. Merely following an existing glossary is ordinary work, not domain modeling.
---

# JHSTE Domain Modeling

## Goal

Establish precise shared language that matches the intended domain and relevant behavior, then keep the owning domain documents synchronized as decisions settle.

## Investigate before asking

Read the existing glossary, context map, ADRs, issues, repository conventions, and relevant code. Treat implementation as evidence, not unquestioned truth. Surface contradictions between the user's model, documentation, and code.

Ask only where intended meaning, identity, boundary, or policy belongs to the user. Repository and environment facts are the agent's responsibility.

## Resolve concepts in dependency-aware rounds

Map dependencies between disputed concepts. In each round, present every material concept whose prerequisites are settled and defer only questions that depend on unresolved terms.

Use concrete scenarios and edge cases to test identity, boundaries, state transitions, and relationships. Prefer one canonical term per concept. Record a concise definition of what the concept is and add misleading synonyms under `_Avoid_` when they are likely to recur.

Keep general programming vocabulary, implementation details, specifications, task notes, and temporary decisions out of the domain glossary.

## Maintain the owning context

A domain-modeling request in a writable repository authorizes local glossary and qualifying ADR updates. Follow the repository's established locations and formats.

When `CONTEXT-MAP.md` exists, update the bounded context that owns the concept. Record a system-wide ADR only for a decision that crosses context boundaries; otherwise keep it with the owning context when that convention exists.

If no convention exists, read [references/formats.md](references/formats.md) and create fallback files lazily when the first term or qualifying decision settles.

Update a settled term during the same round once a concrete scenario reveals no material contradiction.

## Record qualifying decisions

Write an ADR without separate confirmation when a selected decision is all three:

- costly to reverse;
- surprising without its rationale; and
- the result of a real trade-off.

Do not create ADRs for routine, temporary, self-evident, or unresolved choices. If the user requests analysis only or forbids edits, present the exact proposed changes instead. Commit, push, and publication still require their own authorization.

## Completion

Report the terms changed or still ambiguous, scenarios used, code or document mismatches, bounded contexts affected, glossary and ADR files changed, and unresolved user-owned decisions that block the model.
