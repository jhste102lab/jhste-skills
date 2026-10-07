---
name: jhste-domain-modeling
description: Clarify or change project-specific domain terms, identities, boundaries, and relationships. Use for conflicting or overloaded language, domain concepts, or requests to write or edit the owning GLOSSARY.md or GLOSSARY-MAP.md, including repositories that still use legacy CONTEXT.md or CONTEXT-MAP.md, and for recording or editing an ADR about a significant domain decision. By default, analysis-only domain-modeling requests are read-only with respect to repository files. Merely following an existing glossary is ordinary work, not domain modeling.
---

# JHSTE Domain Modeling

## Goal

Establish precise shared language that matches the intended domain and relevant behavior, then keep owning domain documents synchronized when the request authorizes those updates.

## Investigate before asking

Read the existing glossary or legacy context document, glossary or context map, ADRs, issues, repository conventions, and relevant code. Treat implementation as evidence, not unquestioned truth. Surface contradictions between the user's model, documentation, and code.

Ask only where intended meaning, identity, boundary, or policy belongs to the user. Repository and environment facts are the agent's responsibility.

## Resolve concepts in dependency-aware rounds

Map dependencies between disputed concepts. In each round, present every material concept whose prerequisites are settled and defer only questions that depend on unresolved terms.

Use concrete scenarios and edge cases to test identity, boundaries, state transitions, and relationships. Prefer one canonical term per concept. Record a concise definition of what the concept is and add misleading synonyms under `_Avoid_` when they are likely to recur.

Keep general programming vocabulary, implementation details, specifications, task notes, and temporary decisions out of the domain glossary.

## Maintain owning domain documents only when requested

Follow the repository's established domain-document convention. Prefer `GLOSSARY.md` and `GLOSSARY-MAP.md` when creating a new convention. If the repository already uses legacy `CONTEXT.md` or `CONTEXT-MAP.md`, preserve that convention rather than creating parallel glossary files.

Do not treat a request to analyze, clarify, discuss, or model the domain as permission to modify repository files. Edit local glossary, map, or ADR files only when the request also asks to create, record, write, update, edit, or maintain those artifacts.

When documentation updates are authorized and no convention exists, read [references/formats.md](references/formats.md) and create fallback files lazily when the first term or qualifying decision settles.

When documentation updates are not authorized, present the exact proposed glossary and ADR changes without editing files.

## Record qualifying decisions

When local decision-document updates are authorized, write an ADR without separate confirmation when a selected decision is all three:

- costly to reverse;
- surprising without its rationale; and
- the result of a real trade-off.

Do not create ADRs for routine, temporary, self-evident, or unresolved choices. Commit, push, and publication still require their own authorization.

## Completion

Report the terms changed or still ambiguous, scenarios used, code or document mismatches, bounded contexts affected, glossary and ADR files changed or proposed, and unresolved user-owned decisions that block the model.
