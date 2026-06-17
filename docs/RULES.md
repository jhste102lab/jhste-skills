# Rule and profile model

Rules are metadata in the first version. They are used by skills, profile recommendations, and future optional guards. They are not enabled as a default strict checker.

## Modes

| Mode | Meaning |
|---|---|
| `off` | Rule is not used. |
| `advisory` | Rule is guidance only. This is the default. |
| `changed-files` | Rule applies to files changed by the current work after user approval. |
| `baseline-new-only` | Existing accepted debt is ignored; new issues can be blocked by future guard tooling. |
| `strict` | Whole-repository enforcement. Requires explicit opt-in. |

Merge order:

1. root profile mode;
2. pack mode;
3. rule mode;
4. more-specific repo-local instructions;
5. explicit user instructions above all.

Rule metadata lives in `rules/`. Pack files live in `packs/`. The example profile is `examples/profile.yaml`.

## Guard contract

`guard` is the repeatable entrypoint. It does not replace repo-local checks; it provides a stable wrapper for built-in scanners and optional profile-declared commands.

- Scope is explicit: `changed`, `staged`, `all`, or `files-from`.
- Output is stable: `text` for people, `json` with `schema_version: 1` for tools.
- Exit codes are fixed: `0` pass, `1` rule violation failure, `2` guard runtime/scope/scan failure, `3` profile/config error.
- Baseline mode is explicit: `off`, `use`, `update`, or `ratchet`.

Violation fingerprints are based on rule id, normalized path, and semantic symbol rather than line number alone. This lets line moves avoid unnecessary baseline churn.

Repo-specific policy should stay in repo-local guards or `.jhste/profile.yaml` declarations. Shared rules are defaults and templates, not the authority over a repository.

## Responsibility budget advisory

`responsibility_budget` is a review signal, not a default blocker. It looks for common module shapes that tend to collect unrelated work:

- large Next `page.tsx` files;
- large `"use client"` modules;
- large route/controller files;
- large import/ops scripts;
- large Python orchestrator or runner files;
- client, route, or script files that appear to mix several responsibility categories.

The rule should be used with `advisory`, `changed-files`, or `baseline-new-only` modes unless a repository explicitly opts into stricter local enforcement. Repo-local thresholds remain authoritative.
