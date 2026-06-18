---
name: jhste-db-api-boundary
description: Advisory guidance for thin API routes, SQL parameter binding, database row validation, public-safe errors, and DTO mapping. Use when touching API, controller, service, repository, or query code.
---

# jhste-db-api-boundary

Use this skill for API and persistence boundary changes. Repo-local API contracts and database conventions remain authoritative.

## Checkpoints

- For non-trivial API or persistence changes, apply `jhste-engineering-judgment` before writing code.
- Keep API routes/controllers focused on auth, input parsing, service calls, and response mapping.
- Make auth context and tenant or owner scoping visible when a route reads or mutates user data.
- Use parameter binding or a safe query abstraction for SQL.
- Keep request and response contracts explicit enough that caller drift is visible before runtime.
- Validate database rows or third-party records before treating them as domain objects when shape matters.
- Make write safety visible for repeated execution, batch mutation, or idempotent retry paths.
- Return public-safe errors; do not leak raw database, stack, or secret-like details.

## References

- `references/db-api-boundary.md`
- `../jhste-engineering-judgment/SKILL.md`
- `../../rules/database/sql_parameter_binding.yaml`
- `../../rules/database/db_row_validation.yaml`
- `../../rules/nextjs/thin_api_route.yaml`
- `../../rules/core/public_safe_error.yaml`
