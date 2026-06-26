# CLI behavior

## `install`

`install` is the fast safe setup path.

```bash
npx jhste-skills install
npm install -g jhste-skills
jhste-skills install
node cli/install.mjs --yes --mode normal --repo /path/to/repo
node cli/install.mjs --yes --mode minimal --repo /path/to/repo
node cli/install.mjs --yes --mode full --repo /path/to/repo
node cli/install.mjs --yes --repo /path/to/repo --skip-hooks
node cli/install.mjs --yes --repo /path/to/repo --hooks blocking
node cli/install.mjs --yes --repo /path/to/repo --skill-set core|vendor|all
node cli/install.mjs --yes --repo /path/to/repo --line-limit 300 --line-limit-mode advisory|blocking|off
node cli/install.mjs --yes --repo /path/to/repo --force --allow-profile-overwrite
```

Default behavior:

Install mode defaults to `normal`. Non-interactive installs fail closed with exit `3` unless `--yes` or `-y` is explicit; with that opt-in they use the selected preset, print the plan summary, and skip only the confirmation prompt.

Modes:

- `minimal`: jhste core skills only; no repo profile, bridge, hook, or deep scan.
- `normal`: all bundled skills, repo profile/bridge when a git repo is available, and advisory pre-commit hook.
- `full`: all skills, repo profile/bridge, advisory pre-commit and pre-push hooks, and deep scan by default. Interactive Full asks only whether automatic checks should warn, block at commit time, or block at commit and push time.
- `custom`: interactive-only effect-oriented wizard.

Line-size policy:

- Normal, Full, and Custom ask whether to enable a source-file line limit when a repo profile will be written;
- the default limit is `300` lines;
- advisory mode writes the limit to `.jhste/profile.yaml` and reports warnings without blocking;
- blocking mode installs/refreshes managed hooks with `--fail-on warning`, so line-size and other warning-level findings can block commits;
- non-interactive `--yes` uses the safe default: `300` line advisory limit. Use `--line-limit <lines>`, `--line-limit-mode blocking`, `--line-limit-mode off`, or `--no-line-limit` for automation.

Safety and compatibility:

- selected skills copied to a kit-managed skill directory with `.jhste-skills-manifest.json` digests; default `--skill-set all` installs jhste core skills plus vendored workflow skills, while `core` and `vendor` remain explicit narrower choices;
- `.jhste/profile.yaml` created with `mode: advisory` when missing;
- existing profile is created when missing; generated/managed profiles can be refreshed with `--force`; modified profiles are preserved unless `--force --allow-profile-overwrite` is explicit; user source, CI, package files, lockfiles, non-managed hooks, and unmanaged differing skill directories are not overwritten; unmanaged skill overwrite requires `--allow-unmanaged-skill-overwrite` after review;
- `AGENTS.md` and `CLAUDE.md` bridge blocks use `<!-- jhste-skills:start -->` / `<!-- jhste-skills:end -->` markers; only that managed block is updated on later runs;
- CI, target `package.json`, and lockfiles are not changed. A local advisory pre-commit hook is installed by default in Normal, unless `--skip-hooks` is passed or an existing non-managed hook prevents safe install;
- installed bridge/profile guidance tells agents to record final behavior predicates during groundwork and run `jhste-red-team-review` before declaring non-trivial code work complete, while skipping docs-only, comment-only, formatting-only, and trivial rename-only changes.
- guard text output includes short `Meaning` and `Next` guidance for warning/info findings so users can understand and address candidates from hook output. Guard output remains review evidence, not completion proof; completion reports should separate current proof, consumer-path proof when feasible, skipped or not-run checks, and residual risk.

Repo detection:

- inside a git repo, Normal/Full apply both skills and repo connection;
- outside a git repo without `--repo`, install falls back to skills-only and reports that no current project was detected;
- `--repo <path>` must point inside a git repo for modes that connect a project.

Non-interactive rules:

- no TTY and no `--yes`: exit `3` before changes;
- `--yes` and no `--mode`: Normal;
- `--yes --mode custom`: exit `3`;
- explicit CLI flags override presets, except safety-contract violations are refused;
- `--skip-hooks` and `--hooks` remain mutually exclusive.

## `connect`

`connect` attaches an existing jhste-skills installation to the current git repository.

```bash
jhste-skills connect
jhste-skills connect --mode normal
jhste-skills connect --mode full
jhste-skills connect --mode normal --install-missing
jhste-skills connect --mode normal --force --allow-profile-overwrite
```

Safety contract:

- `connect` requires a git repository and fails before changes outside one;
- `connect --mode minimal` is invalid because connect always means project connection;
- by default, `connect` reuses existing skills and does not silently change the global skills directory;
- missing required skills fail with an actionable message in `--yes` mode unless `--install-missing` is explicit;
- repo profile, bridge blocks, and hooks follow the same managed-output safety rules as `install`; modified profiles are preserved unless `--force --allow-profile-overwrite` is explicit.

## `sync`

`sync` refreshes an existing installation from the current local `jhste-skills` source.

```bash
jhste-skills sync --yes --repo /path/to/repo
jhste-skills sync --yes --repo /path/to/repo --skills-dir /path/to/skills
jhste-skills sync --yes --skill-set all
jhste-skills sync --yes --force --allow-profile-overwrite
```

Stable contract:

- refreshes installed skill directories by default when they differ from the current source;
- only refreshes repo outputs that already look managed by jhste-skills (generated/legacy-generated `.jhste/profile.yaml`, managed bridge markers, or managed hooks);
- does not bootstrap unmanaged repositories; use `install` or `connect` for first-time setup;
- preserves non-managed hooks and does not touch source files, CI, `package.json`, or lockfiles;
- `--force` refreshes generated/managed profiles but does not overwrite modified profiles unless `--allow-profile-overwrite` is also passed; unmanaged differing skill directories require `--allow-unmanaged-skill-overwrite`;
- `sync`/`update` may adopt additional known jhste skills into an already managed skills directory and refresh them without the extra overwrite flag.

## `update`

`update` is an alias for `sync`.

```bash
jhste-skills update --yes --repo /path/to/repo
```

It is meant for the common workflow of pulling the latest `jhste-skills` source first, then reconciling local installed copies and managed repo outputs. It does not self-update the package or run `git pull` for you.

## `deep-scan`

`deep-scan` is opt-in and read-only for source code. It writes only jhste output files:

- `.jhste/deep-scan-report.md`
- `.jhste/profile.recommended.yaml`

It validates `.jhste/profile.yaml` before scanning. Invalid profile config fails with exit `3` and does not write `.jhste/deep-scan-report.md` or `.jhste/profile.recommended.yaml`. It uses Git-backed file collection by default so `.gitignore` rules are honored, then excludes generated, vendor, build, dependency, lock, large binary-like, and secret/env-like files. Secret-like findings are reported only as redacted summaries.

The report includes responsibility budget candidates for large or mixed-responsibility pages, client modules, routes/controllers, import/ops scripts, and Python orchestrators; single-responsibility candidates for long or mixed-concern functions and mixed-export modules; and low-confidence SOLID-informed OCP/DIP candidates for variant branching hotspots and concrete side-effect dependencies in policy-like paths. These are advisory review prompts by default and do not prove a file is wrong.

## `guard`

`guard` is the repeatable changed-file checker. It is read-only unless `--baseline update` writes `.jhste/baseline.json`.

```bash
jhste-skills guard --scope changed --format text --fail-on error
jhste-skills guard --scope staged --format json
jhste-skills guard --scope all --baseline use
jhste-skills guard --scope files-from --files-from /tmp/files.zlist
```

Stable contract:

- `--scope`: one of `changed`, `staged`, `all`, `files-from`. `changed` means committed diff from base/head plus unstaged, staged, and untracked files; `staged` means staged files only; `all` uses `git ls-files --cached --others --exclude-standard` by default and reports filesystem fallback metadata if Git is unavailable.
- `--format`: `text` for humans or schema-versioned `json` for AI/hooks/CI.
- `--fail-on`: `none`, `warning`, or `error`.
- `--baseline`: `off`, `use`, `update`, or `ratchet`. `ratchet` requires an existing baseline. `update` is refused when guard runtime failures occur, inside managed hooks, or when `--baseline-path` resolves outside the repository. Think of baseline as a known-issues ledger: baseline-matched findings encountered in the selected scope remain visible as remediation queue items rather than being treated as a pass.
- exit `0`: pass; exit `1`: violations met `--fail-on` or ratchet found new issues; exit `2`: guard runtime/scope/scan failure; exit `3`: config/profile error. These exit codes are fixed; `guard.exit_codes` is not a supported runtime setting.

The JSON output starts with:

```json
{
  "schema_version": 1,
  "summary": { "error": 0, "warning": 0, "info": 0, "baseline_matched": 0, "suppressed": 0, "failures": 0 },
  "meta": {
    "tool_version": "0.1.1",
    "scope": "changed",
    "files_considered": 0,
    "files_scanned": 0,
    "duration_ms": 0
  },
  "violations": []
}
```

Guard failures are not validation success. AI agents should report exit `2` or `3` separately from rule violations.
Each JSON violation includes `confidence`, `category`, and `why_not_proof`; `heuristic_candidate` findings are review prompts, not proof of a bug.
`summary.baseline_matched` counts known-issues ledger matches that are still shown in `violations`; `summary.suppressed` is retained only as a schema-version-1 compatibility alias.
Profile `changed-files` findings are inactive for `--scope all`; `strict` defaults to `scope=all` and `fail_on=error`; `baseline-new-only` defaults to baseline `ratchet`. Legacy generated profiles may still contain `guard.exit_codes`; guard accepts that block as a no-op for compatibility and ignores it.

Managed hook executions are read-only. While `JHSTE_HOOK_ACTIVE=1`, `guard` refuses `--baseline update` and `--run-profile-commands`. Outside hooks, `--run-profile-commands` requires `--trust-repo-profile`; legacy shell `run` commands additionally require `--allow-profile-shell`, while structured `cmd` plus inline string-array `args` runs without a shell.

## `hooks`

`hooks` manages local git hook automation. `install` uses advisory hooks by default, and this command lets you inspect, replace, or remove managed hooks later.

```bash
jhste-skills hooks install --mode advisory
jhste-skills hooks install --mode blocking --fail-on error
jhste-skills hooks install --hook all --mode advisory
jhste-skills hooks doctor
jhste-skills hooks uninstall --hook all
```

Safety contract:

- quick install installs a managed advisory `pre-commit` hook by default;
- `--skip-hooks` opts out;
- advisory hooks print guard output but do not block commits;
- blocking hooks return the guard exit code;
- generated managed hooks prefer the install-time local CLI path before the global `jhste-skills` fallback, include a `# jhste-skills version=...` comment, and skip nested runs using `JHSTE_HOOK_ACTIVE=1`;
- existing non-managed hooks are never overwritten;
- uninstall removes only hooks marked as managed by this tool.

## `uninstall`

`uninstall` removes jhste-skills managed outputs without touching unmanaged project files.

```bash
jhste-skills uninstall --yes --repo /path/to/repo
jhste-skills uninstall --yes --repo /path/to/repo --repo-only
jhste-skills uninstall --yes --skills-dir /path/to/skills --skills-only
jhste-skills uninstall --yes --repo /path/to/repo --force-profile
```

Safety contract:

- non-interactive runs fail closed unless `--yes`/`-y` is explicit;
- managed `pre-commit` and `pre-push` hooks are removed, while non-managed hooks are left untouched;
- marker-managed bridge blocks are removed from `AGENTS.md` and `CLAUDE.md`; other text in those files is preserved;
- manifest-managed skill directories are removed from the skills directory, while unmanaged skill directories are left untouched;
- `.jhste/profile.yaml` is removed only when it still matches the current generated profile shape or the legacy generated shape that contained `guard.exit_codes`; modified profiles are left for manual review unless `--force-profile` is explicit;
- empty managed directories are cleaned up best-effort.

## `tune`

`tune` shows that the recommended profile is separate, then applies non-strict pack/rule recommendations only after user approval. Non-interactive runs fail closed with exit `3` unless `--yes`/`-y` is explicit; `--dry-run` prints planned changed files without writing. `strict` is rejected unless `--allow-strict` is explicit.

## `baseline`

`baseline` creates or updates the configured baseline path through `guard --scope all --baseline update`. Path priority matches guard: CLI `--baseline-path`, then profile `baseline.path`, then `.jhste/baseline.json`. The prompt and `--dry-run` changed-file list show the same path that guard will write, and paths resolving outside the repo fail with exit `3`. Invalid profiles fail before prompting. Non-interactive runs fail closed with exit `3` unless `--yes`/`-y` is explicit; `--dry-run` prints planned changed files without writing. Baseline creation does not enable strict mode. The file is a known-issues ledger/remediation queue with fingerprint, first/last seen, reason, and optional owner/expiry/fix-tracking fields; matched findings encountered in a selected guard scope are still shown until fixed.
