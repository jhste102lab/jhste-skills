# Rule and profile model

Rules are metadata plus implementation declarations. They are used by skills, profile recommendations, built-in guard scanners, and optional profile commands. They are not enabled as a default strict checker.

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

Violation fingerprints are based on finding id, normalized path, and semantic symbol. They intentionally avoid line number and message text so line moves or clearer wording do not churn the baseline. JSON output includes `rule_id` for the concrete finding and `rule_family` for the profile-controlled metadata rule.

Built-in scanners read `.jhste/profile.yaml` for pack/rule modes and supported thresholds. `mode: off` disables matching finding families, and responsibility/file-size thresholds come from the profile when present. Text output shows confidence markers such as `[low-confidence]` so heuristic findings are not mistaken for proof.

Each rule metadata file declares `implementation.guard.status` as `builtin` or `metadata_only`. A rule existing in metadata is not the same as a rule being automatically enforced.

Profile command runner is disabled unless `--run-profile-commands` is passed. A nonzero repo-local command is reported as a profile-sourced violation. Command execution failures are guard runtime failures, and malformed command configuration is a config failure. Commands should declare `name`, `run`, optional `severity`, and optional `timeout_seconds`.

Default install adds a managed advisory `pre-commit` hook unless `--skip-hooks` is passed or an existing non-managed hook prevents safe install. Managed hooks default to advisory mode, refuse to overwrite non-managed hooks, set `JHSTE_HOOK_ACTIVE=1` to skip nested runs, and remain read-only by refusing `--baseline update` and `--run-profile-commands` while the hook sentinel is active.

Repo-specific policy should stay in repo-local guards or `.jhste/profile.yaml` declarations. Shared rules are defaults and templates, not the authority over a repository.

## Completion-time final review

Shared guidance now distinguishes two review stages:

- commit-time guard: fast, read-only, and safe for hooks;
- completion-time final review: a read-only red-team pass before declaring non-trivial code work complete.

Final review should run for non-trivial code changes and may be skipped for docs-only, comment-only, formatting-only, and trivial rename-only changes. Agents should stop after at most two fix + re-review cycles and report residual risks instead of looping indefinitely.

The first shared finding families behind final review are:

- `null_state_safety`
- `authz_data_isolation`
- `build_runtime_env_safety`
- `write_safety_idempotency`
- `api_contract_compatibility`
- `performance_duplicate_fetch`

## Responsibility budget advisory

`responsibility_budget` is a review signal, not a default blocker. It looks for common module shapes that tend to collect unrelated work:

- large Next `page.tsx` files;
- large `"use client"` modules;
- large route/controller files;
- large import/ops scripts;
- large Python orchestrator or runner files;
- client, route, or script files that appear to mix several responsibility categories.

The rule should be used with `advisory`, `changed-files`, or `baseline-new-only` modes unless a repository explicitly opts into stricter local enforcement. Repo-local thresholds remain authoritative.
