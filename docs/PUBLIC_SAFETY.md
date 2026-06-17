# Public safety checklist

Before release, confirm:

- public docs and skill text contain no private reference repository names;
- no private local paths are present;
- no private DB/API details are present;
- no real secret/env values, tokens, private keys, cookies, or authorization header values are present;
- examples use generic web app, API route, database, and crawler/automation terms;
- default setup does not modify CI, hooks, target `package.json`, or lockfiles;
- default profile mode is `advisory`;
- deep scan is optional and does not modify source code;
- recommended profile is not applied without user approval;
- strict mode requires explicit opt-in;
- Matt skills have allowlist, source lock, and license attribution.

Run:

```bash
npm run public-safety:check
npm run vendor:check
npm run docs:check
```
