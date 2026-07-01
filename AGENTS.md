# jhste-skills repo instructions

This file is authoritative for work in this repository. Detailed jhste workflow policy lives in the installed skills and their `skills/_shared/` docs, not here.

Use `ask-jhste` as the router for jhste coding, review, setup, and workstate workflows. For non-trivial code changes in this repo: `jhste-preflight` before editing, `jhste-skills guard --scope changed` and `jhste-change-review` on the changed path, then `jhste-redteam` before completion.

For reversible, in-scope choices, make a reasonable assumption, proceed, and report it. Ask first before destructive, irreversible, production, secret-bearing, cost-bearing, commit, push, release, publish, or broad out-of-scope actions — the boundary lives in `skills/_shared/side-effect-policy.md`.

## Repo-local specifics

- Keep commit-time hook behavior fast, read-only, and loop-safe.
- This kit ships the skills, `_shared` docs, review cards, rules, and CLI. When you rename a skill or change a shared-doc anchor, update `scripts/docs-check-data.mjs`, `scripts/docs-check.mjs`, and the smoke tests in the same change.

<!-- jhste-skills:start -->
## Agent skills
This repo uses jhste skills as installed workflow guidance.
Repo-local instructions in this file remain authoritative.
Use `ask-jhste` as the router for jhste coding, review, setup, and workstate workflows; detailed policy lives in the installed skills and their `_shared` docs, not this block.
For non-trivial code changes: run `jhste-preflight` before editing, `jhste-skills guard --scope changed` and `jhste-change-review` on the changed path, then `jhste-redteam` before completion.
Before destructive, irreversible, production, secret-bearing, cost-bearing, commit, push, release, publish, or broad out-of-scope actions, follow repo-local instructions and the side-effect policy in the installed skills directory's `_shared/side-effect-policy.md`.
See `.jhste/profile.yaml` for local skill preferences.
<!-- jhste-skills:end -->
