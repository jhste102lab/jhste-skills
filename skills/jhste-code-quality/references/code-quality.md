# Code quality reference

Prefer small, explicit changes. Validate data at boundaries such as user input, API payloads, files, environment variables, database rows, and third-party responses.

Failure handling must be observable. Empty catches and ignored promise rejections need a clear reason, a typed fallback, or redacted logging.

## Fallback discipline

Fallbacks should not make uncertain data look valid. Prefer fixing the invariant, validating at the boundary, or returning a typed failure before adding a fallback path.

A fallback is acceptable when the degraded behavior is intentional, scoped to an optional or best-effort path, observable to maintainers, and safe for the caller. Examples include optional telemetry, degraded UX for non-critical content, or a documented best-effort adapter result.

Risky fallback patterns include `catch` blocks that return `[]`, `null`, `undefined`, or `false` without a reason; required environment values with silent defaults; and repeated caller-side defensive chains that duplicate the same uncertainty across the codebase.


## SOLID-informed coding discipline

Use SOLID as a design review lens, not as automatic compliance. Keep each changed function, module, or class focused on one responsibility and one reason to change. Review extension boundaries when new variants repeatedly edit core branching, but avoid premature strategies or registries. Preserve caller-visible return shapes, nullability, error behavior, and side-effect expectations. Prefer right-sized contracts over broad config/interface/props bags, while keeping cohesive public contracts together. Keep concrete DB, API, browser, filesystem, email, payment, and queue effects visible through adapters, repositories, injected dependencies, or intentionally local boundaries.

## Test quality

Tests should verify observable behavior through the module interface. They should not pass by checking function-name existence, incidental strings, private helpers, or internal call order.

Happy-path tests are useful, but happy-path-only coverage is usually too weak for changed behavior. Add the most relevant non-happy-path check: empty input, null or undefined input, boundary values, failure paths, side effects, idempotency, concurrency, or a regression case.

Mock at external boundaries such as network, time, filesystem, third-party APIs, and sometimes databases when a test database is impractical. Avoid mocking internal collaborators owned by the codebase. If a test fails after an internal refactor while behavior is unchanged, the test is probably coupled to implementation details.

Logging should help diagnose behavior without exposing sensitive values. When reporting secret-like matches, show only file, line, and a redacted summary.

When code crosses async UI, env, or persistence paths, be skeptical of fragile assumptions. Nullable values, missing loading/error states, direct env reads, duplicate fetches, and repeated writes without dedupe or transaction safety are all review candidates.

## Implementation recipes

### React client loader/hook/adapter/view

- Bad: one client component fetches, parses, mutates URL state, maps DTOs, shows toasts, and renders every branch.
- Better: a loader or adapter owns IO and parsing, a hook owns client state and retry policy, and the view receives shaped data plus explicit loading/empty/error states.
- Why: caller contracts and null-state invariants are visible, tests can cover the hook/adapter boundary, and the view stays reviewable.

### Mutation write safety

- Bad: a route loops over writes and returns success after the first non-throwing path.
- Better: define the idempotency key or dedupe rule, use a transaction/batch/upsert where needed, check affected rows, and report partial failure explicitly.
- Why: duplicate execution, retry, and rollback behavior are observable instead of assumed.

### Import/ops script

- Bad: a single script parses CLI flags, reads files, transforms rows, writes persistence, and prints a summary inline.
- Better: split into `parseArgs -> load -> transform -> persist -> report`, with dry-run and failure-result boundaries.
- Why: fixtures can test transforms without side effects, while integration tests cover the persistence boundary.
