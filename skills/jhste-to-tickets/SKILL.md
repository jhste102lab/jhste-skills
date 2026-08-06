---
name: jhste-to-tickets
description: Turn a defined plan, specification, or conversation into the smallest useful GitHub issue or issue graph with observable acceptance criteria and real dependencies. Use when the user asks to draft, split, organize, or publish established work as issues. Do not use for unresolved product behavior, root-cause investigation, local resume state, or ordinary planning.
---

# JHSTE To Tickets

## Goal

Create issue boundaries that represent coherent outcomes, ownership, and verification rather than templates, layers, or context-window size.

## Resolve context autonomously

Identify the repository and read referenced issues, specifications, guidance, domain context, and enough relevant code and tests to understand current contracts and validation paths. Discover repository facts directly.

Ask only for a user-owned decision that would materially change scope, issue boundaries, or real dependencies. Do not encode unsettled behavior or an unknown root cause as implementation tickets.

## Choose the smallest useful graph

Create one issue when the work is one independently reviewable outcome.

Use a parent only when one already exists or when two or more execution issues share material goal, decisions, constraints, or coordination context. Do not create a parent whose only child repeats the same outcome.

When multiple issues are justified, each execution issue must have:

- one coherent result owned without hidden coordination;
- observable acceptance criteria;
- an honest verification path; and
- only the context needed to execute it.

Do not split by database, API, UI, documentation, test layer, worker count, or expected context size when none of those pieces delivers useful behavior alone. Keep directly related documentation and regression protection with the outcome that needs them.

Create preparatory work only when it removes a concrete blocker for a useful outcome. Keep generic cleanup with the work that benefits from it.

For a broad mechanical migration that cannot land as ordinary vertical slices, read [references/wide-migrations.md](references/wide-migrations.md).

Add a dependency only when the blocked issue cannot start until the blocker completes. Preferred order and convenience are not dependencies. Unblocked open issues form the execution frontier.

## Draft or publish

Draft by default. Publish only when the user asks to create, post, or publish issues; that request authorizes those GitHub writes, not unrelated repository changes.

Use native parent and blocked-by relationships when available. When they are unavailable, fall back automatically to explicit references in issue bodies and report the representation in the final result.

Follow established label policy or labels named by the user. Do not invent a workflow label.

## Issue shape

Use only material sections:

```markdown
## Outcome

## Acceptance criteria
- [ ] Observable result
- [ ] Relevant validation

## Context

## Coordination
- Parent: reference, or omitted
- Blocked by: relationship, reference, or None
- Integration target: only when shared integration is required
```

A parent holds shared goal, success criteria, settled decisions, constraints, blockers, and out-of-scope items. Do not duplicate local handoff state or stale implementation recipes across issue bodies.

## Completion

Verify that every issue has a distinct outcome, every parent earns its existence, preparatory work removes a real blocker, dependencies prevent work from starting, and at least one frontier issue exists unless an external blocker prevents all work.
