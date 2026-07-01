---
name: jhste-workstate
description: "Durable work-loop coordination when losing state across sessions, wait states, repos, or decisions would make work unsafe or duplicated."
---

# jhste-workstate

Use only when the main risk is losing important work **state** — not merely because a task may take time. Orchestration only: do not reimplement preflight, change review, redteam, PRD, issue, triage, or handoff; route to the narrower skill when that is the actual task. Repo-local instructions remain authoritative.

## Use when

State loss could make work wrong, duplicated, unsafe, or hard to resume across time, tools, repos, or sessions:

- multi-session implementation or review;
- same-day or multi-day wait states (CI, preview deploys, reviewer replies, approvals, vendor/API/customer responses);
- flows spanning PRD → issues → implementation → review → release;
- multi-repo or external-system work;
- hard-to-reverse decisions needing a durable record.

Skip for simple Q&A, small single-session fixes, or code paths already handled by `jhste-preflight`, guard, and `jhste-redteam` alone.

## Loop contract

- Set a verifiable goal, current phase, definition of done, out-of-scope items, blockers/wait states, approval boundary, and next checkpoint before expanding scope.
- Choose the smallest durable surface: `CONTEXT.md` for stable domain context, an ADR for hard-to-reverse decisions, issue/PR notes for active state, `handoff` for next-session context, or no record for ephemeral state. Prefer paths, URLs, and decisions over duplicated artifact contents.
- Resume by verifying, not trusting: re-check repo, branch, issue/PR, CI, deploy, or external state before relying on old notes; mark stale assumptions as **not checked**.
- Proceed on reading, searching, planning, drafting, and review notes when repo-local instructions allow; ask before the actions in `../_shared/side-effect-policy.md`.

## Minimal loop note

```md
## Durable work loop
Goal / phase / definition of done:
Out of scope:
Open decisions:
External blockers or wait states:
Approval required before:
Durable state location:
Next checkpoint:
```

## References

- `../_shared/core-loop.md`
- `../_shared/side-effect-policy.md`
- `../_shared/evidence-discipline.md`
