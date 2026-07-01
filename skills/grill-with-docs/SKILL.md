---
name: grill-with-docs
description: Stress-test a plan against project domain language and record resulting decisions in CONTEXT.md or ADRs. Use when the user wants grilling plus documentation, ADR, glossary, or CONTEXT updates.
---

## jhste compatibility

- Repo-local instructions remain authoritative.
- Use `jhste-preflight` for scope, boundaries, assumptions, and failure paths when it applies.
- Vocabulary in this vendored skill is advisory unless adopted by repo-local docs; do not rename established repo concepts only to match this skill.
- File, repo, command, issue, PR, or other external side effects are allowed when the user directly requested that workflow or repo-local standing approval covers it. Ask for destructive, irreversible, ambiguous, production, secret, cost-bearing, broad existing-item, or out-of-scope changes.

# Grill With Docs

Run `grilling` and `domain-modeling` together: interrogate the plan one question at a time, and update the project glossary or ADRs as terms and durable decisions crystallize.

## Process

1. **Load domain context.** Read `CONTEXT.md` or `CONTEXT-MAP.md` when present, plus relevant ADRs. If the answer to a question is discoverable from code, inspect the code instead of asking.
2. **Grill one branch at a time.** Ask one question, include your recommended answer, and wait for the user's correction before moving on.
3. **Update docs inline when requested.** If the user asked for docs, ADR, glossary, or CONTEXT updates, treat that as approval for bounded documentation edits during the session. If the user only asked for stress-testing, stay read-only until they ask for writes.
4. **Use domain-modeling as the docs SSOT.** For glossary and ADR structure, follow `../domain-modeling/CONTEXT-FORMAT.md` and `../domain-modeling/ADR-FORMAT.md`.

## ADR threshold

Offer an ADR only when the decision is hard to reverse, surprising without context, and the result of a real trade-off. Otherwise keep the conclusion in the conversation or glossary only.
