---
name: jhste-subagent-orchestration
description: Coordinate bounded worker agents under a decision-owning head for explicit delegation, independent parallel work, focused investigation or implementation, and a separate acceptance check when it adds real value. Use whenever the user asks for subagents, workers, a head-worker split, parallel agent fan-out, or a separate-agent check, and implicitly only when real worker execution exists and independently ownable work creates concrete benefit. Do not use for ordinary linear work already owned by another task skill, unresolved user decisions, or domain meanings such as container orchestration. The user and harness own model, provider, reasoning, concurrency, and isolation settings.
---

# JHSTE Subagent Orchestration

## Goal

Coordinate bounded workers while the head retains canonical state, consequential judgment, ownership, integration, and final verification.

Treat each worker as the bounded owner of one outcome. Do not assume workers are disposable or persistent; reuse or replace them according to harness capability, context freshness, and the need for independent judgment.

## Respect the harness boundary

Confirm that a real worker mechanism is available. An explicit delegation request still selects this skill when none exists; report the limitation instead of simulating workers or inventing results.

Treat model selection, provider selection, reasoning or effort level, concurrency limits, concrete agent configuration, and isolation mechanics as user- and harness-owned. Do not choose, recommend, or override them.

Use harness-native shared context, structured output, artifacts, worker reuse, isolation, and completion notifications when available. Fall back to self-contained text assignments and compact text reports when they are unavailable.

Keep these responsibilities in the head:

- Spawn, assign, interrupt, reuse, replace, and retire workers.
- Resolve consequential product, scope, security, data, compatibility, and architecture decisions.
- Maintain canonical state, dependencies, mutation ownership, and live-activity ownership.
- Verify evidence, choose dispositions, integrate results, and decide completion.

Workers report outcomes to the head. A worker must not transfer its assignment, broaden its authority, or invoke this orchestration skill. It may request permission before spawning a worker of its own. When the harness supports peer messaging, the head may allow bounded factual exchange, but peer communication must not transfer ownership, settle consequential decisions, or hide additional work.

## Decide what to delegate

For implicit invocation, delegate only when the assignment is:

- **Decision-complete:** the packet can state the outcome, settled facts, and decision boundary without asking the worker to invent policy.
- **Independently verifiable:** the head can check the return through code, a diff, tests, measurements, artifacts, or external state.
- **Judgment-bounded:** consequential selection and integration remain with the head.

Complexity alone is not a reason to delegate. Keep large-but-linear work in the owning task skill when workers would add only repeated reading and coordination. Use the smallest set of independently ownable assignments that creates a concrete benefit.

## Size coordination to the work

- For one settled outcome, one owner, and a clear verification signal, dispatch one implementation worker. Do not manufacture investigation or acceptance stages.
- A worker may investigate and implement in one assignment when a fix is already authorized, the correction policy is settled, the mutation boundary is narrow, the verification signal is clear, and no consequential product, architecture, security, or data decision remains. It must stop if the supported fix crosses that boundary.
- Use a separate investigation worker when the implementation choice is not settled, the evidence search is broad, or investigation must remain read-only.
- Use a separate acceptance worker only when the user requests one or when risk, integration surface, or weak verification makes head inspection insufficient. Do not add one merely because an implementer completed work, and do not duplicate an independent review already provided by the harness.

Use these stage labels:

- `investigation`: gather evidence without changing production behavior.
- `implementation`: execute a settled decision within a bounded mutation and external-write scope.
- `investigation-and-implementation`: diagnose and correct within the narrow conditions above.
- `acceptance`: independently inspect and verify; keep it read-only.

## Compose task skills without expanding authority

Name one primary task skill when a matching installed skill materially improves execution. Supporting skills are optional. The assignment narrows every invoked skill; no skill may expand mutation, delegation, destructive-action, decision, or external-write authority.

Use `jhste-diagnosing-bugs` for uncertain root-cause work, `jhste-coding` for defined implementation, and `jhste-prototype` only for an explicitly bounded executable experiment. Use `jhste-pr-review` only for an identifiable PR review. Do not use `jhste-implementation-finalizer` as a read-only acceptance worker. Resolve user-owned decisions in the head, using `jhste-grill` before dispatch when needed.

Reuse an existing worker for clarification, missing evidence, or a small correction inside the same outcome and ownership boundary when its context remains current. Use a fresh worker when independence matters, ownership changes, the source state changed materially, or the prior context is stale or biased by a failed approach. After a material correction, use a fresh acceptance worker when the earlier acceptance basis is no longer valid.

## Maintain canonical state

Treat every worker return as an unverified claim. Check the relevant source, diff, test output, artifact, or external state before acting on it. Record each required return as `accepted`, `rejected`, `merged`, or `superseded` with a short rationale before opening dependent work.

When verification can become stale, record the source state it covered, such as a commit, workspace, tree state, task-owned diff, configuration, or external target. Re-run affected checks after later integration invalidates that basis.

Keep a written ledger only when work outgrows one independent wave: an assignment depends on another result, more than one mutation owner is live, or a return must survive into later work. For one wave, the assignment packets and verified returns are enough. Read [references/control-state.md](references/control-state.md) only for dependent waves, ownership transfer, live activity, or replacement recovery.

## Dispatch compact assignments

Place verified facts shared by several workers in the harness's shared-context mechanism when available. Keep each worker packet limited to task-specific differences. Without shared context, make every packet self-contained.

Use this compact shape and omit anything that does not affect execution:

```text
Assignment ID and stage; optional primary task skill
Single outcome
Task-specific verified context; starting state only when material
Scope and authority: read scope, mutation ownership, allowed external writes,
  forbidden scope, and any permitted peer fact exchange
Done signal and required verification
Stop conditions
Required return shape
```

Add dependencies, exact source snapshot, lease-transfer rules, or live-activity handling only for work that needs them. Do not dispatch an assignment that requires rediscovering requirements, choosing among consequential alternatives, inferring permission, or coordinating ownership with another worker.

Always stop on a material starting-state mismatch, ownership conflict, missing consequential decision, unavailable required evidence source, need for broader authority, or verification that cannot measure the claimed outcome.

Prefer artifact-first reports when the harness preserves worker output:

```text
Status: completed | blocked | failed
Result: outcome first
Evidence: compact citations plus an artifact or stable reference for full detail
Changed resources: every modified path or external resource, or None
Verification: command or inspection, observed result, exit status, evidence basis
Deviation or blocker, or None
Live activity and ownership: active jobs or resources and whether release is safe
```

Read [references/worker-contract.md](references/worker-contract.md) for detailed amendment, reuse, and stage constraints.

## Operate in verified waves

Dispatch independent work within harness capacity, then synthesize the required returns before opening dependent work. Prefer completion notifications over continuous polling.

Use `waiting_for_head` only for an essential clarification when the same worker can safely resume. Send a self-contained amendment. If the outcome, stage, ownership domain, external authority, or consequential decision changes, issue a new assignment; reuse the same worker only when independence is not required and its context remains valid.

When repeated workers fail the same unchanged packet, treat the packet as defective. Recheck its context, decision boundary, ownership, and verification oracle, then rewrite, narrow, or reclaim it instead of blindly retrying.

Do not release or reassign mutation ownership while its worker owns live activity. Require completion, termination, or a transfer with a stable identifier, notification path, intervention limit, termination method, and release check.

## Complete in the head

Finish only when material requirements have verified status, required returns have final dispositions, the integrated result and relevant checks are current, no worker mutation ownership remains, live activity is completed, terminated, or explicitly head-owned, and authorized external state matches the intended target.

Report the verified outcome, checks performed, material limitations, and remaining risks. Never substitute a worker completion claim for head verification.
