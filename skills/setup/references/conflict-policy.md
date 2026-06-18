# Conflict policy reference

Priority order:

1. Explicit user instruction.
2. Current repo `AGENTS.md`, `CLAUDE.md`, and docs.
3. `.jhste/profile.yaml`.
4. jhste shared skills.
5. General clean-code principles.

When a local skill or profile already exists, keep it by default. If content differs, show the path and require explicit approval before overwriting. A bridge block must be idempotent, must state that repo-local instructions remain authoritative, and should keep completion-time final-review guidance short and explicit.
