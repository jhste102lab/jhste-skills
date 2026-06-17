---
name: setup
description: Install jhste shared skills safely, connect adapters, create an advisory repo profile, and add only idempotent bridge blocks. Use when setting up a machine or connecting a repository to this kit.
---

# setup

Use this skill when installing or updating the shared jhste skills kit.

## Safety rules

1. Repo-local `AGENTS.md`, `CLAUDE.md`, and docs remain authoritative.
2. Do not delete or rewrite existing repository instructions.
3. Do not modify CI, git hooks, target `package.json`, or lockfiles during default install.
4. Default profile mode is `advisory`; `strict` requires explicit opt-in.
5. Ask before overwriting an existing `.jhste/profile.yaml` or local skill copy.

## References

- `references/setup-flow.md`
- `references/conflict-policy.md`
