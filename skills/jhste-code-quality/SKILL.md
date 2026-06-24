---
name: jhste-code-quality
description: Public-safe code-quality guidance for input validation, observable failures, secret-safe logging, and oversized-file review. Use when touching external input, failure handling, logging, env/config, or code-quality review paths.
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
- Mock external boundaries, not internal collaborators you control.
- Before adding a new helper, type, or shape, check for the existing source of truth.
- Use SOLID-informed coding discipline as advisory guidance: one responsibility, extension boundaries only when variants force repeated edits, stable caller contracts, right-sized interfaces, and visible side-effect dependencies.
- If a hand-written source file grows beyond the profile threshold, consider splitting responsibilities before adding more code.
- If a page, client module, route/controller, import script, or Python orchestrator crosses a responsibility budget, treat it as a review signal to find the next clean boundary.
- After code changes, prefer `jhste-skills guard --scope changed --format text --fail-on error` when the CLI is available; report warnings and guard runtime/config failures separately.

## References

- `references/code-quality.md`
- `../jhste-engineering-groundwork/SKILL.md`
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
