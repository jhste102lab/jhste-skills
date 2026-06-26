# Crawler and automation reference

Crawler and automation systems are easiest to maintain when production, handoff, and consumption are distinct. A producer can fetch, normalize, and emit an artifact. A consumer can validate, deduplicate, and persist according to its own policy.

Routine validation should use fixtures, dry runs, or focused smoke checks. Live automation jobs can be monitored, but they should not be the only proof that a code change works.

## Producer / consumer recipe

- Bad: a crawler fetches pages, normalizes fields, deduplicates, writes the database, and sends notifications in one loop.
- Better: the producer emits a versioned artifact; the consumer validates, deduplicates, persists, and reports write outcomes with a resumable cursor.
- Why: flaky network behavior is separated from write safety, fixtures can replay artifacts, and duplicate writes are easier to prevent.
