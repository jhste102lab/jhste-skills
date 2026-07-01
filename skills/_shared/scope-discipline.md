# Scope and bounded-fix discipline (shared doctrine)

Single source of truth for change-scope and fix-loop discipline across the jhste skills. Cited by `jhste-engineering-groundwork` (pre-change) and `jhste-red-team-review` (post-change).

## Adjacent-code scope

Change adjacent code only when it sits on the changed execution path and leaving it untouched creates a concrete failure mode. Otherwise record the follow-up (see `issue-candidate.md`) instead of widening the change. Reject scope expansion the request does not require.

## Bounded fix loop

Treat new guard or review warnings on changed files as **bounded fix** candidates when the fix stays inside the changed execution path. After a fix, rerun guard/verification. Do not commit automatically; commit/push stays an explicit user-requested action.

Stop after at most two fix + re-review cycles. Ask before large rewrites, product decisions, destructive migrations, or risks that cannot be judged safely.
