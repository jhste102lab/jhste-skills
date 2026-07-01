# Evidence discipline (shared doctrine)

Single source of truth for proof/evidence discipline across the jhste skills. Cited by `jhste-preflight` (pre-change) and `jhste-redteam` (post-change).

## Not found vs not checked

- **not found** — used only after inspecting the relevant path and seeing no problem.
- **not checked** — used for any premise or path outside the inspected scope. Never imply broad coverage you did not perform.

## What does not count as proof

Do not conclude `pass` or "safe" from any of these alone:

- old passes, prior review, or stated intent;
- summaries, partial artifacts, or internal reasoning;
- test output or guard output by itself.

Guard and heuristic findings are review candidates, not proof. Label heuristic findings (including regex matches) as candidates.

## Preferred proof

Prefer proof through the **actual consumer path** when feasible: public API route, CLI command, UI route, worker/scheduler path, service entrypoint, fresh-client flow, or documented acceptance path. When consumer-path proof is not feasible, say so and give the reason.

## Keep these separate in any report

- **current proof** — checks actually run now (tests, builds, guards, direct inspection, consumer/acceptance path);
- **checks intentionally skipped** — and why;
- **checks not run / not checked** — scope not inspected;
- **guard runtime/config failures** — distinct from rule violations;
- **residual risk** — what still might be wrong.
