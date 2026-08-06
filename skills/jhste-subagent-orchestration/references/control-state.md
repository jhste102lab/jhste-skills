# Head Control State

Use this reference for dependent assignments, overlapping mutation domains, live background activity, worker reuse or replacement, or multiple verified waves.

## Compact ledger

```text
Mission
- Objective, user authority, forbidden actions
- Settled decisions and unresolved head decisions

Repository
- Repository, workspace, base, branch, starting source state
- Known unrelated changes

Assignments
- ID, stage, primary skill, dependencies, worker identity when reusable
- State: planned | active | waiting_for_head | completed | blocked | failed | discarded
- Verification: unverified | verified
- Disposition: pending | accepted | rejected | merged | superseded
- Disposition rationale

Mutation ownership
- Domain, owner assignment, release or transfer condition

Live activity
- Owner, command or job ID, notification path
- Intervention limit, termination method, verification requirement

Next-wave gate
- Required evidence, decisions, dispositions, and available ownership domains
```

Track only state that prevents conflicting work, stale evidence, or false completion. Skip the ledger for a single independent wave; packets and verified returns are enough.

## Assignment lifecycle and worker reuse

```text
planned -> active <-> waiting_for_head
active -> completed | blocked | failed -> discarded
```

Lifecycle belongs to an assignment, not to the reusable worker process. Do not return a terminal assignment to `active`. A current worker may receive a follow-up assignment for clarification, missing evidence, or a bounded correction when independence is not required and its context remains valid.

Use a fresh worker when ownership or outcome changes, independent judgment matters, the source state changed materially, or prior context is stale or anchored to a failed approach.

Keep lifecycle, verification, and disposition separate. `completed` is a worker claim. Verify it through head inspection, then record each required return as accepted, rejected, merged, or superseded before dependent work proceeds.

## Mutation ownership and live activity

Mutation ownership is the head's logical reservation, not proof of a runtime lock. The harness controls actual isolation and permissions. Do not overlap ownership for the same mutation domain.

Before release or reassignment, verify the resulting state and ensure live activity is completed, terminated, or transferred to the head. A transfer needs a stable identifier, completion notification, intervention limit, termination method, and release check. Silence or worker termination does not release ownership.

## Peer fact exchange

When the harness supports peer communication, record any head-approved factual exchange that affects execution. Do not allow peer messages to change ownership, authority, dependencies, or consequential decisions. Any such change returns to the head and updates canonical state.

## Waves and evidence freshness

Dispatch independent work within harness capacity and triage required returns before opening dependent work.

Record the source state covered by important tests, measurements, or acceptance evidence. Re-run affected verification when later integration changes the relevant tree, configuration, data, or external target.

Use an acceptance worker only for an uncovered risk, explicit user request, broad integration surface, or weak verification. Do not create one simply because implementation completed, and do not duplicate a harness-provided independent review. After a material correction, obtain fresh acceptance only when the previous evidence basis became invalid.

## Recovery

Classify failure as infrastructure, stale precondition, contract gap, implementation defect, ownership conflict, unauthorized action, or unusable evidence. Give replacements canonical state rather than the previous worker conversation.

When independent workers repeatedly fail the same unchanged packet, inspect the packet. Rewrite, narrow, or reclaim it when its context, decision boundary, ownership, or verification oracle is defective. Preserve partial work only when its owner and actual state are known.

## Completion gate

Complete only when material requirements have verified implementation and verification status, required returns have final dispositions, the integrated surface was inspected, checks are current for the final state, no worker mutation ownership remains, live activity is completed, terminated, or head-owned, and authorized external state matches the target with remaining risks explicit.
