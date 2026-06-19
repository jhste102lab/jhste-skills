---
name: jhste-architecture-review
description: Advisory architecture review guidance for module boundaries, seams, side effects, route/service/page responsibility, and avoiding pass-through abstraction. Use before or during non-trivial code changes.
---

# jhste-architecture-review

Repo-local architecture docs remain authoritative. Use this skill to keep common structure checks visible while respecting local terms and decisions.

## Checkpoints

- For non-trivial changes, apply `jhste-engineering-judgment` before proposing or editing architecture.
- Keep routing, UI composition, service logic, persistence, and side effects in clear seams.
- Avoid pass-through abstraction that adds names without protecting an invariant or simplifying a caller.
- Make side effects visible in names, directories, or injected dependencies.
- For changed classes, modules, and functions, name one main responsibility and one main reason to change before adding behavior.
- For large or mixed modules, identify the responsibility that can move behind a tested seam without creating shallow pass-through wrappers.
- Treat responsibility budget findings as review prompts, not proof of a bug: look for mixed loading, UI, persistence, orchestration, reporting, and side effects.

## References

- `references/architecture-review.md`
- `../jhste-engineering-judgment/SKILL.md`
- `../../rules/core/side_effect_boundary.yaml`
- `../../rules/core/responsibility_budget.yaml`
- `../../rules/core/single_responsibility_advisory.yaml`
- `../../rules/nextjs/thin_api_route.yaml`
- `../../rules/react/component_responsibility.yaml`
