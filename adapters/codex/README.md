# Codex adapter

The Codex adapter keeps repository instructions authoritative and uses a short bridge block in `AGENTS.md` when that file already exists.

Bridge block:

```md
## Agent skills
This repo uses jhste skills as installed workflow guidance.
Repo-local instructions in this file remain authoritative.
Use `ask-jhste` as the router for jhste coding, review, setup, and workstate workflows; detailed policy lives in the installed skills and their `_shared` docs, not this block.
For non-trivial code changes: run `jhste-preflight` before editing, `jhste-skills guard --scope changed` and `jhste-change-review` on the changed path, then `jhste-redteam` before completion.
Before destructive, irreversible, production, secret-bearing, cost-bearing, commit, push, release, publish, or broad out-of-scope actions, follow repo-local instructions and the side-effect policy in the installed skills directory's `_shared/side-effect-policy.md`.
See `.jhste/profile.yaml` for local skill preferences.
```

Default install copies skills to a kit-managed skill directory and does not delete or rewrite existing Codex skills.

Explicit user instructions set task scope but do not silently override verified safety, privacy, data-loss, or repo-architecture constraints.
