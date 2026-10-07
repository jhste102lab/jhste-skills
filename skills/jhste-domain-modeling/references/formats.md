# Fallback Domain Document Formats

Use these formats only when the repository has no established glossary, legacy context-document, or ADR convention.

## Domain glossary

Create a root `GLOSSARY.md` lazily for a single-context repository. When several bounded contexts exist, use a root `GLOSSARY-MAP.md` that points to each owning `GLOSSARY.md`.

If the repository already uses legacy `CONTEXT.md` or `CONTEXT-MAP.md`, preserve that established convention instead of creating parallel `GLOSSARY*` files.

```markdown
# Context Name

One or two sentences describing the context.

## Language

**Canonical term**:
One or two sentences defining what the concept is.
_Avoid_: misleading synonym, overloaded synonym
```

Definitions should describe what a concept is, not implementation details or all behavior it performs. Include only vocabulary specific to the domain.

## ADR

Create `docs/adr/` lazily and use the next available `NNNN-<slug>.md` filename.

```markdown
# Decision title

## Context
Why the decision was necessary.

## Decision
What was selected and the essential reason.
```

Add `Consequences` only for non-obvious downstream effects. Add `Alternatives` only when preserving rejected options prevents the same debate from recurring. Add status metadata only when the repository needs proposal, deprecation, or supersession tracking.
