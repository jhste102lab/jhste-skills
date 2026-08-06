---
name: jhste-coding
description: Implement clear, in-scope production code changes while preserving caller-visible contracts and repository conventions. Use for features, known fixes, refactors, and resuming an exact implementation step. Use jhste-diagnosing-bugs when the root cause is uncertain and jhste-prototype when a not-yet-built design question needs runnable evidence. Do not use for planning, review-only work, or an independent completion audit.
---

# JHSTE Coding

## Goal

Deliver the requested production behavior with the smallest clear change that fits the repository.

## Define the contract

Before editing, identify the outcome, material non-goals, caller-visible behavior, important failure states, and the module that owns the change. Keep this brief for a small change and deepen it only when a contract or boundary is affected.

Discover repository and environment facts directly. Make reversible, repository-consistent implementation choices without routine confirmation. Use `jhste-prototype` when the unresolved question is what should be built, and `jhste-diagnosing-bugs` when the cause of existing behavior is still materially uncertain.

## Implement

Inspect the affected code, local guidance, and nearby patterns. Keep behavior that changes for the same reason together. Preserve public return shapes, nullability, errors, side effects, ordering, compatibility, authorization, and sensitive-data boundaries unless the request changes them.

Add an abstraction only when the current change demonstrates real variation, repeated change, or a clearer side-effect boundary. Avoid speculative extension points, pass-through wrappers, broad cleanup, and prototype scaffolding in production code.

Continue through in-scope local edits without pausing. Stop only when progress requires a consequential user-owned decision, broader authority, an external or destructive action not already authorized, unresolved ownership conflict, or root-cause work that should move to diagnosis.

## Verify

Use the strongest available repository-native signal that directly distinguishes the requested behavior from failure. Expand validation only when the change's risk, integration surface, or an observed failure justifies it; do not run a fixed test, type, lint, build, and smoke sequence by habit.

Add or update a test only at a seam that represents the real caller-visible behavior. Inspect the final task-owned diff for scope creep, temporary instrumentation, stale compatibility paths, and prototype-only artifacts. Never imply that an unrun check passed.

## Completion

Report the implemented outcome, the evidence used to verify it, and any material limitation or blocker. Omit generic background and unchanged details.
