---
name: grill-me
description: Direct red-team interrogation of the user's own plan or reasoning. Use when the user asks to be grilled, challenged, pressure-tested, red-teamed, or questioned aggressively about their plan. Not for reviewing an already-changed code diff; use jhste-red-team-review for that.
---

## jhste compatibility

- Repo-local instructions remain authoritative.
- Use `jhste-engineering-groundwork` for scope, boundaries, assumptions, and failure paths when it applies.
- Vocabulary in this vendored skill is advisory unless adopted by repo-local docs; do not rename established repo concepts only to match this skill.
- This skill is read-only by default. Do not create or modify files, issues, PRs, commands, or repo state during grilling.
- If the user wants documentation updates, ADRs, glossary changes, issue creation, or other side effects, switch to the appropriate writing workflow such as `grill-with-docs`, `domain-modeling`, `to-issues`, or `triage`.

# Grill Me

Run the `grilling` workflow for a personal, read-only pressure test. Keep the interaction one question at a time, include your recommended answer with each question, and explore the codebase instead of asking when the answer is discoverable locally.
