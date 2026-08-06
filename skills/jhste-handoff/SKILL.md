---
name: jhste-handoff
description: Create or update executor-neutral handoffs that preserve the minimum verified context, decisions, references, ownership, verification, risks, and exact next action needed by another session, agent, harness, directory, or collaborator. Use when the user explicitly asks to create, prepare, refresh, or restructure a handoff, or to make long-running implementation state durably resumable. Choose a portable single-file handoff by default and a repository-maintained implementation handoff only when shared state must persist. Do not use merely because an existing handoff must be read before implementation resumes; continuation belongs to jhste-coding, uncertain investigation to jhste-diagnosing-bugs, and independent completion audit to jhste-implementation-finalizer.
---

# JHSTE Handoff

## Goal

Create the smallest accurate artifact that lets the intended next executor continue without rediscovering material decisions, mistaking stale evidence for current state, or inventing product behavior.

## Choose portable or durable form

Use a **portable handoff** by default when work must travel to another session, agent, harness, directory, repository, collaborator, or bounded side task. Create one Markdown artifact in the harness's artifact or temporary-file location when available. Do not modify the repository merely to transport context unless the user names a repository path.

Use a **durable implementation handoff** when:

- the user asks to create or update a project or repository handoff;
- an existing handoff convention or document must be maintained;
- several sessions or workers need one shared, evolving execution record; or
- ownership, integration, verification, and phase state must persist beyond a one-time transfer.

For a new durable handoff without a repository convention, use one file by default:

```text
docs/handoff/<work-slug>.md
```

Add separate phase files only when one file would make independently owned work, dependencies, or exact resumption ambiguous. Do not manufacture an index-plus-phase hierarchy for a single understandable unit.

## Authority and boundaries

An explicit request to create or update a handoff authorizes the corresponding local artifact or named repository document. Respect analysis-only or no-edit requests. Commit, push, issue, pull-request, and other external writes still require authorization in the user's request.

Keep the handoff independent of any provider, model, CLI, branch strategy, or proprietary status protocol. Record an actual harness, worker, workspace, or branch only as a current execution fact when it helps resumption.

A handoff records transfer and execution state; it is not a substitute for a specification, ADR, domain glossary, issue graph, commit, or diff. Reference authoritative artifacts by path, identifier, or URL instead of copying their contents.

Reading an existing handoff does not itself select this skill. Route ordinary implementation continuation to `jhste-coding`, unresolved root-cause work to `jhste-diagnosing-bugs`, and an explicitly requested independent completion audit to `jhste-implementation-finalizer`.

## Inspect only what keeps the handoff honest

Start from the current conversation and already referenced artifacts. Inspect only source state whose staleness could make the handoff misleading, typically the current task-owned diff, named verification results, active ownership, unresolved blockers, live activity, and the exact resume location.

Do not re-read the whole repository merely to produce a handoff. Discover repository facts directly and do not ask the user to repeat information already available.

Do not invent paths, symbols, commands, decisions, verification, or architecture. Resolve or visibly block only decisions that materially change behavior, scope, compatibility, data handling, failure recovery, destructive behavior, authorization, or a costly-to-reverse integration boundary. Leave reversible implementation details to the next executor.

## Write a portable handoff

Tailor the handoff to the next session's stated focus. When no focus is supplied, use the first incomplete material outcome as the next objective rather than asking a routine question.

Include only material sections:

```markdown
# Handoff

## Next objective

## Current verified state

## Settled decisions

## Authoritative references

## Changed or owned resources

## Verification performed

## Remaining blocker or risk

## Exact first action

## Suggested skills
```

Redact API keys, passwords, tokens, private payloads, personally identifiable information, and unrelated sensitive data. Refer to secure locations or credential names without copying secret values.

Suggested skills should be few and directly relevant to the next objective. Do not recommend this orchestration skill merely because workers were previously involved.

## Maintain a durable implementation handoff

A durable handoff may additionally record:

- objective, scope, and current status;
- authoritative specs, ADRs, domain context, issues, commits, and diffs;
- settled decisions, working assumptions, and executor discretion;
- current source state and unrelated changes;
- owned areas, shared contracts, integration owner, and serialized resources;
- measurable remaining tasks, required behavior, and edge cases;
- verification commands, observed results, and the source state they covered;
- live activity, stable identifiers, and intervention rules;
- remaining risks and the exact resume point.

Omit empty sections. Split phases only for independently resumable outcomes, real dependencies, distinct ownership or integration boundaries, or work that cannot fit one session. Each phase must have one clear outcome, entry state, exit evidence, and exact next action.

Do not treat an uncommitted tree or parallel workers as blockers by themselves. Stop only when ownership cannot be distinguished, safe isolation is unavailable, or continuing would overwrite another workstream.

Update durable state at a material phase start, blocker or decision change, and verified phase completion. Avoid per-edit documentation churn. The active worker may update its owned section; the integration owner or finalizer verifies completion state.

## Completion

Finish when the intended next executor has one clear objective, authoritative references instead of duplicated content, an honest verified state, material ownership and risks, and one exact first action. For durable work, ensure integration responsibility and evidence freshness are clear and the document set is no larger than necessary.

Report where the handoff was written, whether it is portable or durable, which sensitive material was intentionally omitted in general terms, and the exact next action it preserves.
