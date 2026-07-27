---
name: jhste-coding
description: Implement features, sufficiently understood bug fixes, refactors, and ordinary continuation from a handoff's exact resume point with a small contract-preserving code change and relevant validation. Use when the requested outcome requires modifying repository code and the path to a correction or next implementation step is reasonably clear, including partial progress from another worker when no independent completion audit was requested. For uncertain root-cause work, use jhste-diagnosing-bugs; for independently auditing, verifying, and finalizing claimed-complete or submitted implementation work, use jhste-implementation-finalizer. Do not use for read-only analysis, planning, interviewing, issue creation, domain documentation, or review-only work.
---

# JHSTE Coding

## Goal

Deliver the requested behavior with the smallest clear change that fits the repository.

## Success criteria

- The requested behavior is implemented without unrelated scope.
- Existing caller-visible contracts remain intact unless the request changes them.
- Relevant non-destructive validation passes, or the unverified surface and reason are reported.
- Uncertain, partial, and failed states are not silently treated as success.

## Frame the change

Before editing, identify the requested outcome, material non-goals, caller-visible contract, and important failure states. Locate the module that owns the behavior and the seam through which callers or tests observe it. For a trivial change this can be a brief check; expand the analysis only when the change crosses boundaries or alters a contract.

## Working contract

Inspect the affected code, repository guidance, and nearby patterns before editing. Keep behavior that changes for the same reason together. Reuse established boundaries and abstractions when they fit.

Introduce a new abstraction when the current change demonstrates real variation, repeated change, or a concrete side-effect boundary that becomes clearer by doing so. Prefer a bounded preparatory refactor only when it directly enables the requested behavior and can be reviewed and validated independently. Avoid pass-through wrappers, broad configuration objects, and extension points justified only by possible future use.

Treat public return shapes, nullability, errors, side effects, ordering, and documented behavior as contracts. Validate external input at its entry boundary. Keep credentials, sessions, authorization data, and sensitive payloads out of logs and responses.

For implementation requests, make in-scope local edits and run the narrowest useful validation without pausing for routine confirmation. Continue from an existing handoff or partial implementation with this skill when the exact next step is clear and the user asks to proceed, implement, or resume; prior work alone is not evidence that an independent completion audit is wanted. Stop before an external write, destructive action, or material expansion of scope unless the user authorized it. When the root cause remains materially uncertain, avoid widening speculative edits and hand the investigation to `jhste-diagnosing-bugs`. When the user asks to independently audit, verify, correct, and finalize a completion claim or submitted implementation, use `jhste-implementation-finalizer`.

## Validation

Choose checks that exercise the changed behavior: targeted tests first, then applicable type, lint, build, or smoke checks. Add tests at a seam that represents the caller-visible behavior rather than creating an artificial seam to claim coverage. Re-read the final diff for scope creep, stale compatibility paths, and temporary instrumentation. Do not imply that a check ran when it did not.

## Final response

Report the outcome, validation performed, and any material caveat or remaining blocker. Omit generic background and unchanged details.
