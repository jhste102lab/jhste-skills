# Public safety checklist

Before release, confirm:

- public docs and skill text contain no private reference repository names;
- no private local paths are present;
- no private DB/API details are present;
- no real secret/env values, tokens, private keys, cookies, or authorization header values are present;
- examples use generic web app, API route, database, and crawler/automation terms;
- default setup does not modify CI, target `package.json`, lockfiles, or source code; Normal may install a managed advisory pre-commit hook unless `--skip-hooks` is used, Full may install managed advisory pre-commit/pre-push hooks, and all modes refuse to overwrite non-managed hooks;
- default profile mode is `advisory`, including the default 300-line file-size policy unless a user disables or changes it;
- deep scan is optional and does not modify source code;
- recommended profile is not applied without user approval;
- strict mode requires explicit opt-in;
- Matt skills have allowlist, source lock, and license attribution;
- cleanup/search-replace guidance does not encourage broad writes from raw search results;
- protected docs/examples/tests/fixtures/snapshots/generated outputs/reports/diffs/patches/history-like surfaces remain report-only unless explicitly targeted.

Optional local private patterns can be placed in `.jhste/private-safety-patterns.txt` (one literal fragment per line, `#` comments allowed). The file is ignored and skipped by the checker; matches are reported without echoing the private fragment. If the file is absent, generic secret-like filename, token, credential, and local-path checks still run.

Run:

```bash
npm run public-safety:check
npm run vendor:check
npm run docs:check
npm run release:gates
```
