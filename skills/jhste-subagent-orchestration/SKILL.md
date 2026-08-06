---
name: jhste-subagent-orchestration
description: Coordinate bounded workers under a decision-owning head when explicit delegation or independently ownable work creates concrete value. Use for subagents, workers, head-worker splits, parallel agent fan-out, or a separate-agent check. Do not use for ordinary linear work, unresolved user decisions, or domain meanings such as container orchestration. Models, providers, reasoning, concurrency, and isolation remain user- and harness-owned.
---

# JHSTE Subagent Orchestration

## Goal

Use workers only where separation improves execution while the head retains decisions, canonical state, ownership, integration, and final verification.

## Choose a topology, not a fixed workflow

Select the lightest shape that fits the work:

- **Direct:** for implicit use, leave small linear work with the owning task skill.
- **Single owner:** one worker owns one coherent outcome.
- **Parallel owners:** independent outcomes proceed concurrently without overlapping mutation ownership.
- **Dynamic waves:** later assignments are created from verified earlier results when the work cannot be planned honestly in one pass.

An explicit delegation request still selects this skill. If no real worker mechanism exists, report that limitation instead of simulating workers.

Delegate only when the outcome is decision-complete enough to assign, independently verifiable, and separable without hidden coordination. Complexity alone is not a reason to fan out. Repeated reading, duplicated setup, and integration cost count against delegation.

## Respect the harness boundary

Treat model selection, provider selection, reasoning or effort, worker count, concurrency, concrete agent configuration, isolation, and scheduling as user- and harness-owned. Do not choose, recommend, or override them.

Use harness-native shared context, structured output, artifacts, worker reuse, isolation, peer messaging, and completion notifications when available. Fall back to self-contained assignments and compact reports when they are unavailable.

## Keep consequential control in the head

The head owns:

- product, scope, security, data, compatibility, and architecture decisions;
- assignment boundaries, dependencies, mutation ownership, and live activity;
- acceptance or rejection of worker claims;
- integration and the final completion decision.

Workers may exchange head-authorized factual information through a harness-native channel, but must not transfer ownership, broaden authority, settle consequential decisions, or hide additional work. A worker may request permission before spawning another worker; it may not invoke this orchestration skill on its own.

## Define bounded outcomes

A worker assignment needs only:

- one outcome;
- task-specific verified context;
- scope and authority, including mutation and external-write boundaries;
- a done signal and required evidence; and
- stop conditions for mismatched state, missing decisions, ownership conflict, broader authority, or unusable verification.

Put shared facts in the harness's shared-context mechanism when one exists. Keep verbose evidence in a stable artifact and return a compact result with its location. Read [references/worker-contract.md](references/worker-contract.md) only when detailed stage, amendment, reuse, or report rules are needed.

One worker may investigate and implement when a fix is already authorized, the policy is settled, ownership is narrow, and the verification signal is clear. Separate investigation when the search is broad, the implementation choice is unsettled, or the work must remain read-only.

Reuse a current worker for missing evidence, explanation, or a small correction within the same outcome and ownership boundary when its context remains valid. Use a fresh worker when independence is the purpose, ownership changes, the source state changed materially, or prior context is stale or anchored to a failed approach.

## Add independent acceptance only when it earns its cost

Use a separate acceptance worker only when the user requests one or when risk, integration surface, or weak verification makes head inspection insufficient. Do not add one merely because implementation completed, and do not duplicate an independent review already supplied by the harness.

Acceptance remains read-only. A material correction becomes an implementation assignment, and fresh acceptance is needed only when that correction invalidates the previous evidence basis.

## Maintain only necessary control state

Treat every worker result as an unverified claim. Check the relevant source, diff, command output, measurement, artifact, or external state before using it. Bind important evidence to the source state it covered and re-run it after relevant integration changes.

Keep no separate ledger for one independent wave. Read [references/control-state.md](references/control-state.md) only for dependent waves, overlapping ownership domains, live activity, worker replacement, or state that must survive into later work.

When repeated workers fail the same unchanged assignment, inspect the assignment rather than blindly retrying. Rewrite, narrow, or reclaim work whose context, decision boundary, ownership, or verification signal is defective.

## Completion

Finish only when material outcomes are verified, required worker results have final dispositions, the integrated state and checks are current, mutation ownership is released, live activity is completed, terminated, or head-owned, and authorized external state matches the intended result.

Report the verified outcome, evidence, material limitations, and remaining risks. Never substitute a worker completion claim for head verification.
