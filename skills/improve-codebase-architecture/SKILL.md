---
name: improve-codebase-architecture
description: Find deepening opportunities in a codebase, informed by the domain language in CONTEXT.md and the decisions in docs/adr/. Use when the user wants to improve architecture, find refactoring opportunities, consolidate tightly-coupled modules, or make a codebase more testable or AI-navigable.
---

## jhste compatibility

- Repo-local instructions remain authoritative.
- Use `jhste-preflight` for scope, boundaries, assumptions, and failure paths when it applies.
- Vocabulary in this vendored skill is advisory unless adopted by repo-local docs; do not rename established repo concepts only to match this skill.
- File, repo, command, issue, PR, or other external side effects are allowed when the user directly requested that workflow or repo-local standing approval covers it. Ask for destructive, irreversible, ambiguous, production, secret, cost-bearing, broad existing-item, or out-of-scope changes.

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deeper ones. The aim is testability, locality, and AI-navigability.

Use `codebase-design` as the single source of truth for architecture vocabulary: **module**, **interface**, **implementation**, **depth**, **boundary**, **adapter**, **leverage**, and **locality**. Map those terms to repo-local vocabulary when it exists instead of renaming established concepts.

## Automation and side effects

Proceed without asking for codebase analysis, architecture smell summaries, module/boundary proposals, and tests or small local refactors inside the requested scope. Ask before large rewrites, public API breaking changes, major dependency graph changes, migrations, or expanding feature scope.

## Process

### 1. Explore

Read the project's domain glossary (`CONTEXT.md` or `CONTEXT-MAP.md`) and relevant ADRs before proposing architectural changes.

Explore organically and note where you experience friction:

- Repeated orchestration or validation spread across callers.
- Shallow pass-through modules that do not hide meaningful complexity.
- Test seams that force callers to know implementation details.
- Multiple modules changing together for one reason.
- Missing or misplaced boundaries where behavior actually varies.

### 2. Produce the review

Default to a concise Markdown architecture review. Include:

- **Candidates** — files/modules involved and the concrete friction.
- **Current interface burden** — what callers/tests must know today.
- **Deepening opportunity** — what behavior could move behind a smaller interface.
- **Why this boundary** — why the proposed boundary matches domain language and existing decisions.
- **Proof path** — how the behavior can be tested through the new or existing interface.
- **Risks / non-goals** — what not to change and where ADRs constrain the option.

End with a **Top recommendation** and the reason it should be tackled first.

Use `CONTEXT.md` vocabulary for domain concepts and `codebase-design` vocabulary for architecture concepts. If a candidate contradicts an ADR, mark it clearly and only recommend reopening it when the friction is concrete.

### 3. Optional visual report

HTML/Tailwind/Mermaid report only when requested or when visual comparison would materially improve decision quality. If using HTML, write a self-contained file outside the repo unless the user asks otherwise. Resolve the temp dir from `$TMPDIR`, falling back to `/tmp` (or `%TEMP%` on Windows), and write to `<tmpdir>/architecture-review-<timestamp>.html` so each run gets a fresh file. Open it for the user when the environment supports that, and tell them the absolute path. See [HTML-REPORT.md](HTML-REPORT.md) for the optional scaffold.

### 4. Grilling loop

Once the user picks a candidate, run `grilling` to walk the design tree with them. If the conversation changes project terminology or records a durable decision, use `domain-modeling` to update `CONTEXT.md` or ADRs inline when the user requested that docs workflow.

For deeper interface alternatives, use the `codebase-design` references rather than duplicating the design vocabulary here.
