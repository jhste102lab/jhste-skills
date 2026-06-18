# Final review reference

Use an objective red-team checklist. Prefer concrete findings over broad praise.

## Checklist

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

## Review shape

Summarize the result in this order:

1. Status: `pass`, `changes required`, or `residual risk`
2. Findings: short bullets with the concrete problem and impact
3. Verification: tests, guard output, builds, or other checks that support the conclusion
4. Residual risk: what still might be wrong, if anything
