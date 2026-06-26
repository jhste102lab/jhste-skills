---
name: jhste-architecture-review
description: Advisory architecture review guidance for module boundaries, SOLID-informed design review, side effects, and pass-through abstraction. Use when changing module boundaries, app structure, side-effect placement, or responsibility splits.
---

# jhste-architecture-review

Repo-local architecture docs remain authoritative. Use this skill to keep common structure checks visible while respecting local terms and decisions.

## Checkpoints

- For non-trivial changes, apply `jhste-engineering-groundwork` before proposing or editing architecture.
- Keep routing, UI composition, service logic, persistence, and side effects in clear boundaries.
- Avoid pass-through abstraction that adds names without protecting an invariant or simplifying a caller.
- Do not introduce an abstraction only to satisfy a SOLID label. Require a concrete caller, variant, side-effect boundary, testability problem, or maintenance failure mode.
- Make side effects visible in names, directories, or injected dependencies.
- For changed classes, modules, and functions, name one main responsibility and one main reason to change before adding behavior.
- For large or mixed modules, identify the responsibility that can move behind a tested boundary without creating shallow pass-through wrappers.
- Treat responsibility budget findings as review prompts, not proof of a bug: look for mixed loading, UI, persistence, orchestration, reporting, and side effects.
- Apply SOLID-informed design review as a lens, not a compliance checklist: SRP responsibility, OCP extension boundaries, LSP caller-contract stability, ISP right-sized contracts, and DIP dependency direction.
- For OCP, review repeated variant/provider/policy branching only when it creates repeated core edits; avoid premature strategy or registry abstractions.
- For LSP and ISP, rely on contract review and tests rather than automatic violation claims.
- For DIP, keep high-level policy from directly owning concrete side effects unless the dependency is intentionally local, visible, and testable.

## References

- `references/architecture-review.md`
- `../jhste-engineering-groundwork/SKILL.md`
- `../../rules/core/side_effect_boundary.yaml`
- `../../rules/core/responsibility_budget.yaml`
- `../../rules/core/single_responsibility_advisory.yaml`
- `../../rules/core/extension_seam_advisory.yaml`
- `../../rules/core/substitutability_advisory.yaml`
- `../../rules/core/interface_segregation_advisory.yaml`
- `../../rules/core/dependency_boundary_advisory.yaml`
- `../../rules/nextjs/thin_api_route.yaml`
- `../../rules/react/component_responsibility.yaml`
