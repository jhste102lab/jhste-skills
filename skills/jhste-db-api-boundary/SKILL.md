---
name: jhste-db-api-boundary
description: Advisory guidance for API/persistence boundaries: thin routes, SQL parameter binding, row validation, public-safe errors, DTO mapping. Use when touching API, controller, service, repository, or query code.
---

# jhste-db-api-boundary

Use this skill for API and persistence boundary changes. Repo-local API contracts and database conventions remain authoritative.

## Checkpoints

- For non-trivial API or persistence changes, apply `jhste-engineering-groundwork` before writing code.
- Keep API routes/controllers focused on auth, input parsing, service calls, and response mapping.
- Make auth context and tenant or owner scoping visible when a route reads or mutates user data.
- Use parameter binding or a safe query abstraction for SQL.
- Keep request and response contracts explicit enough that caller drift is visible before runtime.
- Validate database rows or third-party records before treating them as domain objects when shape matters.
- Map storage rows to response shapes that match the caller's permission and purpose; do not let internal or higher-privilege data leak through convenient reuse.
- Make write safety visible at the layer that actually preserves the rule; do not rely on app-side checks alone when storage behavior can contradict them.
- For authorization or data-isolation changes, inspect the actual policy and execution path instead of trusting a single route, role, or helper as proof.
- Return public-safe errors; do not leak raw database, stack, or secret-like details.
- For API or persistence changes, verification should prefer the actual contract surface when feasible: route handler behavior, request/response shape, auth or tenant scoping, SQL binding behavior, migration/application path, or service boundary used by callers.

## References

- `references/db-api-boundary.md`
- `../jhste-engineering-groundwork/SKILL.md`
- `../../rules/database/sql_parameter_binding.yaml`
- `../../rules/database/db_row_validation.yaml`
- `../../rules/nextjs/thin_api_route.yaml`
- `../../rules/core/public_safe_error.yaml`
