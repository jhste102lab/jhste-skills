---
name: jhste-to-tickets
description: Turn a defined plan, specification, or conversation into GitHub parent and sub-issues with acceptance criteria and native dependency relationships. Use when the user asks to draft, split, organize, or publish established work as GitHub issues or tickets. Do not use for ordinary planning, unresolved product behavior, or work whose execution path still requires major investigation.
---

# JHSTE To Tickets

## Goal

Create a GitHub-native work graph whose ready issues can be claimed and completed independently by fresh workers.

## Resolve context

Identify the GitHub repository from the request or current remote. Read any referenced issue, specification, conversation context, repository guidance, glossary or ADRs, and enough relevant code and tests to understand current seams, compatibility constraints, and verification paths. Ask only for a missing decision that would materially change scope, issue boundaries, or dependencies.

If the desired behavior is not yet settled, hand the request to `jhste-grill` or `jhste-to-spec` rather than encoding guesses as tickets. If the main uncertainty is the root cause of a failure, use `jhste-diagnosing-bugs` before planning implementation work.

## Draft the work graph

Use a parent issue to hold the shared goal, success criteria, decisions, constraints, open questions, and out-of-scope items. Reuse an existing parent when supplied. Otherwise draft one.

Split implementation into tracer-bullet issues. Each issue must:

- deliver a narrow but complete behavior across the layers it needs;
- be independently demonstrable or verifiable;
- fit one fresh worker context;
- state observable acceptance criteria and relevant validation;
- preserve only the shared context needed to execute it.

Do not create separate database, API, UI, and test issues when none delivers behavior alone. Do not split work that is already safe and reviewable as one issue.

Create a separate preparatory issue only when a bounded refactor or compatibility step is required before a useful vertical slice can land green. State the constraint it removes and keep generic cleanup in the slice that needs it. For a wide mechanical change that cannot land green as vertical slices, use expand-migrate-contract: introduce the compatible form, migrate bounded batches, then remove the old form.

Add a dependency only when the blocked issue cannot start until the blocker completes. Convenience or preferred order is not a dependency. The open, unblocked issues form the execution frontier.

## Draft versus publish

Draft by default. Present the parent, sub-issues, and dependency edges without writing to GitHub.

Publish when the user explicitly asks to create, post, or publish the issues. That request authorizes these GitHub writes; it does not authorize unrelated repository changes. Create the parent and sub-issues, use GitHub's native parent and blocked-by relationships, then return their links and the initial frontier.

Follow the repository's existing label policy or labels named by the user. Do not invent or automatically apply `ready-for-agent` or another workflow label. When native relationships are unavailable, report the limitation before falling back to references in issue bodies.

## Issue shape

Each sub-issue should contain:

```markdown
## Outcome

## Acceptance criteria
- [ ] Observable result
- [ ] Relevant validation

## Context

## Coordination
- Blocked by: native GitHub relationship, or None
- Integration point: branch, contract, or artifact when known
```

Avoid speculative file paths, implementation recipes, and code snippets that will go stale. Include a prototype-derived shape only when it records a decision more precisely than prose.

## Completion

Before finishing, verify that every issue has a clear outcome, every preparatory issue is necessary, every dependency is a real blocker, labels follow an established policy, and at least one frontier issue exists unless an explicit external blocker prevents all work.
