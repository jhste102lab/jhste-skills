---
name: jhste-handoff
description: Create or update executor-neutral implementation handoff documents that preserve settled decisions, scope, ownership, progress, verification, blockers, and an exact resume point. Use when the user explicitly asks to create, prepare, refresh, or restructure a handoff for another worker or session, or to split long work into resumable phases. Do not use merely because an existing handoff must be read before implementation resumes; ordinary continuation belongs to jhste-coding, uncertain investigation to jhste-diagnosing-bugs, and independent completion audit to jhste-implementation-finalizer. Do not use for a specification, GitHub ticket graph, ordinary plan, implementation itself, or automatic worker orchestration.
---

# JHSTE Handoff

## Goal

Create the smallest durable work contract that lets another implementation mechanism continue without rediscovering material decisions or inventing product behavior.

## Authority and boundaries

An explicit request to create or update a handoff authorizes the corresponding local handoff documents. Respect analysis-only or no-edit requests. Commit, push, issue, pull-request, and other external writes still require authorization in the user's request.

Keep the handoff independent of any agent, provider, model, CLI, branch strategy, or status protocol. Record the actual executor or workspace only as an execution fact when it helps coordination.

A handoff records execution state; it is not a substitute for a specification, ADR, domain glossary, or GitHub issue graph. Link to those sources instead of copying them.

Reading an existing handoff does not itself select this skill. When the user asks to continue implementation from its exact resume point, route to `jhste-coding`; when unresolved root cause remains the work, route to `jhste-diagnosing-bugs`; when the user requests independent verification or final acceptance of claimed-complete work, route to `jhste-implementation-finalizer`.

## Inspect and settle the contract

Read current user instructions, repository guidance, relevant specs, ADRs, domain context, issues, existing handoffs, code, tests, interfaces, current diff, and parallel ownership before writing.

Do not invent paths, symbols, commands, or architecture. Resolve or visibly block decisions that would materially change behavior, scope, compatibility, data handling, failure recovery, destructive behavior, authorization, or a costly-to-reverse integration boundary. Use `jhste-grill` when a decision interview is needed. Leave repository-discoverable facts and reversible internal details to worker discretion.

## Document set

Follow an established repository handoff convention. When none exists, use:

```text
docs/handoff/indexes/<work-slug>.md
docs/handoff/phases/<work-slug>-pNN-<phase-slug>.md
```

Create only the index when the work is one understandable and verifiable unit. Add phase documents only for multi-session or parallel work, independently verifiable outcomes, meaningful dependencies, distinct integration boundaries, or reliable partial resumption. Do not create one directory per work slug or permanent checkpoint and blocker directories.

Keep the index as the short entry point. Record the objective, current state, phase-level progress, authoritative references, work ownership, decision and execution boundaries, cross-phase risks, and next entry point. Keep detailed tasks out of the index.

Make each phase independently resumable. Record its outcome, status, entry criteria, in-scope and out-of-scope work, confirmed facts, working assumptions, worker discretion, measurable tasks, relevant locations, required behavior and edge cases, verification, exit criteria, next-phase deliverables, remaining risks, and exact resume point. Omit empty sections.

## Parallel work and updates

Do not treat an uncommitted tree or parallel workers as blockers by themselves. Record owned areas, shared contracts, integration owner, workspace or branch when known, and files that require serialized integration. Stop only when ownership cannot be distinguished, safe isolation is unavailable, or continuing would overwrite another workstream.

Update the handoff at phase start, a material blocker or decision change, and phase completion. The active worker may update its phase; the coordinator or finalizer verifies completion and owns the index. Avoid per-edit documentation churn.

## Completion

Finish when the objective and scope are explicit, material decisions are settled or blocked, ownership and integration responsibility are clear, verification and exit criteria are measurable, the document set is no larger than necessary, and the next executor has one exact entry point.
