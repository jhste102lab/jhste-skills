# CLI behavior

## `install`

`install` is the fast safe setup path.

```bash
npx jhste-skills install
node cli/install.mjs --yes --repo /path/to/repo
node cli/install.mjs --yes --repo /path/to/repo --hooks advisory
```

Default behavior:

Install can also ask about hook automation in interactive mode. Enter skips hooks, `a` installs advisory hooks, and `b` installs blocking hooks. Non-interactive installs skip hooks unless `--hooks advisory|blocking` is explicit.


- one main prompt;
- selected skills copied to a kit-managed skill directory;
- `.jhste/profile.yaml` created with `mode: advisory` when missing;
- existing profile is not overwritten unless `--force` is explicit;
- `AGENTS.md` and `CLAUDE.md` bridge blocks are appended only when the file exists and the exact block is missing;
- CI, target `package.json`, and lockfiles are not changed. Hooks are installed only when the interactive prompt selects them or `--hooks advisory|blocking` is passed.

## `deep-scan`

`deep-scan` is opt-in and read-only for source code. It writes only jhste output files:

- `.jhste/deep-scan-report.md`
- `.jhste/profile.recommended.yaml`

It excludes generated, vendor, build, dependency, lock, large binary-like, and secret/env-like files. Secret-like findings are reported only as redacted summaries.

The report includes responsibility budget candidates for large or mixed-responsibility pages, client modules, routes/controllers, import/ops scripts, and Python orchestrators. These are advisory review prompts by default and do not prove a file is wrong.

## `guard`

`guard` is the repeatable changed-file checker. It is read-only unless `--baseline update` writes `.jhste/baseline.json`.

```bash
jhste-skills guard --scope changed --format text --fail-on error
jhste-skills guard --scope staged --format json
jhste-skills guard --scope all --baseline use
jhste-skills guard --scope files-from --files-from /tmp/files.zlist
```

Stable contract:

- `--scope`: one of `changed`, `staged`, `all`, `files-from`. `changed` means committed diff from base/head plus unstaged, staged, and untracked files; `staged` means staged files only.
- `--format`: `text` for humans or schema-versioned `json` for AI/hooks/CI.
- `--fail-on`: `none`, `warning`, or `error`.
- `--baseline`: `off`, `use`, `update`, or `ratchet`. `ratchet` requires an existing baseline. `update` is refused when guard runtime failures occur.
- exit `0`: pass; exit `1`: violations met `--fail-on` or ratchet found new issues; exit `2`: guard runtime/scope/scan failure; exit `3`: config/profile error.

The JSON output starts with:

```json
{
  "schema_version": 1,
  "summary": { "error": 0, "warning": 0, "info": 0, "suppressed": 0, "failures": 0 },
  "meta": {
    "tool_version": "0.1.0",
    "scope": "changed",
    "files_considered": 0,
    "files_scanned": 0,
    "duration_ms": 0
  },
  "violations": []
}
```

Guard failures are not validation success. AI agents should report exit `2` or `3` separately from rule violations.

## `hooks`

`hooks` is opt-in automation for local git hooks. It is intentionally separate from `install`.

```bash
jhste-skills hooks install --mode advisory
jhste-skills hooks install --mode blocking --fail-on error
jhste-skills hooks install --hook all --mode advisory
jhste-skills hooks doctor
jhste-skills hooks uninstall --hook all
```

Safety contract:

- quick install never installs hooks;
- default hook is `pre-commit` in advisory mode;
- advisory hooks print guard output but do not block commits;
- blocking hooks return the guard exit code;
- existing non-managed hooks are never overwritten;
- uninstall removes only hooks marked as managed by this tool.

## `tune`

`tune` shows that the recommended profile is separate, then applies non-strict pack/rule recommendations only after user approval. `strict` is rejected unless `--allow-strict` is explicit.

## `baseline`

`baseline` creates or updates `.jhste/baseline.json` through `guard --scope all --baseline update`. Baseline creation does not enable strict mode. The file stores stable guard fingerprints so existing debt can be separated from new violations.
