---
name: jhste-code-quality
description: Public-safe code-quality guidance for input validation, observable failures, secret-safe logging, and file-size advisory review. Use when writing or reviewing application code.
---

# jhste-code-quality

Use repo-local instructions first. Treat this skill as shared advisory guidance unless the repo profile explicitly opts into stronger modes.

## Checkpoints

- Validate external input before trusting it.
- Do not hide failures; return an error, log a redacted warning, emit an event, or document an intentional fallback.
- Do not log secrets, tokens, passwords, cookies, authorization headers, sessions, or raw sensitive payloads.
- If a hand-written source file grows beyond the profile threshold, consider splitting responsibilities before adding more code.
- If a page, client module, route/controller, import script, or Python orchestrator crosses a responsibility budget, treat it as a review signal to find the next clean seam.

## References

- `references/code-quality.md`
- `../../rules/core/no_silent_failure.yaml`
- `../../rules/core/no_secret_logging.yaml`
- `../../rules/core/external_input_validation.yaml`
- `../../rules/core/file_size_advisory.yaml`
- `../../rules/core/responsibility_budget.yaml`
