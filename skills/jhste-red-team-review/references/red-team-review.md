# Red-team review reference

Use an objective red-team checklist. Prefer concrete findings over broad praise.

## Checklist

- Inspect the changed files or diff directly. Do not pass from summaries, old passes, intent, test output, partial artifacts, internal reasoning, or guard output alone.
- Responsibility is separated cleanly enough that changed classes, modules, functions, and UI components each have a clear main job and one main reason to change.
- SOLID-informed risks are checked as review prompts, not proof: extension boundaries for repeated variants, substitutability contracts, broad interfaces, and concrete dependency direction.
- Data flow is predictable and easy to trace through the changed code.
- Current proof is identified explicitly: tests, builds, guards, direct inspection, actual consumer path, fresh-client flow, or documented acceptance path checked now.
- Null, undefined, empty, loading, and error states are handled safely for the affected paths.
- Failure handling is observable and does not silently pretend success.
- Type expectations, API contracts, and caller assumptions still line up after the change.
- Auth, permission, and user-data isolation risks are called out when relevant.
- Create/update/delete paths do not appear vulnerable to data loss, duplicate writes, or misleading success states.
- Build, import, env, route, and runtime assumptions that could break deployment are called out when relevant.
- Actual consumer-path proof is preferred when feasible: public API route, CLI command, UI route, worker/scheduler path, service entrypoint, fresh-client flow, or documented acceptance path.
- Performance risks such as duplicate requests, avoidable rerenders, or obviously heavy work on hot paths are called out when relevant.
- Tests for changed behavior assert observable outcomes through the relevant interface, not implementation details or incidental strings.
- Changed behavior is not covered only by a happy path when a meaningful edge, failure, side-effect, idempotency, or regression case is relevant.
- Mocks, if present, sit at external boundaries rather than internal collaborators owned by the codebase.
- Temporary patches, hidden dependencies, and risky assumptions are identified explicitly instead of being waved through.
- Unrelated refactors are not requested unless they sit on the changed execution path and are required for safety.
- Material follow-up work that should be tracked separately is emitted as an `Issue candidate`, not silently filed or updated.
- Heuristic findings, including regex matches, are labeled as candidates rather than proof.
- New guard or review warnings on changed files require a bounded fix attempt before completion when the fix stays on the changed execution path; routine fix/re-review follow-up is covered by repo-local standing approval.
- Do not commit automatically; commit/push remains an explicit user-requested publish action.
- Issue text never includes raw secrets, tokens, credentials, or private data.

Use **not found** only for risks whose relevant paths were inspected. Use **not checked** for anything outside the inspected scope.


## Severity rubric

- **P0/P1 -> changes required**: security/privacy exposure, data loss, broken documented acceptance, misleading success after a failed side effect, config that writes outside the intended boundary, or a release-blocking runtime failure.
- **P2 -> changes required or residual risk**: contract drift, missing edge-case tests, poor failure observability, or maintainability debt on the changed path; require changes when the failure mode is concrete and immediate.
- **P3 -> residual risk**: low-confidence heuristic, polish, docs clarity, or follow-up work outside the changed execution path.

Trace at least one changed execution path from entrypoint to side effect/result for non-trivial code changes. Report paths not checked rather than implying broad coverage. Keep current proof, skipped checks, not checked areas, and residual risks separate.

## Issue candidate shape

Use an `Issue candidate` only for actionable, non-trivial follow-up work outside the current fix. Prefer no candidate over low-value issue spam.

Include:

- **Title** — concise tracker-ready title.
- **Existing issue search** — search terms used, or likely matching issue and why it matches.
- **Affected paths** — files, commands, or docs involved.
- **Evidence** — what was inspected; state **not checked** for missing coverage.
- **Failure mode** — concrete behavior that can mislead, fail, or create risk.
- **Impact** — user, maintainer, safety, or release consequence.
- **Confidence** — high/medium/low and whether the finding is heuristic.
- **Smallest safe fix** — minimal likely remediation.
- **Acceptance criteria** — observable done conditions.
- **Redaction note** — confirm secrets/private data are omitted.
- **Suggested action** — `new issue`, `update existing issue`, or `no issue`.

Ask for explicit approval before creating or updating an issue unless the user directly requested that tracker workflow or repo-local standing approval covers it.

## Review shape

Summarize the result with:

1. `pass`, `changes required`, or `residual risk`
2. Short finding bullets with the concrete problem and impact
3. Issue candidates only when separate tracked follow-up is warranted
4. Current proof: tests, guard output, builds, consumer-path/fresh-client checks, or other checks that support the conclusion
5. Checks intentionally skipped, checks not run, and why
6. Residual risk: what still might be wrong, if anything

Every finding should name:

- affected path;
- concrete failure mode;
- impact;
- smallest safe fix.

When shared tooling reports rule families, interpret them as prompts rather than proof:

- `null_state_safety` → inspect null, empty, loading, and error handling
- `authz_data_isolation` → inspect auth context, tenancy, and owner scoping
- `build_runtime_env_safety` → inspect env validation and runtime assumptions
- `write_safety_idempotency` → inspect duplicate execution, batching, and partial-write risks
- `api_contract_compatibility` → inspect schema, parsing, DTO mapping, and caller drift
- `performance_duplicate_fetch` → inspect duplicate requests and hot-path work
- `extension_seam_advisory` → inspect repeated variant/provider/policy branching as an OCP-informed candidate, not a demand for abstraction
- `dependency_boundary_advisory` → inspect concrete side-effect dependencies in high-level policy/service paths as a DIP-informed candidate
- `substitutability_advisory` → human-review caller-visible return shape, nullability, error behavior, side effects, and invariants; there is no default guard proof
- `interface_segregation_advisory` → human-review broad config/interface/props bags against cohesive-contract locality; there is no default guard proof
