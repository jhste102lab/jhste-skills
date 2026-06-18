# Code quality reference

Prefer small, explicit changes. Validate data at boundaries such as user input, API payloads, files, environment variables, database rows, and third-party responses.

Failure handling must be observable. Empty catches and ignored promise rejections need a clear reason, a typed fallback, or redacted logging.

## Fallback discipline

Fallbacks should not make uncertain data look valid. Prefer fixing the invariant, validating at the boundary, or returning a typed failure before adding a fallback path.

A fallback is acceptable when the degraded behavior is intentional, scoped to an optional or best-effort path, observable to maintainers, and safe for the caller. Examples include optional telemetry, degraded UX for non-critical content, or a documented best-effort adapter result.

Risky fallback patterns include `catch` blocks that return `[]`, `null`, `undefined`, or `false` without a reason; required environment values with silent defaults; and repeated caller-side defensive chains that duplicate the same uncertainty across the codebase.

## Test quality

Tests should verify observable behavior through the module interface. They should not pass by checking function-name existence, incidental strings, private helpers, or internal call order.

Happy-path tests are useful, but happy-path-only coverage is usually too weak for changed behavior. Add the most relevant non-happy-path check: empty input, null or undefined input, boundary values, failure paths, side effects, idempotency, concurrency, or a regression case.

Mock at external seams such as network, time, filesystem, third-party APIs, and sometimes databases when a test database is impractical. Avoid mocking internal collaborators owned by the codebase. If a test fails after an internal refactor while behavior is unchanged, the test is probably coupled to implementation details.

Logging should help diagnose behavior without exposing sensitive values. When reporting secret-like matches, show only file, line, and a redacted summary.

When code crosses async UI, env, or persistence paths, be skeptical of fragile assumptions. Nullable values, missing loading/error states, direct env reads, duplicate fetches, and repeated writes without dedupe or transaction safety are all review candidates.
