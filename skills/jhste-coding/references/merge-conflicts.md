# Merge and Rebase Conflicts

Use this branch only when a merge or rebase is already in progress and resolving the conflict is part of the requested implementation work.

1. Inspect the current Git state, conflicting paths, and relevant history before editing conflict markers.
2. Recover the intent of both sides from the nearest authoritative evidence: commits, pull requests, issues, tests, and surrounding code. Treat either side of a conflict as evidence, not automatic truth.
3. Preserve both intents when they are compatible. When they are not, choose the result that satisfies the current change contract and established repository decisions. Do not invent unrelated behavior merely to make the conflict disappear.
4. Keep the resolution scoped to the conflict and any directly required compatibility repair. If the history exposes an unresolved product, security, data, or architecture decision, stop for the owning decision instead of guessing.
5. Run the repository-native signal that best proves the integrated result, then continue or complete the merge/rebase only to the extent authorized by the request.

Aborting or restarting is allowed when the current operation is based on the wrong branch, stale assumptions, or an unsafe state; do not force completion merely because a conflict exists.
