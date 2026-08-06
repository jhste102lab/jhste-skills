# Worker Contract Protocol

Use this reference when a compact assignment needs detailed authority, amendment, reuse, or stage rules. Omit fields that do not affect execution.

## Shared and task-specific context

Put verified facts common to several workers in a harness-native shared-context mechanism when one exists. Keep each assignment limited to task-specific differences. When shared context is unavailable, include every fact needed to execute the assignment without conversation history.

## Assignment template

```markdown
# Worker Assignment
## Identity
- Assignment ID:
- Stage: investigation | implementation | investigation-and-implementation | acceptance
- Primary task skill: optional
## Outcome
State the one result this worker must produce.
## Context
List task-specific verified facts, settled decisions, exact paths, symbols, identifiers, and the starting state only when material.
## Scope and authority
- Read scope:
- Mutation ownership: none | exact files, workspace, host, or resource
- Allowed external writes: none | exact targets and actions
- Forbidden scope:
- Permitted peer fact exchange: none | exact workers and topic
- Worker may decide:
- Worker must return unresolved:
Authority ceiling: No invoked skill or peer message grants additional decision,
mutation, delegation, destructive-action, or external-write authority.
## Completion
- Done signal:
- Required verification and expected result:
- Stop conditions:
- Evidence basis to record when staleness matters:
## Return
Provide the compact report below and place verbose evidence in a harness artifact when available.
```

Allow read-only inspection inside the stated scope unless forbidden. Enumerate mutation, destructive actions, and external writes rather than every harmless read command.

A worker must not transfer its assignment, broaden its authority, or invoke `jhste-subagent-orchestration`. It may request a head grant before spawning another worker. Permitted peer communication is factual only and must not transfer ownership, settle consequential decisions, or conceal new work.

Always stop on a material starting-state mismatch, ownership conflict, missing consequential decision, unavailable required skill or evidence source, need for broader authority, or verification that cannot measure the claimed outcome.

## Clarification, amendment, and reuse

Use `waiting_for_head` only when the harness can safely resume the same worker.

```markdown
# Clarification Request
- Assignment ID:
- Verified fact or mismatch:
- Decision or information required:
- Current live activity and held ownership:
```

Reply without depending on prior conversation:

```markdown
# Assignment Amendment
- Assignment ID:
- Changed fact or decision:
- Scope and authority impact:
- Stop-condition impact:
- Verification impact:
- Everything else remains unchanged: yes | no
```

Reuse the same worker for missing evidence, explanation, or a small correction within the same outcome and ownership boundary when its context is current. Create a new assignment when the outcome, stage, ownership domain, external authority, or consequential decision changes. Use a fresh worker when independent judgment is part of the purpose or prior context is stale or biased.

Do not reopen a completed assignment as though it never ended. Record a follow-up assignment or amendment that identifies the prior result and the current source state.

## Report template

```markdown
# Worker Report
## Status
completed | blocked | failed
## Result
State the outcome first.
## Evidence
Give compact paths, lines, diff, measurements, logs, or external-state references.
Point to the full artifact when the harness preserves one.
## Changed resources
List every modified path or external resource, or `None`.
## Verification
- Command or inspection:
- Observed result and exit status:
- Evidence basis: commit, workspace, tree state, task-owned diff, configuration, or external target
## Deviation or blocker
State any deviation, unmet criterion, or unresolved item, or `None`.
## Live activity and ownership
- Active commands or jobs, stable identifiers, and notification path:
- Resources still held:
- Safe for the head to release or reassign ownership: yes | no
```

Include adjacent observations only when they affect completion, safety, or the next assignment.

## Stage constraints

- **Investigation:** return facts, evidence, candidate explanations, and uncertainty. Do not select a consequential product or architecture decision or change production behavior. Create disposable artifacts only when authorized.
- **Implementation:** apply a settled solution inside the assigned ownership boundary, preserve named contracts, and stop on a material mismatch. Do not rediscover product requirements or invent policy.
- **Investigation-and-implementation:** diagnose and correct only when a fix is already authorized, correction policy is settled, ownership is narrow, and verification is clear. Stop before crossing into a consequential decision or broader mutation domain.
- **Acceptance:** inspect the complete task-owned change and relevant integration surface. Return evidence-backed findings and a verdict without editing. Corrections require an implementation assignment. Do not duplicate an independent check already supplied by the harness unless the head identifies a distinct uncovered risk.
