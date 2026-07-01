---
name: jhste-long-running-work-loop
description: "Coordinate durable work loops when losing state would make work unsafe or hard to resume. Use when work spans sessions, wait states, recurring reviews, multiple repos, or durable decisions; does not replace code-quality, PRD, issue, triage, or handoff skills."
---

# jhste-long-running-work-loop

Use when the main risk is losing important work state, not merely because the task may take time. Keep the loop small, reviewable, and safe. Repo-local instructions remain authoritative.

This is orchestration only. Do not reimplement code-quality review, PRD writing, issue breakdown, triage, or handoff workflows; route to the narrower skill when that is the actual task.

## Decide

Use when state loss could make work wrong, duplicated, unsafe, or hard to resume across time, tools, repos, or sessions:

- multi-session implementation or review;
- recurring check-ins or thread automations;
- same-day or multi-day wait states such as CI, preview deploys, reviewer replies, approvals, vendor/API responses, or customer input;
- flows spanning PRD, issues, implementation, review, and release notes;
- multi-repo or external-system work;
- hard-to-reverse decisions needing a durable record;
- next-session or next-agent resume.

Skip for simple Q&A, typo/formatting/small README edits, small single-session fixes, direct PRD/issue/triage/handoff requests, or code paths handled by `jhste-engineering-groundwork`, guard, and `jhste-red-team-review` alone. When skipping, use the narrower workflow and briefly note that a durable loop is unnecessary when useful.

## Loop contract

- Set a verifiable goal, current phase, definition of done, explicit out-of-scope items, blockers/wait states, approval boundaries, next checkpoint, and review gates before expanding scope.
- Preserve context only when it reduces future failure. Do not turn project docs into scratchpads or persist raw thought, private reasoning, secrets, or noisy progress logs.
- Choose the smallest durable surface: `CONTEXT.md` for stable domain vocabulary/context, ADR for hard-to-reverse decisions with real trade-offs, issue/PR notes for active work state, `handoff` for next-session context, or no record for ephemeral/obvious/soon-stale state.
- Make memory reviewable: prefer paths, URLs, diffs, decisions, blockers, and next actions over duplicated artifact contents.
- Resume by verifying, not trusting: re-check repo, branch, issue/PR, CI, deployment, or external state before relying on old notes; mark stale assumptions as **not checked**.
- Use remote control or recurring automation as a heartbeat to unblock the next move, not as permission to skip review, approval, or verification.
- Proceed without asking for reading, searching, summarizing, planning, drafting, review notes, and issue candidates when repo-local instructions allow it; ask before send, push, merge, deploy, delete, publish, production data changes, secret exposure, cost-bearing actions, broad tracker edits, or destructive/irreversible changes.
- Delegate concrete work: groundwork before non-trivial code changes; guard and red-team after; `to-prd`, `to-issues`, `triage`, `handoff`, or `grill-with-docs` when those are the actual workflow.

## Minimal loop note

When a durable loop is warranted, keep only the fields that matter:

```md
## Durable work loop
Goal / phase / definition of done:
Out of scope:
Open decisions:
External blockers or wait states:
Approval required before:
Durable state location:
Next checkpoint:
Review gates:
```

Prefer referencing existing artifacts by path or URL over copying their contents.

## Context storage rules

Treat `CONTEXT.md` as stable domain context, not a work log, unless repo-local docs define another role. Create or update an ADR only when the decision is hard to reverse, future readers would wonder why it was chosen, and there were real alternatives and trade-offs. Use issue/PR notes for active state that expires with the work, `handoff` for continuation context, and no durable record for trivial or likely-stale information.

## Output style

Be brief: state whether a durable loop is warranted, chosen surface, next checkpoint, approval needs, and the narrower skill for the next concrete step.
