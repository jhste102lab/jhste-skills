---
name: jhste-to-tickets
description: Turn a defined plan, specification, or conversation into one or more GitHub issues with observable acceptance criteria and real dependency relationships. Use when the user asks to draft, split, organize, or publish established work as GitHub issues or tickets. Do not use for ordinary planning, local execution handoffs, unresolved product behavior, or work whose execution path still requires major investigation.
---

# JHSTE To Tickets

## Goal

Create the smallest GitHub-native work graph whose ready issues can be claimed and completed independently without duplicating the same goal across empty parent-child layers.

## Resolve context autonomously

Identify the GitHub repository from the request or current remote. Read referenced issues, specifications, conversation context, repository guidance, glossary or ADRs, and enough relevant code and tests to understand current seams, compatibility constraints, and verification paths. Discover repository facts directly rather than asking the user.

Ask only for a missing user-owned decision that would materially change scope, issue boundaries, or real dependencies. If desired behavior is not settled, use `jhste-grill` or `jhste-to-spec` rather than encoding guesses. If the main uncertainty is the root cause of a failure, use `jhste-diagnosing-bugs` first. Use `jhste-handoff` when the requested artifact is resume state, ownership, verification, and an exact next action rather than an issue graph.

## Choose the smallest useful graph

Create one issue when the work is one independently reviewable unit.

Use a parent issue only when:

- the user supplied an existing parent;
- two or more execution issues share material goal, decisions, constraints, or coordination context; or
- the parent provides a useful stable outcome while children can progress independently.

Do not create a parent whose only child repeats the same outcome. Do not split work merely to create parallelism or to fit a preferred template.

When multiple issues are justified, split implementation into tracer-bullet slices. Each execution issue must:

- deliver a narrow but complete behavior across the layers it needs;
- be independently demonstrable or verifiable;
- fit one fresh worker context;
- state observable acceptance criteria and relevant validation; and
- include only the shared context needed to execute it.

Do not create separate database, API, UI, documentation, and test issues when none delivers useful behavior alone. Keep directly related documentation and regression protection with the slice that needs them.

## Handle preparation and wide migrations honestly

Create a preparatory issue only when a bounded refactor or compatibility step genuinely blocks a useful slice. State the exact constraint it removes. Keep generic cleanup inside the slice that needs it.

For a wide mechanical change that cannot land as vertical slices, use expand-migrate-contract:

1. introduce a compatible new form;
2. migrate bounded batches sized by blast radius; and
3. remove the old form only after every caller has moved.

When migration batches cannot be integrated or verified independently, do not describe them as standalone green slices. Give them one explicit shared integration target and add a final integrate-and-verify issue blocked by every batch.

Add a dependency only when the blocked issue cannot start until the blocker completes. Convenience and preferred order are not dependencies. Open issues with no unresolved blockers form the execution frontier.

## Draft versus publish

Draft by default. Present the proposed issue or issue graph and dependency edges without writing to GitHub.

Publish when the user explicitly asks to create, post, or publish the issues. That request authorizes those GitHub writes, not unrelated repository changes. Create blockers before blocked issues when identifiers are needed, use native parent and blocked-by relationships when available, and return the links plus the initial frontier.

Follow the repository's existing label policy or labels named by the user. Do not invent or automatically apply a workflow label. When native relationships are unavailable, fall back automatically to explicit references in issue bodies and report that representation in the final result; do not stop merely to request permission for the fallback.

## Issue shapes

A single issue or execution issue should contain only material sections:

```markdown
## Outcome

## Acceptance criteria
- [ ] Observable result
- [ ] Relevant validation

## Context

## Coordination
- Parent: reference, or omitted
- Blocked by: native relationship, explicit reference, or None
- Integration target: only when shared integration is required
```

A parent should contain the shared goal, success criteria, settled decisions, constraints, open blockers, and out-of-scope items. Do not copy local handoff state into every issue.

Avoid speculative file paths, detailed implementation recipes, and code snippets that will go stale. Include a prototype-derived shape only when it records a settled decision more precisely than prose.

## Completion

Before finishing, verify that every issue has a distinct outcome, every parent earns its existence, every preparatory issue removes a real blocker, every dependency prevents work from starting, fallback relationships remain understandable, labels follow established policy, and at least one frontier issue exists unless an external blocker prevents all work.
