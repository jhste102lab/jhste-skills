# Crawler and automation reference

Crawler and automation systems are easiest to maintain when production, handoff, and consumption are distinct. A producer can fetch, normalize, and emit an artifact. A consumer can validate, deduplicate, and persist according to its own policy.

Routine validation should use fixtures, dry runs, or focused smoke checks. Live automation jobs can be monitored, but they should not be the only proof that a code change works.
