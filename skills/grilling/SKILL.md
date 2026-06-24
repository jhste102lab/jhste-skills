---
name: grilling
description: General plan/design stress-test interview. Use when the user asks to challenge, pressure-test, red-team, grill, or find gaps in a plan before building, without requesting documentation updates.
---

## jhste compatibility

- Repo-local instructions remain authoritative.
- Use `jhste-engineering-groundwork` for scope, boundaries, assumptions, and failure paths when it applies.
- Vocabulary in this vendored skill is advisory unless adopted by repo-local docs; do not rename established repo concepts only to match this skill.
- File, repo, command, issue, PR, or other external side effects are allowed when the user directly requested that workflow or repo-local standing approval covers it. Ask for destructive, irreversible, ambiguous, production, secret, cost-bearing, broad existing-item, or out-of-scope changes.


Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing. Asking multiple questions at once is bewildering.

If a question can be answered by exploring the codebase, explore the codebase instead.
