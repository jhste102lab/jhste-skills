---
name: jhste-code-quality
description: Public-safe code-quality guidance: input validation, observable failures, secret-safe logging, cleanup/search-replace safety, oversized-file review. Use when touching external input, failure handling, logging, env/config, cleanup or secret-removal, broad search/replace, or code-quality review.
---

# jhste-code-quality

Use repo-local instructions first. Treat this skill as shared advisory guidance unless the repo profile explicitly opts into stronger modes.

## Checkpoints

- For non-trivial changes, apply `jhste-engineering-groundwork` before writing code.
- Validate external input before trusting it.
- Do not hide failures; return an error, log a redacted warning, emit an event, or document an intentional fallback.
- Prefer explicit failure, validation, or state modeling over broad fallback paths; fallbacks must be intentional, narrow, observable, and safe.
- Do not log secrets, tokens, passwords, cookies, authorization headers, sessions, or raw sensitive payloads.
- Tests should verify observable behavior through the module interface, not implementation details, function-name existence, or incidental strings.
- Do not stop at happy-path-only coverage for changed behavior; include the most relevant edge, failure, side-effect, idempotency, or regression case.
- For code with side effects or multi-step work, make the failure behavior understandable to callers and users; do not let the code silently imply success when the changed path did not complete safely.
- Mock external boundaries, not internal collaborators you control.
- Before adding a new helper, type, or shape, check for the existing source of truth.
- Apply the SOLID-informed lens as advisory guidance for concrete maintenance and failure risks, not as a compliance label or automatic abstraction; see `../_shared/solid-lens.md`.
- If a hand-written source file grows beyond the profile threshold, consider splitting responsibilities before adding more code.
- If a page, client module, route/controller, import script, or Python orchestrator crosses a responsibility budget, treat it as a review signal to find the next clean boundary.
- After code changes, prefer `jhste-skills guard --scope changed --format text --fail-on error` when the CLI is available; report warnings and guard runtime/config failures separately.

## Cleanup and secret-removal safety

For secret cleanup, value removal, broad repository cleanup, or search/replace work:

- Do not treat search results as an edit set.
- First classify `EDIT_PATHS` and `PROTECTED_PATHS`.
- `EDIT_PATHS` may include only current product files on the changed execution path or paths explicitly named by the user.
- Treat docs, examples, tests, fixtures, snapshots, generated outputs, reports, diffs, patches, archives, and history-like surfaces as `PROTECTED_PATHS` unless the user explicitly names that exact path as the edit target.
- Search the broader repo for reporting evidence, but write only inside `EDIT_PATHS`.
- Report protected residual hits instead of silently editing them.
- Do not edit history, object stores, reflogs, external copies, or run garbage collection unless the user explicitly scopes destructive purge work and approves the plan.

## References

- `references/code-quality.md`
- `../jhste-engineering-groundwork/SKILL.md`
- `../_shared/solid-lens.md`
- `../../rules/core/no_silent_failure.yaml`
- `../../rules/core/no_secret_logging.yaml`
- `../../rules/core/external_input_validation.yaml`
- `../../rules/core/file_size_advisory.yaml`
- `../../rules/core/responsibility_budget.yaml`
- `../../rules/core/single_responsibility_advisory.yaml`
- `../../rules/core/extension_seam_advisory.yaml`
- `../../rules/core/substitutability_advisory.yaml`
- `../../rules/core/interface_segregation_advisory.yaml`
- `../../rules/core/dependency_boundary_advisory.yaml`
