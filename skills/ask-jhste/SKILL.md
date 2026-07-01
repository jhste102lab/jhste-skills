---
name: ask-jhste
description: Router for choosing the right jhste skill or workflow.
disable-model-invocation: true
---

# ask-jhste

Use this when you want help choosing which jhste skill or workflow fits the current situation. This is a router, not a workflow executor: pick the next skill, explain why, then run that skill only if the user asked to continue.

Repo-local instructions remain authoritative. Prefer the smallest skill path that matches the request, and do not create files, issues, PRs, commands, or repo state from this router alone.

## Common routes

- **Non-trivial code change** → `jhste-engineering-groundwork` before editing, then guard and `jhste-red-team-review` before completion.
- **Changed-code review or completion check** → `jhste-red-team-review`.
- **Plan pressure test, no docs writes** → `grilling`; if the user explicitly invoked a personal grill alias, use `grill-me`.
- **Plan pressure test with glossary, CONTEXT, or ADR updates** → `grill-with-docs` plus `domain-modeling` when terminology or durable decisions emerge.
- **Bug diagnosis** → `diagnosing-bugs`.
- **Scoped implementation from a PRD, issue, spec, or handoff** → `implement`.
- **PRD** → `to-prd`; **implementation tickets or slices** → `to-issues`; **incoming/raw issues or PR triage** → `triage`.
- **Session boundary or continuation brief** → `handoff`; use `jhste-long-running-work-loop` when losing state would make multi-session or wait-state work unsafe.
- **Architecture upkeep or module-boundary improvement** → `improve-codebase-architecture`; use `codebase-design` for deep-module vocabulary and interface decisions.
- **Throwaway runnable learning artifact** → `prototype`.
- **Install, connect, sync, global setup, or uninstall** → `setup`.
- **Creating or refining skills** → `writing-great-skills`.

## Choosing between similar routes

- Use `grilling`/`grill-me` for conversation-only interrogation; use `grill-with-docs` when the requested outcome includes repo docs or durable domain decisions.
- Use `to-prd` when the product shape is known enough to specify; use `to-issues` only after there is a plan/PRD to slice.
- Use `triage` for externally supplied/raw backlog items; do not re-triage issues already produced by `to-issues` unless the repo workflow says to.
- Use `handoff` to cross sessions with durable context; use compacting only at intentional phase breaks when losing verbatim history is acceptable.

## Output

Return the recommended route, the reason, and any important route not chosen. If more information is required, ask one short question; otherwise proceed only when the user asked for execution, not just routing advice.
