---
name: implement
description: Implement focused work from a PRD, issue, or explicit user request using jhste groundwork, bounded edits, verification, and completion review. Use when the user asks to implement from a PRD/issue/spec or continue a scoped build task.
---

## jhste compatibility

- Repo-local instructions remain authoritative.
- Use `jhste-engineering-groundwork` for scope, boundaries, assumptions, and failure paths when it applies.
- Vocabulary in this vendored skill is advisory unless adopted by repo-local docs; do not rename established repo concepts only to match this skill.
- File, repo, command, issue, PR, or other external side effects are allowed when the user directly requested that workflow or repo-local standing approval covers it. Ask for destructive, irreversible, ambiguous, production, secret, cost-bearing, broad existing-item, or out-of-scope changes.

# Implement

Implement the work described by the user, PRD, issue, or handoff while preserving repo-local workflow rules.

## Workflow

1. **Resolve scope.** Read the referenced PRD, issue, handoff, or prompt. Identify the smallest changed execution path and reject adjacent scope unless leaving it out creates a concrete failure mode.
2. **Run groundwork.** For non-trivial code work, use `jhste-engineering-groundwork` before editing. Capture the final behavior predicates, data contracts, failure paths, and verification boundary.
3. **Make the bounded change.** Edit the owning module(s) only. Do not introduce broad architecture, schema, dependency, or public API changes unless the source material explicitly asks for them and repo-local instructions allow them.
4. **Verify along the consumer path.** Prefer the highest existing boundary that proves the requested behavior. Run targeted tests or smoke checks while iterating, then the relevant broader check before completion.
5. **Run jhste completion checks.** When available, run `jhste-skills guard --scope changed --format text --fail-on error`. For non-trivial code changes, use `jhste-red-team-review` before declaring completion.
6. **Report evidence.** Summarize changed files, commands/results, skipped checks, consumer-path proof, and residual risk.

## Side effects

- Do not commit, push, tag, release, publish, deploy, or mutate tracker items unless the user directly requested that exact side effect or repo-local workflow explicitly covers it.
- If the requested implementation needs secrets, production data, live migrations, cost-bearing resources, or destructive operations, pause for explicit confirmation before that step.
- Keep generated or throwaway artifacts clearly named and local unless the source material asks for persistent outputs.
