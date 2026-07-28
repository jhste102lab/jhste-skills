---
name: jhste-grill
description: Interview the user one consequential decision at a time to sharpen or stress-test a plan, product behavior, or design while maintaining settled domain context and qualifying ADRs in the repository. Use when the user asks to be interviewed, grilled, questioned, or guided through unresolved user-owned decisions. Do not invoke merely because an ordinary request has a small ambiguity; when the decision is settled and the remaining uncertainty needs executable evidence, use jhste-prototype.
---

# JHSTE Grill

## Goal

Reach shared understanding across every consequential decision branch so the user can make or delegate the next layer of work confidently.

## Interview

Inspect available code, documents, and prior decisions instead of asking the user for discoverable facts. Ask about choices that belong to the user: desired behavior, scope, priorities, compatibility, failure behavior, and consequential trade-offs.

Ask one decision question at a time. For each question, provide a recommended answer with its main reason and meaningful trade-off. Follow dependencies between decisions.

Treat a branch as consequential when it can change the goal, success criteria, scope, user-visible behavior, compatibility, data or security behavior, recovery from failure, or a costly-to-reverse trade-off. Resolve every consequential branch or record it as an explicit blocker. Skip reversible preferences and implementation details that the next worker can decide safely.

Challenge contradictions and unsupported assumptions directly. Preserve explicit user choices. Do not use a prototype to choose a product policy, priority, or trade-off that belongs to the user. Once those choices are settled, use `jhste-prototype` when representability, API ergonomics, interaction flow, or UI structure still needs runnable evidence. Do not implement code or publish issues as part of this skill alone.

## Maintain decision documents

In a writable repository, treat the request to run this interview as authorization to maintain local domain and decision documents. Read the existing glossary, context map, ADRs, and repository conventions first. Follow their locations and formats. If the repository has no convention, create `CONTEXT.md` at the root and `docs/adr/` lazily when the first corresponding entry is needed.

When a domain term's meaning and boundary are agreed, test it with at least one concrete scenario. If no material contradiction remains, update the glossary immediately before asking the next question. Keep implementation details, specifications, and temporary notes out of the glossary.

When the user selects a decision that is costly to reverse, surprising without its rationale, and the result of a real trade-off, write an ADR immediately without requesting separate confirmation. Follow the repository's ADR format. If none exists, use the next available `docs/adr/NNNN-<slug>.md` filename with `Status`, `Context`, `Decision`, `Alternatives considered`, and `Consequences` sections.

Keep documents synchronized throughout the interview rather than batching updates at the end. If the user requests analysis only or forbids edits, present the exact proposed glossary and ADR changes instead. Do not commit, push, or publish repository changes without explicit authorization for those actions.

## Stop condition

Stop when the goal, success criteria, scope, important behavior, consequential failure cases, and costly-to-reverse trade-offs are resolved or explicitly recorded as blockers. Do not continue into reversible preferences or implementation details that the next worker can decide safely.

## Outcome

Summarize only what the session established:

- goal and success criteria;
- decisions and their reasons;
- constraints and out-of-scope items;
- unresolved questions that still block progress;
- domain terms added or changed;
- ADRs created;
- documentation files changed.
