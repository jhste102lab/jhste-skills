---
name: jhste-grill
description: Interview the user in dependency-aware decision rounds to sharpen or stress-test a plan, product behavior, or design. Use when the user asks to be interviewed, grilled, questioned, or guided through unresolved user-owned decisions. By default, keep the session read-only with respect to repository files; update settled glossary entries or qualifying ADRs only when the request also asks to record, write, update, or maintain those artifacts. Do not invoke merely because an ordinary request has a small ambiguity; discover facts directly, and use jhste-prototype when settled decisions still need executable evidence.
---

# JHSTE Grill

## Goal

Reach shared understanding across every consequential decision branch with as few user round trips as the decision dependencies allow.

## Discover facts before asking

Inspect available code, documents, prior decisions, tools, and external evidence instead of asking the user for discoverable facts. Continue with frontier questions that do not depend on any still-pending fact-finding rather than blocking the whole interview.

Ask the user only about choices that belong to them: desired behavior, scope, priorities, compatibility, failure behavior, data or security policy, and consequential trade-offs. Do not ask about reversible implementation details that a later executor can decide safely.

## Interview in decision rounds

Map consequential decisions and their dependencies as a decision tree. The current frontier is every unresolved decision whose prerequisites are already settled.

In each round, ask the whole frontier rather than one question at a time. Number each question and include:

- the decision in plain language;
- the main viable choices when useful;
- a recommended answer;
- the main reason and meaningful trade-off.

Keep a question for a later round when its answer depends on another unresolved question in the current round. After the user's response, preserve explicit choices, update the tree, and ask the next frontier without routine confirmation.

Treat a branch as consequential when it can change the goal, success criteria, scope, user-visible behavior, compatibility, data or security behavior, failure recovery, or a costly-to-reverse trade-off. Resolve every consequential branch or record it as an explicit blocker. Challenge contradictions and unsupported assumptions directly.

Do not use a prototype to choose a product policy, priority, or trade-off that belongs to the user. Once those choices are settled, use `jhste-prototype` when representability, API ergonomics, interaction flow, or UI structure still needs runnable evidence. Do not implement production code or publish issues as part of this skill alone.

## Record decision documents only when requested

Do not treat an interview request by itself as authorization to modify repository files.

When the user also asks to record, write, update, or maintain the settled results in a writable repository, read the existing glossary, glossary map, ADRs, and repository conventions first. Follow their locations and formats. Prefer `GLOSSARY.md` and `GLOSSARY-MAP.md` for new fallback documents; if the repository already uses legacy `CONTEXT.md` or `CONTEXT-MAP.md`, preserve that convention instead of creating a parallel glossary.

When a domain term's meaning and boundary are agreed, test it with at least one concrete scenario. If no material contradiction remains and documentation updates are authorized, update the owning glossary during the same round. Keep implementation details, specifications, and temporary notes out of the glossary.

When documentation updates are authorized and the user selects a decision that is costly to reverse, surprising without its rationale, and the result of a real trade-off, write an ADR without requesting separate confirmation. Follow the repository's format. If none exists, use the next available `docs/adr/NNNN-<slug>.md` file with concise `Context` and `Decision` sections; add `Consequences` or `Alternatives` only when they preserve non-obvious information.

When repository documentation updates are not requested, keep the interview read-only and include the exact proposed glossary or ADR changes in the outcome instead. Commit, push, publication, and other external writes still require their own authorization.

## Stop condition

Stop when the decision frontier is empty: the goal, success criteria, scope, important behavior, consequential failure cases, and costly-to-reverse trade-offs are resolved or explicitly blocked. Do not ask for a final confirmation merely to repeat the settled state, and do not continue into reversible preferences or implementation details.

## Outcome

Summarize only what the session established:

- goal and success criteria;
- decisions and their reasons;
- constraints and out-of-scope items;
- unresolved blockers;
- domain terms added, changed, or proposed;
- ADRs created or proposed;
- documentation files changed, when any.
