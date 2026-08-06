---
name: jhste-to-spec
description: Synthesize an already discussed or otherwise defined engineering change into a reviewable behavioral specification grounded in repository evidence. Use for a spec, PRD, design brief, or written contract. Do not restart unresolved requirements interviews, prototype an unsettled design, create tickets or handoffs, implement code, or publish unless requested.
---

# JHSTE To Spec

## Goal

Explain the problem and intended behavior plainly, separate settled decisions from uncertainty, and give the next executor observable contracts to preserve.

## Synthesize rather than re-interview

Read the relevant conversation, authoritative artifacts, repository guidance, domain language, current code, and nearby contracts or tests. Treat code as evidence of current behavior rather than proof of intended behavior.

Discover repository facts directly. Complete an honest useful draft with visible uncertainty instead of asking routine questions. Ask only when the user explicitly requires a decision-complete contract and a missing user-owned decision makes that impossible.

## Write only the sections the change needs

Put the problem and desired result first. Cover material items such as:

- observable behavior and important scenarios;
- user- or caller-facing contracts, failures, and compatibility;
- settled consequential decisions and their reasons;
- the highest useful existing validation seam;
- scope boundaries and non-goals; and
- unresolved questions, stated assumptions, and external dependencies.

Prefer behavioral language over an implementation recipe. Mention modules, interfaces, schemas, integration points, or compact prototype-derived shapes only when they preserve a real decision more precisely than prose. Avoid speculative paths and snippets that will become stale.

Select validation seams from repository evidence without asking the user to approve routine technical choices. If honest validation is not available at an appropriate seam, record that constraint.

## Draft or write

Return a conversation draft by default. A request to create, record, or publish the specification authorizes only that artifact in the named repository or tracker. Follow established locations and labels; do not invent workflow conventions.

A specification does not authorize code changes or tickets. Reference existing authoritative artifacts rather than turning the spec into progress tracking or resume state.

## Completion

Verify that asserted requirements are supported by conversation or inspected evidence, unresolved decisions remain visible, validation describes observable behavior, and the next action is clear. Report any material surface that could not be inspected without blocking an otherwise useful draft.
