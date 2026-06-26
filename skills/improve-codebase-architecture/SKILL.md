---
name: improve-codebase-architecture
description: Find deepening opportunities in a codebase, informed by the domain language in CONTEXT.md and the decisions in docs/adr/. Use when the user wants to improve architecture, find refactoring opportunities, consolidate tightly-coupled modules, or make a codebase more testable and AI-navigable.
---

## jhste compatibility

- Repo-local instructions remain authoritative.
- Use `jhste-engineering-groundwork` for scope, boundaries, assumptions, and failure paths when it applies.
- Vocabulary in this vendored skill is advisory unless adopted by repo-local docs; do not rename established repo concepts only to match this skill.
- File, repo, command, issue, PR, or other external side effects are allowed when the user directly requested that workflow or repo-local standing approval covers it. Ask for destructive, irreversible, ambiguous, production, secret, cost-bearing, broad existing-item, or out-of-scope changes.


# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

## Automation and side effects

Proceed without asking for codebase analysis, architecture smell summaries, module/boundary proposals, and tests or small local refactors inside the requested scope. Ask before large rewrites, public API breaking changes, major dependency graph changes, migrations, or expanding feature scope.

## Glossary

Use these terms as the internal review lens and map them to repo-local terms when local vocabulary exists. Do not rename established concepts just to match this skill; when no local term exists, avoid drifting into generic "component," "service," "API," or "boundary." Full definitions in [LANGUAGE.md](LANGUAGE.md).

- **Module** — anything with an interface and an implementation (function, class, package, slice).
- **Interface** — everything a caller must know to use the module: types, invariants, error modes, ordering, config. Not just the type signature.
- **Implementation** — the code inside.
- **Depth** — leverage at the interface: a lot of behaviour behind a small interface. **Deep** = high leverage. **Shallow** = interface nearly as complex as the implementation.
- **Boundary** — where an interface lives; a place behaviour can be altered without editing in place. (Use this, not "boundary.")
- **Adapter** — a concrete thing satisfying an interface at a boundary.
- **Leverage** — what callers get from depth.
- **Locality** — what maintainers get from depth: change, bugs, knowledge concentrated in one place.

Key principles (see [LANGUAGE.md](LANGUAGE.md) for the full list):

- **Deletion test**: imagine deleting the module. If complexity vanishes, it was a pass-through. If complexity reappears across N callers, it was earning its keep.
- **The interface is the test surface.**
- **One adapter = hypothetical boundary. Two adapters = real boundary.**

This skill is _informed_ by the project's domain model. The domain language gives names to good boundaries; ADRs record decisions the skill should not re-litigate.

## Runtime adapter note

If the current agent does not support subagents, local file opening, or OS-specific open commands, continue with inline exploration and write or report a markdown/HTML artifact path instead of failing the task.

## Process

### 1. Explore

Read the project's domain glossary and any ADRs in the area you're touching first.

Then use the Agent tool with `subagent_type=Explore` to walk the codebase. Don't follow rigid heuristics — explore organically and note where you experience friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** — interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their boundaries?
- Which parts of the codebase are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.

### 2. Present candidates

Default to a concise Markdown architecture review unless the user asks for a visual report or the candidate set is complex enough that diagrams would materially improve decision quality. Do not make an HTML file merely because this skill is running.

For the Markdown report, include for each candidate:

- **Files/modules involved** — which files, modules, or boundaries are involved
- **Problem** — why the current architecture is causing friction
- **Concrete failure or maintenance risk** — what can break, mislead, slow review, or force repeated edits
- **Proposed direction** — plain English description of what would change
- **SOLID-informed lens involved** — responsibility, extension boundary, substitutability, interface size, or dependency direction when relevant
- **Benefits** — explained in terms of locality, leverage, testability, or caller clarity
- **Recommendation strength** — one of `Strong`, `Worth exploring`, or `Speculative`

End the report with a **Top recommendation** section: which candidate you'd tackle first and why.

Use the HTML/Tailwind/Mermaid report only when requested or when visual comparison would materially improve decision quality. If using HTML, write a self-contained file outside the repo unless the user asks otherwise. Resolve the temp dir from `$TMPDIR`, falling back to `/tmp` (or `%TEMP%` on Windows), and write to `<tmpdir>/architecture-review-<timestamp>.html` so each run gets a fresh file. Open it for the user when the environment supports that, and tell them the absolute path. See [HTML-REPORT.md](HTML-REPORT.md) for the optional HTML scaffold, diagram patterns, and styling guidance.

**Use CONTEXT.md vocabulary for the domain, and [LANGUAGE.md](LANGUAGE.md) vocabulary for the architecture.** If `CONTEXT.md` defines "Order," talk about "the Order intake module" — not "the FooBarHandler," and not "the Order service."

**ADR conflicts**: if a candidate contradicts an existing ADR, only surface it when the friction is real enough to warrant revisiting the ADR. Mark it clearly (e.g. a warning callout: _"contradicts ADR-0007 — but worth reopening because…"_). Don't list every theoretical refactor an ADR forbids.

Do NOT propose interfaces yet. After the report, ask the user: "Which of these would you like to explore?"

### 3. Grilling loop

Once the user picks a candidate, drop into a grilling conversation. Walk the design tree with them — constraints, dependencies, the shape of the deepened module, what sits behind the boundary, what tests survive.

Side effects happen inline as decisions crystallize:

- **Naming a deepened module after a concept not in `CONTEXT.md`?** Propose the term and edit `CONTEXT.md` when the user requested docs updates or repo-local standing approval covers documentation/domain-decision workflow; otherwise ask before editing. Use the same discipline as `/grill-with-docs` (see [CONTEXT-FORMAT.md](../grill-with-docs/CONTEXT-FORMAT.md)).
- **Sharpening a fuzzy term during the conversation?** Update `CONTEXT.md` when docs updates are requested or covered by repo-local standing approval; otherwise ask before editing.
- **User rejects the candidate with a load-bearing reason?** Offer an ADR, framed as: _"Want me to record this as an ADR so future architecture reviews don't re-suggest it?"_ Only offer when the reason would actually be needed by a future explorer to avoid re-suggesting the same thing — skip ephemeral reasons ("not worth it right now") and self-evident ones. See [ADR-FORMAT.md](../grill-with-docs/ADR-FORMAT.md).
- **Want to explore alternative interfaces for the deepened module?** See [INTERFACE-DESIGN.md](INTERFACE-DESIGN.md).
