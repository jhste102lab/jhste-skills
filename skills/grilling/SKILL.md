---
name: grilling
description: General plan/design stress-test interview. Use when the user asks to challenge, pressure-test, red-team, grill, or find gaps in a plan before building, without requesting documentation updates.
---

## jhste compatibility

- Repo-local instructions remain authoritative.
- Use `jhste-engineering-groundwork` for scope, boundaries, assumptions, and failure paths when it applies.
- Vocabulary in this vendored skill is advisory unless adopted by repo-local docs; do not rename established repo concepts only to match this skill.
- This skill is read-only by default. Do not create or modify files, issues, PRs, commands, or repo state during grilling.
- If the user wants documentation updates, ADRs, glossary changes, issue creation, or other side effects, switch to the appropriate writing workflow such as `grill-with-docs`, `domain-modeling`, `to-issues`, or `triage`.


Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing. Asking multiple questions at once is bewildering.

If a question can be answered by exploring the codebase, explore the codebase instead.
