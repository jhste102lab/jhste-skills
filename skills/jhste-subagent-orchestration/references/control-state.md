# Head Control State

Use this reference for dependent assignments, mutation leases, live background activity, replacement workers, or multiple waves.

## Compact ledger

```text
Mission
- Objective, user authority, forbidden actions
- Settled decisions and unresolved head decisions

Repository
- Repository, workspace, base, branch, starting commit
- Known unrelated changes

Assignments
- ID, stage, primary skill, dependencies
- State: planned | active | waiting_for_head | completed | blocked | failed | discarded
- Verification: unverified | verified
- Disposition: pending | accepted | rejected | merged | superseded
- Disposition rationale

Mutation leases
- Domain, owner assignment, release or transfer condition

Live activity
- Owner, command or job ID, notification path
- Intervention limit, termination method, verification requirement

Next wave gate
- Required evidence, decisions, dispositions, and available leases
```

Track only state that prevents conflicting work, stale evidence, or false completion.

## Lifecycle and dispositions

```text
planned -> active <-> waiting_for_head
active -> completed | blocked | failed -> discarded
```

Use `waiting_for_head` only when the same worker can resume safely. Never return a terminal worker to `active`.

Keep lifecycle, verification, and disposition separate. `completed` is a worker claim. Verify it through direct head inspection, then record each required return as accepted, rejected, merged, or superseded before dependent work proceeds.

## Leases and live activity

A mutation lease is the head's logical reservation, not proof of a runtime lock. The harness controls actual isolation and permissions. Do not overlap leases for the same mutation domain.

Before release or reassignment, verify the resulting state and ensure live activity is completed, terminated, or transferred to the head. A transfer needs a stable identifier, completion notification, intervention limit, termination method, and release check. Silence or worker termination does not release a lease.

## Waves and evidence freshness

Dispatch independent work within harness capacity and triage required returns before opening a dependent wave.

Record the source state covered by important tests, measurements, or acceptance evidence. Re-run affected verification when later integration changes the relevant tree, configuration, data, or external target. Use a fresh acceptance worker after a material correction, not merely to accumulate agreement.

## Recovery

Classify failure as infrastructure, stale precondition, contract gap, implementation defect, ownership conflict, unauthorized action, or unusable evidence. Give replacements a fresh packet from canonical state.

When independent replacements repeatedly fail the same unchanged packet, inspect the packet. Rewrite, narrow, or reclaim it when its context, decision boundary, ownership, or verification oracle is defective. Preserve partial work only when its owner and actual state are known.

## Completion gate

Complete only when material requirements have verified implementation and verification status, required returns have final dispositions, the integrated surface was inspected, checks are current for the final state, no worker lease remains, live activity is completed, terminated, or head-owned, and authorized external state matches the target with remaining risks explicit.
