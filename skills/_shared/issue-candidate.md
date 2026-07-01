# Issue candidate protocol (shared doctrine)

Single source of truth for the `Issue candidate` handoff across the jhste skills. Cited by `jhste-preflight` and `jhste-redteam`.

Emit an `Issue candidate` only for actionable, material follow-up that warrants separate tracking — work that is likely to be forgotten, or introduced by the change. Prefer no candidate over low-value issue spam. Default to report-only for pre-existing, low-impact, heuristic-only, or unlikely-to-be-lost findings.

Ask for **explicit approval** before creating or updating any tracker item, unless the user directly requested that tracker workflow or repo-local standing approval covers it. State why tracking is warranted before asking.

Label heuristic findings as candidates, not proof. Never include raw secrets, tokens, credentials, or private data in issue text.

## Shape

- **Title** — concise tracker-ready title.
- **Existing issue search** — search terms used, or the likely matching issue and why it matches.
- **Affected paths** — files, commands, or docs involved.
- **Evidence** — what was inspected; state **not checked** for missing coverage.
- **Failure mode** — concrete behavior that can mislead, fail, or create risk.
- **Impact** — user, maintainer, safety, or release consequence.
- **Confidence** — high/medium/low and whether the finding is a heuristic.
- **Smallest safe fix** — minimal likely remediation.
- **Acceptance criteria** — observable done conditions.
- **Redaction note** — confirm secrets/private data are omitted.
- **Suggested action** — `new issue`, `update existing issue`, or `no issue`.
