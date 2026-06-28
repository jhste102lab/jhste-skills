---
name: jhste-long-running-work-loop
description: "Coordinate multi-session or long-running work while preserving state, approval boundaries, and resume points. Use when work spans sessions, wait states, recurring reviews, multiple repos, or durable decisions; does not replace code-quality, PRD, issue, triage, or handoff skills."
---

# jhste-long-running-work-loop

Use this skill to decide whether a task needs a durable work loop, then keep the loop small, reviewable, and safe. Repo-local instructions remain authoritative.

This is an orchestration skill. Do not reimplement code quality review, PRD writing, issue breakdown, triage, or handoff workflows. Route to the narrower skill when that is the actual task.

## Scope

Use for work that is likely to lose important state across time, tools, repositories, or sessions:

- multi-session implementation or review work;
- recurring review/check-in loops;
- external waiting states such as CI, preview deploys, reviewer replies, approvals, vendor/API responses, or customer input;
- workflows spanning PRD, issues, implementation, review, and release notes;
- work that touches multiple repositories or external systems;
- hard-to-reverse design decisions that need a durable decision record;
- tasks where the next session or next agent must resume safely.

Skip for:

- simple Q&A;
- typo fixes;
- formatting-only work;
- small README edits;
- small single-file fixes that can finish in one session;
- direct requests that are only PRD drafting, issue breakdown, triage, or handoff;
- work where the changed code path can be handled by `jhste-engineering-groundwork`, guard, and `jhste-red-team-review` alone.

When skipping, use the narrower workflow. If useful, briefly note that a long-running loop is unnecessary.

## Contract

1. **Decide if this is actually long-running.**  
   If not, route to the smallest applicable skill or workflow.

2. **Define the work loop before expanding scope.**  
   Capture only:
   - current goal;
   - current phase;
   - definition of done;
   - explicit out-of-scope items;
   - open decisions;
   - external blockers or wait states;
   - approval boundaries;
   - next checkpoint;
   - required review gates.

3. **Preserve context only when it will reduce future failure.**  
   Do not turn project docs into scratchpads. Do not persist raw thought, private reasoning, secrets, or noisy progress logs.

4. **Choose the right durable surface.**
   - Domain vocabulary or stable domain context -> `CONTEXT.md`.
   - Hard-to-reverse design decision with real trade-offs -> ADR.
   - Active work state, blockers, acceptance, and next action -> issue or PR notes.
   - Next-session or next-agent continuation only -> `handoff`.
   - Ephemeral, obvious, or soon-stale state -> do not persist.

5. **Resume by verifying, not trusting.**  
   On resume, re-check the current repo, branch, issue/PR, CI, deployment, or external state before relying on old notes. Mark stale assumptions as not checked.

6. **Respect approval boundaries.**  
   Proceed without asking for reading, searching, summarizing, planning, drafting, review notes, and issue candidates when repo-local instructions allow it.  
   Ask before send, push, merge, deploy, delete, publish, production data changes, secret exposure, cost-bearing actions, broad tracker edits, or destructive/irreversible changes.

7. **Delegate to existing skills.**
   - Before non-trivial code changes, use `jhste-engineering-groundwork`.
   - After non-trivial code changes, run the configured guard when available and use `jhste-red-team-review`.
   - For PRDs, use `to-prd`.
   - For issue breakdown, use `to-issues`.
   - For tracker triage, use `triage`.
   - For next-agent/session summaries, use `handoff`.
   - For domain glossary or ADR work, use `grill-with-docs` or the repo's domain-documentation workflow.

## Minimal loop note

When a durable loop is warranted, keep the note compact:

```md
## Long-running work loop

Goal:
- ...

Current phase:
- ...

Definition of done:
- ...

Out of scope:
- ...

Open decisions:
- ...

External blockers / wait states:
- ...

Approval required before:
- ...

Durable state location:
- ...

Next checkpoint:
- ...

Review gates:
- ...
```

Prefer referencing existing artifacts by path or URL over duplicating their contents.

## Context storage rules

Unless repo-local docs define another role, treat `CONTEXT.md` as stable domain context, not a work log. Use it only for glossary or domain context that future agents need to understand the project correctly.

Create or update an ADR only when all are true:

1. the decision is hard to reverse;
2. future readers would wonder why it was chosen;
3. there were real alternatives and trade-offs.

Use issue or PR notes for active work state because that state naturally expires when the work closes.

Use handoff for continuation context that helps the next session but does not deserve permanent repo documentation.

Record nothing when the information is trivial, already obvious from code/tests/diff, likely to go stale quickly, or not useful to future work.

## Output style

Be brief. Report:

- whether the long-running loop is warranted;
- the chosen durable surface, if any;
- the next checkpoint;
- any action that requires approval;
- which narrower skill should handle the next concrete step.
