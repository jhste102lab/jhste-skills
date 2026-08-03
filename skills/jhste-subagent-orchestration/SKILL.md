---
name: jhste-subagent-orchestration
description: Coordinate low-retention worker agents under a decision-owning head through bounded investigation, implementation, or acceptance assignments, isolated mutation leases, and head-verified evidence. Use whenever the user explicitly asks ChatGPT to delegate to subagents or workers, fan out work across agents, run multi-agent execution, or obtain a separate-agent acceptance pass. Invoke implicitly only when real worker execution exists and decision-complete, independently verifiable workstreams or a genuinely independent check provide concrete structural benefit. Do not invoke implicitly for ordinary coding, diagnosis, prototyping, handoff authoring, implementation finalization, PR review, large-but-linear work, unresolved user decisions, or domain uses of orchestration unrelated to ChatGPT workers. Compose task skills without replacing their contracts.
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

Use a star topology. Workers report only to the head and must not spawn, delegate, hand off to one another, or invoke this orchestration skill.

## Decide what to delegate

For implicit invocation, delegate only when the assignment is:

- **Decision-complete:** the packet can state the outcome, settled facts, and decision boundary without asking the worker to invent policy.
- **Independently verifiable:** the head can check the return through code, a diff, tests, measurements, artifacts, or external state.
- **Judgment-bounded:** consequential selection and integration remain with the head.

Complexity alone is not a reason to delegate. Keep large-but-linear work in the owning task skill when workers would add only coordination cost. Dispatch within harness capacity and use the smallest set of independently ownable assignments that creates a concrete benefit.

## Separate stage from task skill

Assign exactly one stage independently of the skill used to perform it:

- `investigation`: gather evidence without changing production behavior. Explicitly authorized disposable prototype artifacts may support the investigation.
- `implementation`: execute a settled decision within a fixed mutation and external-write boundary.
- `acceptance`: independently inspect and verify; keep it read-only by default.

Name one primary task skill when a matching installed skill materially improves execution. Supporting skills are optional. The assignment narrows every invoked skill and no skill may expand mutation, delegation, decision, or external-write authority.

Use `jhste-diagnosing-bugs` for uncertain root-cause investigation and `jhste-coding` for defined implementation. Use `jhste-prototype` only for a bounded executable experiment, normally inside investigation with explicit artifact authority. Use `jhste-pr-review` only for an identifiable PR review. Do not use `jhste-implementation-finalizer` as a read-only acceptance worker; it belongs to implementation/finalization work that is authorized to correct gaps. Resolve user-owned decisions in the head, using `jhste-grill` before dispatch when needed.

Keep investigation, implementation, and acceptance workers separate. Verify investigation evidence before selecting an implementation. After a material correction, use a fresh acceptance worker when the reviewed surface changed enough to invalidate the prior pass.

## Maintain canonical state

Keep one compact ledger of the objective, user authority, settled decisions, repository state, assignment graph, mutation leases, live activity, evidence, verification, dispositions, and next-wave gates.

Treat every worker return as an unverified claim. Check the relevant source, diff, test output, artifact, or external state before changing canonical state. Record each needed return as `accepted`, `rejected`, `merged`, or `superseded` with a short rationale before opening the next dependent wave.

When verification evidence can become stale, record the source state it covered, such as the workspace, commit, tree state, or task-owned diff. Re-run affected checks after later integration changes invalidate that basis.

Read [references/control-state.md](references/control-state.md) for mutation leases, lifecycle, wave triage, background work, recovery, and completion.

## Dispatch self-contained assignments

Write every assignment in English as a standalone contract. Include verified context and settled decisions rather than forwarding conversation history. State exact paths, symbols, resources, and expected observations when known.

Dispatch only when the packet defines:

- One stage, one outcome, and a fixed starting state.
- The worker's decision boundary and unresolved matters it must return.
- Read, mutation, and external-write authority, including an exclusive mutation lease where applicable.
- Deterministic done criteria, verification, and hard-stop conditions.
- A compact evidence-based report and any live-activity transfer requirement.

Do not dispatch an assignment that requires rediscovering requirements, choosing among consequential alternatives, inferring permission, or coordinating with another worker.

Read [references/worker-contract.md](references/worker-contract.md) before the first dispatch, a clarification response, or report evaluation.

## Operate in verified waves

Dispatch the current independent wave within harness capacity, then synthesize its required returns before opening a dependent wave. Prefer safe completion notifications over continuous polling for long-running commands or remote jobs.

A worker may enter `waiting_for_head` only for an essential clarification and only when the harness can resume that worker. Reply with a self-contained amendment. If resumption is unavailable, or the outcome, stage, ownership domain, external authority, or consequential decision changes, terminate the assignment and send a fresh contract to a new worker.

Do not resume a terminal worker. Give replacements canonical state, not the prior worker conversation. When independent replacements repeatedly fail the same unchanged packet, treat the packet as defective: recheck its context, decision boundary, ownership, and verification oracle, then rewrite, narrow, or reclaim it instead of spawning another copy.

Do not release or reassign a mutation lease while its worker owns live activity. Require the worker to stop it or transfer a stable identifier, notification path, intervention limit, termination method, and verification requirement to the head.

## Complete in the head

Finish only when material requirements have verified status, required returns have dispositions, the integrated result and relevant checks are current, no worker mutation lease remains, every live activity is completed, terminated, or explicitly owned by the head, and authorized external state matches the intended target.

Report the verified outcome, checks performed, material limitations, and remaining risks. Never substitute a worker completion claim for head verification.
