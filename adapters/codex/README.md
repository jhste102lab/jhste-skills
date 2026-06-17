# Codex adapter

The Codex adapter keeps repository instructions authoritative and uses a short bridge block in `AGENTS.md` when that file already exists.

Bridge block:

```md
## Agent skills
This repo uses jhste skills as shared guidance.
Repo-local instructions in this file remain authoritative.
See `.jhste/profile.yaml` for local skill preferences.
```

Default install copies skills to a kit-managed skill directory and does not delete or rewrite existing Codex skills.
