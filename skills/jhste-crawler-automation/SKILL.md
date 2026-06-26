---
name: jhste-crawler-automation
description: Advisory guidance for crawler and automation code, including producer/consumer boundaries, artifact handoff, routine validation, and side-effect boundaries. Use when touching crawlers, scrapers, browser automation, workers, or schedulers.
---

# jhste-crawler-automation

Use this skill when adding or reviewing crawler, scraper, worker, scheduler, or browser-automation code. Repo-local operational constraints remain authoritative.

## Checkpoints

- For non-trivial crawler or automation changes, apply `jhste-engineering-groundwork` before writing code.
- A producer should create artifacts and a documented handoff; consumer storage mutation belongs on the consumer side.
- Do not depend on a live scheduled crawler run as the only routine validation path.
- Browser, network, filesystem, clock, sleep, and notification effects should be visible and testable behind boundaries.
- Store raw sensitive payloads only when the repo has an explicit policy for doing so.
- Verify artifact handoff through the consumer-facing path when feasible: produced artifact shape, documented handoff location, idempotent retry behavior, and the consumer-side mutation boundary.

## References

- `references/crawler-automation.md`
- `../jhste-engineering-groundwork/SKILL.md`
- `../../rules/crawler/crawler_producer_boundary.yaml`
- `../../rules/core/side_effect_boundary.yaml`
