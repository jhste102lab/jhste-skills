---
name: jhste-crawler-automation
description: "Automation review for crawlers, workers, schedulers, browser effects, artifact handoff, and idempotent retry."
---

# jhste-crawler-automation

Fires for crawler, scraper, worker, scheduler, or browser-automation changes so their reliability checks stay visible. Runs inside `../_shared/core-loop.md`. Repo-local operational constraints remain authoritative.

## Owns

Apply `../_shared/review-cards/automation.md` to the changed path:

- producer creates artifacts + a documented handoff; consumer owns storage mutation;
- no dependence on a live scheduled run as the only routine validation path;
- browser, network, filesystem, clock, sleep, and notification effects visible and testable behind boundaries;
- idempotent retry;
- raw sensitive payloads stored only under an explicit repo policy.

Verify the handoff through the consumer-facing path when feasible: artifact shape, documented handoff location, idempotent retry, and the consumer-side mutation boundary.

## Delegates to

Common loop → `../_shared/core-loop.md`; approval boundaries → `../_shared/side-effect-policy.md`.

## Does not own

General code-quality or architecture review (`jhste-change-review`); post-change verdict (`jhste-redteam`).

## References

- `../_shared/review-cards/automation.md`
- `../_shared/core-loop.md`
- `../../rules/crawler/crawler_producer_boundary.yaml`
- `../../rules/core/side_effect_boundary.yaml`
