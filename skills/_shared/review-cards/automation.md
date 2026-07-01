# Review card: automation / crawler

Selected by `jhste-crawler-automation` when a change touches crawlers, scrapers, workers, schedulers, or browser automation. Owns automation failure modes only; the shared loop lives in `../core-loop.md`.

Crawler and automation systems are easiest to maintain when production, handoff, and consumption are distinct. A producer can fetch, normalize, and emit an artifact. A consumer can validate, deduplicate, and persist according to its own policy; consumer storage mutation belongs on the consumer side.

Routine validation should use fixtures, dry runs, or focused smoke checks. Live automation jobs can be monitored, but they should not be the only proof that a code change works.

Browser, network, filesystem, clock, sleep, and notification effects should be visible and testable behind boundaries. Store raw sensitive payloads only when the repo has an explicit policy for doing so.

## Producer / consumer recipe

- Bad: a crawler fetches pages, normalizes fields, deduplicates, writes the database, and sends notifications in one loop.
- Better: the producer emits a versioned artifact; the consumer validates, deduplicates, persists, and reports write outcomes with a resumable cursor.
- Why: flaky network behavior is separated from write safety, fixtures can replay artifacts, and duplicate writes are easier to prevent.

Verify the handoff through the consumer-facing path when feasible: produced artifact shape, documented handoff location, idempotent retry behavior, and the consumer-side mutation boundary.
