---
name: ask-jhste
description: Router for choosing the right jhste skill or workflow, and the lightweight policy entrypoint.
disable-model-invocation: true
---

# ask-jhste

Central router for jhste workflows, so repo-local AGENTS.md can stay minimal. This is a router, not an executor: pick the next skill, explain why, then run it only if the user asked to continue. Repo-local instructions remain authoritative; do not create files, issues, PRs, or repo state from this router alone.

Answer five questions:

1. Is this a jhste workflow?
2. Which concrete skill runs next?
3. Which shared policy applies?
4. Which skills should not run?
5. Is it safe to proceed under repo-local instructions, or does it need approval (`../_shared/side-effect-policy.md`)?

## Core coding loop

Non-trivial code change → `jhste-preflight` before editing → guard + `jhste-change-review` on the changed path → `jhste-redteam` before completion. The loop itself lives in `../_shared/core-loop.md`.

## Routes

- Install / connect / sync / global setup / uninstall → `setup`
- Before a non-trivial code change → `jhste-preflight`
- Changed-path quality or design review → `jhste-change-review` (API/DB → `jhste-db-api-boundary`; crawler/worker/scheduler → `jhste-crawler-automation`)
- Before declaring code work complete → `jhste-redteam`
- Losing state across sessions, wait states, or repos would create risk → `jhste-workstate`
- Plan pressure test, no docs writes → `grilling` (personal alias: `grill-me`); with glossary/CONTEXT/ADR → `grill-with-docs` plus `domain-modeling`
- Bug diagnosis → `diagnosing-bugs`
- Scoped implementation from a PRD/issue/spec/handoff → `implement`
- PRD → `to-prd`; implementation tickets or slices → `to-issues`; raw/incoming issue or PR triage → `triage`
- Session boundary or continuation brief → `handoff`
- Architecture upkeep or module-boundary improvement → `improve-codebase-architecture` (deep-module vocabulary → `codebase-design`)
- Throwaway runnable learning artifact → `prototype`
- Creating or refining skills → `writing-great-skills`

## Output

```
route:
reason:
use next:
skip:
approval needed:
```

If the next step is obvious and safe, route directly and proceed only when the user asked for execution, not just routing advice. If approval is needed, ask one short question.
