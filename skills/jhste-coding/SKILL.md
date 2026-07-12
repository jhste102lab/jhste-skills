---
name: jhste-coding
description: Implement features, fix bugs, and refactor repository code with a small, contract-preserving change and relevant validation. Use when the requested outcome requires modifying code. Do not use for read-only analysis, planning, interviewing, issue creation, or domain documentation.
---

# JHSTE Coding

## Goal

Deliver the requested behavior with the smallest clear change that fits the repository.

## Success criteria

- The requested behavior is implemented without unrelated scope.
- Existing caller-visible contracts remain intact unless the request changes them.
- Relevant non-destructive validation passes, or the unverified surface and reason are reported.
- Uncertain, partial, and failed states are not silently treated as success.

## Working contract

Inspect the affected code, repository guidance, and nearby patterns before editing. Reuse established boundaries and abstractions when they fit. Introduce a new abstraction only when the current change has real variation, repeated logic, or a concrete side-effect boundary that becomes clearer by doing so.

Treat public return shapes, nullability, errors, side effects, ordering, and documented behavior as contracts. Validate external input at its entry boundary. Keep credentials, sessions, authorization data, and sensitive payloads out of logs and responses.

For implementation requests, make in-scope local edits and run the narrowest useful validation without pausing for routine confirmation. Stop before an external write, destructive action, or material expansion of scope unless the user authorized it.

## Validation

Choose checks that exercise the changed behavior: targeted tests first, then applicable type, lint, build, or smoke checks. Do not add a test at an artificial seam merely to claim coverage. Never imply that a check ran when it did not.

## Final response

Report the outcome, validation performed, and any material caveat or remaining blocker. Omit generic background and unchanged details.
