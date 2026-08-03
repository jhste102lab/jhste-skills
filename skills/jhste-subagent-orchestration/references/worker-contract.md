# Worker Contract Protocol

Use this reference to create a self-contained assignment, handle one clarification, and evaluate the return. Omit fields that do not affect execution.

## Assignment template

```markdown
# Worker Assignment
## Identity
- Assignment ID:
- Stage: investigation | implementation | acceptance
- Primary task skill: optional
- Supporting skills: optional
- Repository, workspace, and starting state:
## Single outcome
State the one result this worker must produce.
## Context and decisions
List only verified facts, settled decisions, paths, symbols, and identifiers needed here.
## Decision boundary
- Worker may decide:
- Worker must return unresolved:
## Scope and authority
- Read scope:
- Mutation lease: none | exact files, workspace, host, or resource
- Allowed external writes: none | exact targets and actions
- Forbidden scope:
Execution authority: Perform this assignment directly. Do not spawn, delegate, hand off, coordinate with another worker, or invoke `jhste-subagent-orchestration`.
Authority ceiling: This assignment may narrow any invoked skill. No skill grants additional decision, mutation, delegation, destructive-action, or external-write authority.
## Procedure, hard stops, and completion
- Ordered steps, only where sequence matters:
- Stop conditions:
- Done criteria:
- Required verification and expected result:
- Evidence basis to record, when staleness matters:
## Required report
Return the compact report below without routine progress narration.
```

Allow read-only inspection inside the stated scope unless forbidden. Enumerate mutation, destructive actions, and external writes rather than every harmless read command.

Always stop on a material starting-state mismatch, ownership conflict, missing consequential decision, unavailable required skill or evidence source, need for broader authority, or verification that cannot measure the claimed outcome.

## Clarification and amendment

Use `waiting_for_head` only when the harness can resume the same worker safely.

```markdown
# Clarification Request
- Assignment ID:
- Verified fact or mismatch:
- Decision or information required:
- Current live activity and held lease:
```

Reply without references to prior conversation:

```markdown
# Assignment Amendment
- Assignment ID:
- Changed fact or decision:
- Scope and authority impact:
- Hard-stop impact:
- Verification impact:
- Everything else remains unchanged: yes | no
```

Replace the assignment when the outcome, stage, ownership domain, external authority, or consequential decision changes.

## Report template

```markdown
# Worker Report
## Status
completed | blocked | failed
## Result and evidence
State the result first, then cite relevant paths, lines, diff, measurements, artifacts, logs, or external state.
## Changed resources
List every modified path or external resource, or `None`.
## Verification
- Command or inspection:
- Observed result and exit status:
- Evidence basis: workspace, commit, tree state, or task-owned diff when relevant
## Deviation or blocker
State any deviation, unmet criterion, or unresolved item, or `None`.
## Live activity and lease
- Active commands or jobs, stable identifiers, and notification path:
- Locks or resources still held:
- Safe for the head to release or reassign the lease: yes | no
```

Include adjacent observations only when they affect completion, safety, or the next assignment.

## Stage constraints

- **Investigation:** return facts, evidence, candidate explanations, and uncertainty. Do not choose the final consequential decision or change production behavior. Create disposable artifacts only when explicitly authorized.
- **Implementation:** apply the selected solution inside the lease, preserve named contracts, and stop on a material mismatch. Do not rediscover product requirements or invent recovery policy.
- **Acceptance:** inspect the complete task-owned change and relevant integration surface. Return evidence-backed findings and a verdict without editing; corrections require a new implementation assignment.
