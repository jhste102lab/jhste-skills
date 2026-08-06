---
name: jhste-handoff
description: Create the smallest executor-neutral handoff that preserves verified state, decisions, authoritative references, ownership, risks, and one exact next action. Use when work must move to another session, agent, harness, directory, repository, or collaborator, or when shared implementation state must remain durably resumable. Do not use merely to read an existing handoff or continue implementation.
---

# JHSTE Handoff

## Goal

Create an accurate transfer artifact that lets the intended next executor continue without rediscovering material decisions, trusting stale evidence, or inventing product behavior.

## Choose the form by how the state will be used

Use a **portable handoff** for a one-time transfer to another session, agent, harness, directory, repository, collaborator, or side task. Prefer one Markdown artifact outside the repository unless the user names a repository path. Read [references/portable.md](references/portable.md) for the compact form.

Use a **durable handoff** only when several sessions or workers need one shared, evolving execution record, the repository already has a handoff convention, or the user explicitly requests a project-maintained handoff. Read [references/durable.md](references/durable.md) for state and update guidance.

Do not split a handoff because the work is large or may exceed a context window. Split only when outcomes have distinct ownership, real dependencies, independent verification value, or separate integration boundaries.

## Keep authority and sources clear

A handoff request authorizes the corresponding local artifact or named repository document. It does not authorize commit, push, issue, pull-request, merge, or other external writes unless the request includes them.

Keep the handoff independent of model, provider, CLI, or proprietary status protocol. Record a harness, worker, workspace, branch, or commit only as a current execution fact needed for resumption.

Reference specifications, ADRs, glossaries, issues, commits, diffs, and other authoritative artifacts instead of copying them. A handoff records transfer and execution state; it does not replace those sources.

## Inspect only what keeps the transfer honest

Start from the current conversation and already referenced artifacts. Inspect source state whose staleness could mislead the next executor, such as the task-owned diff, named verification, active ownership, unresolved blockers, live activity, and exact resume location.

Do not re-read the whole repository or ask the user to repeat discoverable information. Do not invent paths, commands, decisions, verification, or architecture. Leave reversible implementation choices to the next executor.

## Completion

Finish when the next executor has one clear objective, authoritative references, an honest verified state, relevant ownership and risks, and one exact first action. For durable work, ensure integration responsibility and evidence freshness remain clear without unnecessary document hierarchy.

Report where the handoff was written, whether it is portable or durable, and the exact next action it preserves.
