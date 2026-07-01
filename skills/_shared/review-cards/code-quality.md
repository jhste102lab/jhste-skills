# Review card: code quality

Selected by `jhste-change-review` when a change touches external input, failure handling, logging, env/config, tests, or cleanup. Owns code-quality failure modes only; the shared loop lives in `../core-loop.md`, the SOLID lens in `../solid-lens.md`.

Prefer small, explicit changes. Validate data at boundaries such as user input, API payloads, files, environment variables, database rows, and third-party responses.

Failure handling must be observable. Empty catches and ignored promise rejections need a clear reason, a typed fallback, or redacted logging. Do not log secrets, tokens, passwords, cookies, authorization headers, sessions, or raw sensitive payloads.

## Fallback discipline

Fallbacks should not make uncertain data look valid. Prefer fixing the invariant, validating at the boundary, or returning a typed failure before adding a fallback path.

A fallback is acceptable when the degraded behavior is intentional, scoped to an optional or best-effort path, observable to maintainers, and safe for the caller. Examples include optional telemetry, degraded UX for non-critical content, or a documented best-effort adapter result.

Risky fallback patterns include `catch` blocks that return `[]`, `null`, `undefined`, or `false` without a reason; required environment values with silent defaults; and repeated caller-side defensive chains that duplicate the same uncertainty across the codebase.

## Cleanup and secret-removal safety

Broad search results are evidence, not an edit plan. Before removing secrets, values, generated noise, or repeated patterns, classify `EDIT_PATHS` and `PROTECTED_PATHS`.

`EDIT_PATHS` should be limited to current product files on the changed execution path or exact paths the user named as editable. Treat docs, examples, tests, fixtures, snapshots, generated outputs, reports, diffs, patches, archives, and history-like surfaces as `PROTECTED_PATHS` unless the user explicitly targets that exact path. Search protected paths for reporting evidence, but report residual hits instead of silently rewriting them.

Never edit history, object stores, reflogs, external copies, or run garbage collection as part of ordinary cleanup. Those are destructive purge operations and need explicit user scope and approval (`../side-effect-policy.md`).

## Test quality

Tests should verify observable behavior through the module interface. They should not pass by checking function-name existence, incidental strings, private helpers, or internal call order.

Happy-path tests are useful, but happy-path-only coverage is usually too weak for changed behavior. Add the most relevant non-happy-path check: empty input, null or undefined input, boundary values, failure paths, side effects, idempotency, concurrency, or a regression case.

Mock at external boundaries such as network, time, filesystem, and third-party APIs. Avoid mocking internal collaborators owned by the codebase; a test that fails after an internal refactor with unchanged behavior is probably coupled to implementation details.

## Implementation recipes

### React client loader/hook/adapter/view
- Bad: one client component fetches, parses, mutates URL state, maps DTOs, shows toasts, and renders every branch.
- Better: a loader or adapter owns IO and parsing, a hook owns client state and retry policy, and the view receives shaped data plus explicit loading/empty/error states.
- Why: caller contracts and null-state invariants are visible, tests can cover the hook/adapter boundary, and the view stays reviewable.

### Mutation write safety
- Bad: a route loops over writes and returns success after the first non-throwing path.
- Better: define the write rule at the layer that can enforce it, check the outcome that matters to callers, and report unsafe or incomplete results instead of implying success.
- Why: duplicate execution, retry, and recovery behavior are observable instead of assumed.

### Import/ops script
- Bad: a single script parses CLI flags, reads files, transforms rows, writes persistence, and prints a summary inline.
- Better: split into `parseArgs -> load -> transform -> persist -> report`, with dry-run and failure-result boundaries.
- Why: fixtures can test transforms without side effects, while integration tests cover the persistence boundary.
