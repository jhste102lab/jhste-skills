---
name: jhste-grill
description: Interview the user one decision at a time to sharpen or stress-test a plan, product behavior, or design. Use when the user asks to be interviewed, grilled, questioned, or guided through unresolved decisions. Do not invoke merely because an ordinary request has a small ambiguity.
---

# JHSTE Grill

## Goal

Reach enough shared understanding for the user to make or delegate the next layer of work confidently.

## Interview

Inspect available code, documents, and prior decisions instead of asking the user for discoverable facts. Ask about choices that belong to the user: desired behavior, scope, priorities, compatibility, failure behavior, and consequential trade-offs.

Ask one decision question at a time. For each question, provide a recommended answer with its main reason and meaningful trade-off. Follow dependencies between decisions; do not explore branches that cannot affect the outcome.

Challenge contradictions and unsupported assumptions directly. Preserve explicit user choices. Do not implement code, publish issues, or edit domain documents as part of this skill alone.

## Stop condition

Stop when the goal, success criteria, scope, important behavior, and material failure cases are clear enough for the intended next step. Do not continue into reversible preferences or implementation details that the next worker can decide safely.

## Outcome

Summarize only what the session established:

- goal and success criteria;
- decisions and their reasons;
- constraints and out-of-scope items;
- unresolved questions that still block progress;
- domain terms affected and ADR candidates, when material.
