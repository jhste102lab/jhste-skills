---
name: jhste-subagent-orchestration
description: Coordinate low-retention worker agents under a decision-owning head through bounded investigation, implementation, or acceptance assignments, mutation leases, and head-verified evidence. Use whenever the user asks to delegate work to subagents or workers, to act as a head that assigns work to workers, to fan out or parallelize work across agents, or to obtain a separate-agent acceptance pass. Invoke implicitly only when real worker execution exists and decision-complete, independently verifiable workstreams or a genuinely independent check provide concrete structural benefit. Do not invoke implicitly for ordinary linear work already owned by another task skill, for unresolved user decisions, or for orchestration used as a domain term such as container or workflow orchestration. Compose task skills without replacing their contracts.
---

# JHSTE Subagent Orchestration

## Goal

Coordinate bounded workers while the head retains canonical state, consequential judgment, ownership, integration, and final verification.

Treat each worker as a low-retention leaf with one stage and one outcome. Use workers to widen evidence or execute separable work, not to outsource decisions the head must own.

## Establish runtime and authority

Confirm that a real worker mechanism is available. An explicit delegation request selects this skill even when the mechanism is unavailable; report the limitation instead of simulating workers or inventing results.

Treat harness controls as authoritative for concurrency and actual permissions. Do not set a worker-count limit in this skill. Treat mutation ownership as a head-maintained lease, not a runtime lock, unless the harness provides real isolation.

Keep these responsibilities in the head:

- Spawn, assign, interrupt, replace, and retire workers.
- Resolve consequential product, scope, security, data, compatibility, and architecture decisions.
- Maintain canonical state, dependencies, mutation leases, and live-activity ownership.
- Verify evidence, choose dispositions, integrate results, and decide completion.

Use a star topology. Workers report only to the head. A worker must not hand off its assignment to another worker or invoke this orchestration skill. A worker that believes it needs workers of its own must report that need to the head and receive an explicit grant first, because unreported fan-out hides cost, ownership, and live activity from the head.

## Decide what to delegate

For implicit invocation, delegate only when the assignment is:

- **Decision-complete:** the packet can state the outcome, settled facts, and decision boundary without asking the worker to invent policy.
- **Independently verifiable:** the head can check the return through code, a diff, tests, measurements, artifacts, or external state.
- **Judgment-bounded:** consequential selection and integration remain with the head.

Complexity alone is not a reason to delegate. Keep large-but-linear work in the owning task skill when workers would add only coordination cost. Dispatch within harness capacity and use the smallest set of independently ownable assignments that creates a concrete benefit.

## Size the coordination to the work

Orchestration overhead is a real cost. Spend it in proportion to the work.

- One settled decision, one owner, and a deterministic check: dispatch a single implementation worker with a fixed verification command. Do not manufacture extra stages.
- Add a separate investigation worker when the implementation choice is not yet settled and the evidence needed is larger than the head should read directly.
- Add a separate acceptance worker when the change is consequential, its implementer claims completion, or the head cannot verify it from the diff and checks alone.
- Running investigation, implementation, and acceptance is a ceiling for consequential work, not a default sequence for every item.

## Separate stage from task skill

Assign exactly one stage independently of the skill used to perform it:

- `investigation`: gather evidence without changing production behavior. Explicitly authorized disposable prototype artifacts may support the investigation.
- `implementation`: execute a settled decision within a fixed mutation and external-write boundary.
- `acceptance`: independently inspect and verify; keep it read-only by default.

Name one primary task skill when a matching installed skill materially improves execution. Supporting skills are optional. The assignment narrows every invoked skill and no skill may expand mutation, delegation, decision, or external-write authority.

Use `jhste-diagnosing-bugs` for uncertain root-cause investigation and `jhste-coding` for defined implementation. Use `jhste-prototype` only for a bounded executable experiment, normally inside investigation with explicit artifact authority. Use `jhste-pr-review` only for an identifiable PR review. Do not use `jhste-implementation-finalizer` as a read-only acceptance worker; it belongs to implementation/finalization work that is authorized to correct gaps. Resolve user-owned decisions in the head, using `jhste-grill` before dispatch when needed.

Never merge stages inside one worker. Verify investigation evidence before selecting an implementation. After a material correction, use a fresh acceptance worker when the reviewed surface changed enough to invalidate the prior pass.

## Maintain canonical state

Treat every worker return as an unverified claim. Check the relevant source, diff, test output, artifact, or external state before acting on it. Record each needed return as `accepted`, `rejected`, `merged`, or `superseded` with a short rationale before opening the next dependent wave.

When verification evidence can become stale, record the source state it covered, such as the workspace, commit, tree state, or task-owned diff. Re-run affected checks after later integration changes invalidate that basis.

Keep a written ledger only once the work outgrows a single wave: an assignment depends on another's result, more than one mutation lease is live, or a return must survive into a later wave. For one wave of independent assignments the packets and their verified returns are the state; do not write a separate ledger. When a ledger is warranted, cover the objective, user authority, settled decisions, repository state, assignment graph, leases, live activity, dispositions, and the next-wave gate.

Read [references/control-state.md](references/control-state.md) when a wave depends on another, a lease must transfer, or a replacement worker is needed.

## Dispatch self-contained assignments

Write every assignment in English as a standalone contract. Include verified context and settled decisions rather than forwarding conversation history. State exact paths, symbols, resources, and expected observations when known.

Do not dispatch an assignment that requires rediscovering requirements, choosing among consequential alternatives, inferring permission, or coordinating with another worker.

Use this assignment shape and omit fields that do not affect execution:

```text
Assignment ID, stage (investigation | implementation | acceptance), optional primary task skill
Repository, workspace, and exact starting state
Single outcome this worker must produce
Verified context and settled decisions needed here
Decision boundary: what the worker may decide; what it must return unresolved
Read scope
Mutation lease: none, or the exact files, workspace, host, or resource
Allowed external writes: none, or exact targets and actions
Forbidden scope
Execution authority: perform this assignment directly; do not hand off to another
  worker or invoke this orchestration skill; report to the head before spawning any
  worker of your own. No invoked skill grants authority beyond this packet.
Ordered steps where sequence matters, stop conditions, done criteria
Required verification and its expected result
Required report shape (below)
```

Require this return shape:

```text
Status: completed | blocked | failed
Result and evidence: result first, then paths, lines, diff, measurements, artifacts,
  logs, or external state
Changed resources: every modified path or external resource, or None
Verification: command or inspection, observed result, exit status, evidence basis
Deviation or blocker, or None
Live activity and lease: running jobs and their identifiers, resources still held,
  and whether the head may safely release the lease
```

Always require a stop on a material starting-state mismatch, ownership conflict, missing consequential decision, unavailable required evidence source, need for broader authority, or verification that cannot measure the claimed outcome.

Read [references/worker-contract.md](references/worker-contract.md) for clarification and amendment handling or detailed stage constraints.

## Operate in verified waves

Dispatch the current independent wave within harness capacity, then synthesize its required returns before opening a dependent wave. Prefer safe completion notifications over continuous polling for long-running commands or remote jobs.

A worker may enter `waiting_for_head` only for an essential clarification and only when the harness can resume that worker. Reply with a self-contained amendment. If resumption is unavailable, or the outcome, stage, ownership domain, external authority, or consequential decision changes, terminate the assignment and send a fresh contract to a new worker.

Do not resume a terminal worker. Give replacements canonical state, not the prior worker conversation. When independent replacements repeatedly fail the same unchanged packet, treat the packet as defective: recheck its context, decision boundary, ownership, and verification oracle, then rewrite, narrow, or reclaim it instead of spawning another copy.

Do not release or reassign a mutation lease while its worker owns live activity. Require the worker to stop it or transfer a stable identifier, notification path, intervention limit, termination method, and verification requirement to the head.

## Complete in the head

Finish only when material requirements have verified status, required returns have dispositions, the integrated result and relevant checks are current, no worker mutation lease remains, every live activity is completed, terminated, or explicitly owned by the head, and authorized external state matches the intended target.

Report the verified outcome, checks performed, material limitations, and remaining risks. Never substitute a worker completion claim for head verification.
