---
name: jhste-grill
description: Interview the user in dependency-aware decision rounds to sharpen or stress-test a plan, product behavior, or design while continuously maintaining settled domain context and qualifying ADRs in the repository. Use when the user asks to be interviewed, grilled, questioned, or guided through unresolved user-owned decisions. Do not invoke merely because an ordinary request has a small ambiguity; discover facts directly, and use jhste-prototype when settled decisions still need executable evidence.
---

# JHSTE Grill

## Goal

Reach shared understanding across every consequential decision branch with as few user round trips as the decision dependencies allow.

## Discover facts before asking

Inspect available code, documents, prior decisions, tools, and external evidence instead of asking the user for discoverable facts. Use bounded workers when independent fact-finding would be faster, and continue with questions that do not depend on the pending result.

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

## Maintain decision documents

In a writable repository, treat the request to run this interview as authorization to maintain local domain and decision documents. Read the existing glossary, context map, ADRs, and repository conventions first. Follow their locations and formats. If none exists, create `CONTEXT.md` lazily when the first term settles and create `docs/adr/` lazily when the first qualifying ADR is needed.

When a domain term's meaning and boundary are agreed, test it with at least one concrete scenario. If no material contradiction remains, update the owning glossary during the same round. Keep implementation details, specifications, and temporary notes out of the glossary.

When the user selects a decision that is costly to reverse, surprising without its rationale, and the result of a real trade-off, write an ADR immediately without requesting separate confirmation. Follow the repository's format. If none exists, use the next available `docs/adr/NNNN-<slug>.md` file with concise `Context` and `Decision` sections; add `Consequences` or `Alternatives` only when they preserve non-obvious information.

Keep documents synchronized throughout the interview rather than batching updates at the end. If the user requests analysis only or forbids edits, present the exact proposed glossary and ADR changes instead. Do not commit, push, or publish repository changes without explicit authorization for those actions.

## Stop condition

Stop when the decision frontier is empty: the goal, success criteria, scope, important behavior, consequential failure cases, and costly-to-reverse trade-offs are resolved or explicitly blocked. Do not ask for a final confirmation merely to repeat the settled state, and do not continue into reversible preferences or implementation details.

## Outcome

Summarize only what the session established:

- goal and success criteria;
- decisions and their reasons;
- constraints and out-of-scope items;
- unresolved blockers;
- domain terms added or changed;
- ADRs created;
- documentation files changed.
