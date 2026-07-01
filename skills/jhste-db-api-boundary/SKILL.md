---
name: jhste-db-api-boundary
description: "API/persistence boundary review for routes, services, repositories, SQL, DTOs, auth scoping, and public-safe errors."
---

# jhste-db-api-boundary

Fires for API and persistence boundary changes so their safety checks stay reliable. Runs inside `../_shared/core-loop.md`. Repo-local API contracts and database conventions remain authoritative.

## Owns

Apply `../_shared/review-cards/api-db.md` to the changed path:

- thin route/controller responsibility (auth, input parsing, service call, response mapping);
- auth context and tenant/owner scoping visible where user data is read or mutated;
- SQL parameter binding or a safe query abstraction;
- DB/third-party row validation before treating rows as domain objects;
- DTO mapping that matches the caller's permission and purpose;
- write safety at the layer that enforces the rule, not app-side checks alone;
- public-safe errors that do not leak raw database, stack, or secret-like detail.

Verify through the actual contract surface when feasible: route handler behavior, request/response shape, auth/tenant scoping, SQL binding, migration path, or the service boundary callers use.

## Delegates to

Common loop → `../_shared/core-loop.md`; approval boundaries → `../_shared/side-effect-policy.md`.

## Does not own

General code-quality or architecture review (`jhste-change-review`); post-change verdict (`jhste-redteam`).

## References

- `../_shared/review-cards/api-db.md`
- `../_shared/core-loop.md`
- `../../rules/database/sql_parameter_binding.yaml`
- `../../rules/database/db_row_validation.yaml`
- `../../rules/nextjs/thin_api_route.yaml`
- `../../rules/core/public_safe_error.yaml`
