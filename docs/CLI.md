# CLI behavior

## `install`

`install` is the fast safe setup path.

```bash
npx jhste-skills install
node cli/install.mjs --yes --repo /path/to/repo
```

Default behavior:

- one main prompt;
- selected skills copied to a kit-managed skill directory;
- `.jhste/profile.yaml` created with `mode: advisory` when missing;
- existing profile is not overwritten unless `--force` is explicit;
- `AGENTS.md` and `CLAUDE.md` bridge blocks are appended only when the file exists and the exact block is missing;
- CI, hooks, target `package.json`, and lockfiles are not changed.

## `deep-scan`

`deep-scan` is opt-in and read-only for source code. It writes only jhste output files:

- `.jhste/deep-scan-report.md`
- `.jhste/profile.recommended.yaml`

It excludes generated, vendor, build, dependency, lock, large binary-like, and secret/env-like files. Secret-like findings are reported only as redacted summaries.

## `tune`

`tune` shows that the recommended profile is separate, then applies non-strict pack/rule recommendations only after user approval. `strict` is rejected unless `--allow-strict` is explicit.

## `baseline`

`baseline` creates `.jhste/baseline.json` from an existing deep scan report. Baseline creation does not enable strict mode.
