# Rule and profile model

Rules are metadata plus implementation declarations. They are used by skills, profile recommendations, built-in guard scanners, and optional profile commands. They are not enabled as a default strict checker.

## Modes

| Mode | Meaning |
|---|---|
| `off` | Rule is not used. |
| `advisory` | Rule is guidance only. This is the default. |
| `changed-files` | Rule applies to changed/staged/file-list scopes after user approval; it is inactive for `guard --scope all`. |
| `baseline-new-only` | Uses baseline ratchet semantics by default: encountered known issues are shown as existing, and new findings require remediation. |
| `strict` | Whole-repository enforcement by default with `fail_on: error` unless explicitly overridden to another enforcing threshold. Requires explicit opt-in. |

Merge order:

1. root profile mode;
2. pack mode;
3. rule mode;
4. more-specific repo-local instructions;
5. explicit user instructions for task goal and scope, without silently overriding verified safety, privacy, data-loss, or repo-architecture constraints.

Rule metadata lives in `rules/`. Pack files live in `packs/`. The example profile is `examples/profile.yaml`.

## Guard contract

`guard` is the repeatable entrypoint. It does not replace repo-local checks; it provides a stable wrapper for built-in scanners and optional profile-declared commands.

- Scope is explicit: `changed`, `staged`, `all`, or `files-from`. `all` uses Git-backed file collection (`git ls-files --cached --others --exclude-standard`) by default and reports filesystem fallback metadata when Git is unavailable.
- Output is stable: `text` for people, `json` with `schema_version: 1` for tools.
- Exit codes are fixed: `0` pass, `1` rule violation failure, `2` guard runtime/scope/scan failure, `3` profile/config error.
- Baseline mode is explicit: `off`, `use`, `update`, or `ratchet`.

Baseline is best understood as a **known-issues ledger**: it records currently accepted guard findings so teams can keep old debt visible while preventing new debt with `ratchet`. It is not an allowlist, not proof of safety, and not strict mode. Baseline-matched findings remain in output with `baseline_status: matched`; JSON summaries expose `baseline_matched` for their count. The legacy `suppressed` summary field remains as a schema-version-1 compatibility alias, but new integrations should prefer `baseline_matched`.

Violation fingerprints are based on finding id, normalized path, and a shape-hashed occurrence key. The occurrence key includes location/symbol shape so repeated findings in the same file do not accidentally share a broad baseline fingerprint; secret-related occurrence keys are hashes and do not expose raw values. JSON output includes `rule_id` for the concrete finding and `rule_family` for the profile-controlled metadata rule. Rule recommendation metadata uses `baseline_supported: true` to mean the guard finding has a stable fingerprint and can appear in the known-issues ledger; it is not an allowlist, proof of safety, or a per-rule enforcement mode. Heuristic findings still need human review before being treated as real debt.

Built-in scanners read `.jhste/profile.yaml` for root, pack/rule modes, and supported thresholds. The generated profile keeps file-size policy explicit: default source-file limit is 300 lines, `mode: advisory` reports it, and `mode: off` disables matching file-size findings. Responsibility/file-size thresholds come from the profile when present. Text output shows confidence markers plus short meaning/remediation hints so heuristic findings are not mistaken for proof and can be acted on from hook output.

Each rule metadata file declares `implementation.guard.status` as one of `builtin`, `metadata_only`, `deep_scan_only`, or `profile_command`. A rule existing in metadata is not the same as a rule being automatically enforced.

## Guard coverage table

| Coverage class | Status value | Current examples | How to interpret |
|---|---|---|---|
| Built-in heuristic scanner | `builtin` | silent failure, secret logging, external input validation candidates, workflow security, file size/responsibility budget/single responsibility, SOLID-informed extension seam and dependency boundary candidates, null/state, auth/data isolation, runtime env, write safety, API contract, performance, SQL, DB row, thin route, type escape, side-effect, crawler, broad Python exception | Guard emits pattern-based findings with confidence/category metadata; review context before treating heuristic candidates as proof. SOLID-informed findings are advisory review candidates, not compliance proof. External input validation coverage is intentionally partial and low-confidence. |
| Metadata-only / human-review required | `metadata_only` | substitutability advisory, interface segregation advisory | Skills and rule docs describe the concern, but guard does not yet have built-in scanner coverage. Do not claim automated coverage for metadata-only rules. |
| Deep-scan-only | `deep_scan_only` | Reserved for future repo-wide analysis rules | Findings, if introduced, come from opt-in deep scan rather than commit-time guard. |
| Profile-command sourced | `profile_command` | Reserved for repo-local command-backed rules | Repo-local profile commands can report violations when `--run-profile-commands` is explicitly enabled. |

Profile command runner is disabled unless `--run-profile-commands` is passed. Executing repo-local profile commands also requires `--trust-repo-profile`; structured commands declare `name`, `cmd`, optional inline string-array `args`, optional `severity`, and optional `timeout_seconds`, and run without a shell. Legacy shell `run` commands are accepted only for compatibility and require `--allow-profile-shell` in addition to repo trust. A nonzero repo-local command is reported as a profile-sourced violation; command execution failures are guard runtime failures, and malformed command configuration is a config failure.

Normal install adds a managed advisory `pre-commit` hook unless `--skip-hooks` is passed or an existing non-managed hook prevents safe install. Full install adds managed advisory `pre-commit` and `pre-push` hooks by default and asks interactively before using blocking behavior. Managed hooks default to advisory mode, refuse to overwrite non-managed hooks, set `JHSTE_HOOK_ACTIVE=1` to skip nested runs, and remain read-only by refusing `--baseline update` and `--run-profile-commands` while the hook sentinel is active.

Repo-specific policy should stay in repo-local guards or `.jhste/profile.yaml` declarations. Shared rules are defaults and templates, not the authority over a repository.

## Completion-time red-team review

Shared guidance now distinguishes two review stages:

- commit-time guard: fast, read-only, and safe for hooks;
- completion-time red-team review: a read-only red-team pass before declaring non-trivial code work complete.

Red-team review should run for non-trivial code changes and may be skipped for docs-only, comment-only, formatting-only, and trivial rename-only changes. Agents should stop after at most two fix + re-review cycles and report residual risks instead of looping indefinitely.

The first shared finding families behind red-team review are:

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

## Single responsibility advisory

`single_responsibility_advisory` is a heuristic review signal for changed classes, modules, and functions. It looks for long functions, functions that appear to mix several concern categories, and modules whose exports look like unrelated helper families. Treat findings as prompts to name one main responsibility and one reason to change; do not extract pass-through wrappers just to silence the warning. The rule remains advisory by default, but repositories can opt into changed-file blocking by setting the rule mode and `guard.fail_on: warning`.

SRP is not a "one function per file" or "smallest possible file" rule. A split is useful when the separated code has an independent reason to change, an understandable file-level responsibility, and a natural behavior or side-effect seam to test. If type definitions, select aliases, mappers, constants, or tiny wrappers always change together and force readers to chase several files to understand one contract, prefer a cohesive contract module instead. The built-in scanner only emits low-confidence static candidates; co-change history, call graphs, and reader navigation cost still require human review.

## SOLID-informed design advisory

SOLID is a coding discipline and review lens in this kit, not an automated compliance standard. `single_responsibility_advisory` remains the existing built-in SRP rule and is the S in the SOLID review model; do not rename it to a broader rule id just for branding.

The added SOLID advisory families are intentionally split by principle so messages stay actionable:

- `extension_seam_advisory` (OCP-informed) has a low-confidence guard candidate, `solid.ocp.variant_branching_hotspot`, for repeated variant, provider, or policy branching. Treat it as a prompt to review whether an extension seam would reduce repeated core edits, not as a demand to add a strategy or registry abstraction.
- `substitutability_advisory` (LSP-informed) is metadata-only and human-review required. Review caller-visible return shapes, nullability, error behavior, side effects, and documented invariants before treating an implementation as substitutable.
- `interface_segregation_advisory` (ISP-informed) is metadata-only and human-review required. Review broad config/interface/props bags, but keep cohesive public contracts together when they are read and changed together.
- `dependency_boundary_advisory` (DIP-informed) has a low-confidence guard candidate, `solid.dip.concrete_side_effect_dependency`, for concrete DB/API/filesystem/payment/notification/queue/browser dependencies in policy-like paths. Treat it as a prompt to inspect the seam; an intentionally local dependency can be acceptable when visible and tested.

Do not describe these rules as `SOLID compliance`, `SOLID rule enforcement`, or a `SOLID violation` detector. Guard findings are review candidates, not proof, and metadata-only SOLID rules provide no automated guard coverage.

## Restricted profile format

`.jhste/profile.yaml` uses a documented restricted YAML-like contract rather than arbitrary YAML. Supported operational sections are `mode`, `packs.<id>.mode`, `rules.<id>.mode`, file-size/responsibility/single-responsibility threshold keys, `baseline.enabled`, `baseline.path`, `guard.default_scope`, `guard.default_format`, `guard.fail_on`, `guard.exit_codes`, and `commands` with `cmd`/`args` or legacy `run`. Unknown pack ids, rule ids, guard keys, baseline keys, command keys, duplicate operational sections, and invalid numeric thresholds are config failures with exit `3`. Documentation-only metadata sections such as `recommendations`, `adapters`, `deep_scan`, `workflow`, and `strict` do not affect guard runtime settings.
