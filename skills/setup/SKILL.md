---
name: setup
description: Install jhste shared skills safely, connect adapters, create an advisory repo profile, install a managed advisory hook by default, and add only idempotent bridge blocks. Use when setting up a machine or connecting a repository to this kit.
---

# setup

Use this skill when installing or updating the shared jhste skills kit.

## Safety rules

1. Repo-local `AGENTS.md`, `CLAUDE.md`, and docs remain authoritative.
2. Do not delete or rewrite existing repository instructions.
3. Do not modify CI, target `package.json`, or lockfiles during default install. A managed advisory pre-commit hook may be installed unless the user opts out.
4. Default profile mode is `advisory`; `strict` requires explicit opt-in.
5. Keep modified `.jhste/profile.yaml` by default; generated/managed profiles may be refreshed with `--force`, while modified profiles require `--force --allow-profile-overwrite`. Keep unmanaged local skill copies unless the user explicitly allows unmanaged overwrite.

## References

- `references/setup-flow.md`
- `references/conflict-policy.md`
