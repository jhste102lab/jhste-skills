# Matt Pocock skill vendoring

The kit vendors exactly 10 allowlisted Matt Pocock skills from [`mattpocock/skills`](https://github.com/mattpocock/skills).

Files:

- `vendor/matt-pocock/allowlist.json`
- `vendor/matt-pocock/source-lock.json`
- `vendor/matt-pocock/LICENSE`
- `vendor/matt-pocock/NOTICE.md`

Policy:

- Do not add skills outside the allowlist automatically.
- Do not update vendored skills without refreshing the source lock.
- Preserve license attribution.
- Review diffs before replacing local modified copies.

Run:

```bash
npm run vendor:check
```
