# Review card: API / persistence boundary

Selected by `jhste-db-api-boundary` (and available to `jhste-change-review`) when a change touches routes, controllers, services, repositories, SQL, DTOs, auth scoping, or persistence. Owns API/DB boundary failure modes only; the shared loop lives in `../core-loop.md`.

Routes and controllers should be thin enough to read as orchestration: auth, input parsing, service calls, and response mapping. Persistence details belong behind query, repository, or service boundaries chosen by the repository.

Raw SQL must not concatenate or interpolate untrusted values. Prefer parameter binding, and return domain or public DTO values rather than raw storage rows when exposing responses.

When requests are user-scoped, make the auth context and owner or tenant filter visible in the boundary that owns the decision. When a route mutates data, make retries, dedupe, or transaction safety visible instead of assuming one clean execution. Make write safety visible at the layer that actually preserves the rule; do not rely on app-side checks alone when storage behavior can contradict them.

For authorization or data-isolation changes, inspect the actual policy and execution path instead of trusting a single route, role, or helper as proof. Return public-safe errors; do not leak raw database, stack, or secret-like details.

## Boundary recipes

### DB row to domain/public DTO
- Bad: `return Response.json(await prisma.order.findMany())` exposes storage shape directly.
- Better: validate or narrow rows at the repository boundary, map to a domain object or public DTO, and return only caller-owned fields.
- Why: schema drift, nullable storage fields, and private columns do not silently become public API contract changes.

### Scoped mutation
- Bad: `update({ where: { id }, data })` after `requireUser()` assumes the id belongs to the user.
- Better: include owner/tenant scope in the predicate, check affected rows, and map not-found/forbidden to stable public errors.
- Why: auth context, data isolation, and retry behavior are visible on the side-effect path.
