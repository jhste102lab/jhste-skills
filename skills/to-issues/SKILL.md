---
name: to-issues
description: Break an existing plan, spec, or PRD into issue-ready vertical implementation slices. Use when the user wants implementation tickets, issue breakdown, or work breakdown from known requirements. For drafting product requirements from conversation context, use to-prd; create tracker issues only when directly requested or when repo-local workflow gives standing approval.
---

## jhste compatibility

- Repo-local instructions remain authoritative.
- Use `jhste-engineering-groundwork` for scope, boundaries, assumptions, and failure paths when it applies.
- Vocabulary in this vendored skill is advisory unless adopted by repo-local docs; do not rename established repo concepts only to match this skill.
- File, repo, command, issue, PR, or other external side effects are allowed when the user directly requested that workflow or repo-local standing approval covers it. Ask for destructive, irreversible, ambiguous, production, secret, cost-bearing, broad existing-item, or out-of-scope changes.

# To Issues

Break a plan into independently-grabbable issues using vertical slices (tracer bullets).

The issue tracker and triage label vocabulary should come from repo-local instructions or `.jhste/profile.yaml`. If it is still unclear, ask the user instead of assuming.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes an issue reference (issue number, URL, or path) as an argument, fetch it from the issue tracker and read its full body and comments.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Issue titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

Look for opportunities to prefactor the code to make the implementation easier: make the change easy, then make the easy change. Any prefactoring should be its own first slice when it is valuable and independently verifiable.

### 3. Draft vertical slices

Break the plan into **tracer bullet** issues. Each issue is a thin vertical slice that cuts through all required integration layers end-to-end, not a horizontal slice of one layer.

<vertical-slice-rules>
- Each slice delivers a narrow but complete path through the affected layers.
- A completed slice is demoable or verifiable on its own.
- Prefer many thin slices over few thick ones.
- Put required prefactoring first when it makes later implementation simpler and safer.
- Do not add a separate HITL/AFK field by default; represent human decisions, reviews, or external access as blockers, out-of-scope notes, or acceptance criteria.
</vertical-slice-rules>

### 4. Present the breakdown

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Blocked by**: which other slices or human decisions, if any, must complete first
- **User stories covered**: which user stories this addresses, if the source material has them

Make reasonable assumptions about granularity, dependency order, and merging/splitting. Ask only when a choice is ambiguous enough to materially change the implementation plan or when tracker writes require confirmation.

### 5. Prepare or publish the issues

For each slice, prepare an issue-ready ticket body.

If the user directly requested issue/ticket creation, or repo-local workflow gives standing approval that issue breakdown requests create tracker issues, create the issues in dependency order using the repo's normal labels and tracker vocabulary.

Otherwise, present the issue-ready drafts and ask only before writing to the tracker.

Approval of the breakdown is not automatically approval to close, overwrite, or materially modify existing tracker items unless repo-local workflow explicitly defines that behavior or the user directly requested that exact side effect.

<issue-template>
## Parent

A reference to the parent issue on the issue tracker (if the source was an existing issue, otherwise omit this section).

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

Avoid specific file paths or code snippets — they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it here and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- A reference to the blocking ticket or human decision (if any)

Or "None - can start immediately" if no blockers.

</issue-template>

Do NOT close or modify any parent issue.
