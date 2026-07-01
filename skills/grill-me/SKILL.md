---
name: grill-me
description: Direct read-only pressure test of the user's own plan or reasoning.
disable-model-invocation: true
---

## jhste compatibility

- Repo-local instructions remain authoritative.
- Use `jhste-preflight` for scope, boundaries, assumptions, and failure paths when it applies.
- Vocabulary in this vendored skill is advisory unless adopted by repo-local docs; do not rename established repo concepts only to match this skill.
- This skill is read-only by default. Do not create or modify files, issues, PRs, commands, or repo state during grilling.
- If the user wants documentation updates, ADRs, glossary changes, issue creation, or other side effects, switch to the appropriate writing workflow such as `grill-with-docs`, `domain-modeling`, `to-issues`, or `triage`.

# Grill Me

Run the `grilling` workflow for a personal, read-only pressure test.
