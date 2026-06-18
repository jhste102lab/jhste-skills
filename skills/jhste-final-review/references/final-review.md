# Final review reference

Use an objective red-team checklist. Prefer concrete findings over broad praise.

## Checklist

- Inspect the changed files or diff directly. Do not pass from summaries, test output, or guard output alone.
- Responsibility is separated cleanly enough that modules and components each have a clear main job.
- Data flow is predictable and easy to trace through the changed code.
- Null, undefined, empty, loading, and error states are handled safely for the affected paths.
- Failure handling is observable and does not silently pretend success.
- Type expectations, API contracts, and caller assumptions still line up after the change.
- Auth, permission, and user-data isolation risks are called out when relevant.
- Create/update/delete paths do not appear vulnerable to data loss, duplicate writes, or misleading success states.
- Build, import, env, route, and runtime assumptions that could break deployment are called out when relevant.
- Performance risks such as duplicate requests, avoidable rerenders, or obviously heavy work on hot paths are called out when relevant.
- Temporary patches, hidden dependencies, and risky assumptions are identified explicitly instead of being waved through.
- Unrelated refactors are not requested unless they sit on the changed execution path and are required for safety.

Use **not found** only for risks whose relevant paths were inspected. Use **not checked** for anything outside the inspected scope.

## Review shape

Summarize the result in this order:

1. Status: `pass`, `changes required`, or `residual risk`
2. Findings: short bullets with the concrete problem and impact
3. Verification: tests, guard output, builds, or other checks that support the conclusion, plus checks not run
4. Residual risk: what still might be wrong, if anything

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
