---
name: jhste-domain-modeling
description: Clarify or change project-specific domain terminology, concept boundaries, identities, and relationships while continuously maintaining the owning glossary and automatically recording qualifying ADRs. Use when the user asks to define domain language, resolve conflicting or overloaded terms, build a glossary, model domain concepts, or record a significant domain decision. Merely reading or following an existing glossary does not select this skill. Do not invoke for ordinary coding, generic architecture discussion, general programming terms, or incidental naming choices.
---

# JHSTE Domain Modeling

## Goal

Establish precise shared language that matches the intended domain and the behavior implemented by the code, then keep the repository's owning domain documents synchronized as decisions settle.

## Investigate before asking

Read the existing glossary, context map, ADRs, issues, repository conventions, and relevant code before proposing terms. Treat implementation as evidence, not unquestioned truth. Surface contradictions between the user's model, documentation, and code.

Do not ask the user for facts that the repository or environment can answer. Ask only where the intended domain meaning, identity, boundary, or policy belongs to the user.

Merely consuming established vocabulary is ordinary work for any skill. Use this skill when the domain model itself must be challenged, clarified, extended, or changed.

## Resolve concepts in dependency-aware rounds

Map dependencies between disputed concepts. In each round, present every material concept whose prerequisites are already settled; keep dependent questions for a later round. This reduces user round trips without forcing answers that depend on unresolved terms.

Use concrete scenarios and edge cases to test boundaries, identities, state transitions, and relationships. Prefer one canonical term per concept and distinguish concepts that only appear similar. Challenge vague or overloaded language directly.

When proposing a term, capture:

- the canonical term;
- a one- or two-sentence definition of what it is;
- concrete examples or boundary cases when needed; and
- misleading synonyms under `_Avoid_` when they are likely to recur.

Keep general programming concepts out of the glossary even when the project uses them often. Keep implementation details, specifications, task notes, and temporary decisions in their own artifacts.

## Maintain the owning context

In a writable repository, treat the domain-modeling request as authorization to maintain local glossary and ADR files. Follow the repository's existing locations and formats.

- When a root `CONTEXT-MAP.md` exists, update the bounded context that owns the concept rather than a global glossary.
- Record a system-wide ADR only when a decision crosses context boundaries; otherwise keep it with the owning context when that convention exists.
- When no convention exists, create a root `CONTEXT.md` lazily when the first term settles and create `docs/adr/` lazily when the first qualifying ADR is needed.

For a new fallback glossary, use this compact shape:

```markdown
# Context Name

One or two sentences describing the context.

## Language

**Canonical term**:
One or two sentences defining what the concept is.
_Avoid_: misleading synonym, overloaded synonym
```

When a term's meaning and boundary are agreed, test it with at least one concrete scenario. If no material contradiction remains, update the owning glossary immediately during the same round.

## Record qualifying decisions

Write an ADR immediately, without requesting separate confirmation, when the user selects a decision that is all three:

- costly to reverse;
- surprising without its rationale; and
- the result of a real trade-off between alternatives.

Do not create an ADR for routine, temporary, self-evident, or unresolved choices. Follow the repository's ADR format. If none exists, use the next available `docs/adr/NNNN-<slug>.md` filename with concise `Context` and `Decision` sections. Add `Consequences` only for non-obvious downstream effects and `Alternatives` only when preserving rejected options prevents future repetition.

If the user requests analysis only or forbids edits, present the exact proposed glossary and ADR changes instead. Do not commit, push, or publish repository changes without explicit authorization for those actions.

## Completion

Report:

- terms added, changed, rejected, or still ambiguous;
- scenarios used to test the model;
- code or document mismatches found;
- bounded contexts affected;
- glossary and ADR files changed; and
- unresolved user-owned decisions that materially block the model.
