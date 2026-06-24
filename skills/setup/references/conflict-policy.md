# Conflict policy reference

Priority order:

1. Explicit user instruction.
2. Current repo `AGENTS.md`, `CLAUDE.md`, and docs.
3. `.jhste/profile.yaml`.
4. jhste shared skills.
5. General clean-code principles.

When a local skill or profile already exists, keep it by default. Generated/managed profiles may be refreshed with `--force`; modified profiles require `--force --allow-profile-overwrite`. If local skill content differs and is not manifest-managed, show the path and require the explicit unmanaged overwrite flag before overwriting. A bridge block must be idempotent, must state that repo-local instructions remain authoritative, and should keep completion-time red-team review guidance short and explicit.
