# Structure templates

Use these as defaults, not as mandatory architecture. Prefer repo-local names and existing seams.

## API route

- `route.ts` or controller: auth + input parse + usecase call + public response mapping only.
- `schema.ts`: request and response contracts.
- `usecase.ts` or service: domain decision and permission-sensitive workflow.
- `repository.ts` or query module: persistence details and storage-shaped rows.
- `errors.ts`: public-safe error codes and redacted diagnostics mapping.

## React client path

- Server/page module: load or pass already-shaped data.
- Client module: interaction state only.
- `useXxx` hook: async state and mutations.
- `XxxView`: pure rendering and empty/loading/error presentation.
- `adapter.ts`: browser APIs, local storage, or network seams.

## Script or import pipeline

- CLI parse: arguments and config validation.
- Loader: file/network input and raw artifact capture.
- Transform: pure normalization and validation.
- Persist: bounded writes, dedupe, transaction or retry plan.
- Report: summary, redacted diagnostics, and exit status.

## Crawler or automation

- Producer: fetch, normalize, and emit artifact with metadata.
- Handoff contract: schema, provenance, timestamp, and validation status.
- Consumer: validate, dedupe, and persist according to storage policy.
- Runtime adapter: browser/network/clock/sleep effects are explicit and replaceable.

## Generic module or function

- Module: one named responsibility and one main reason to change.
- Function: either one cohesive policy/transform or thin orchestration over named seams.
- Compatibility facade: allowed only when it contains no policy and prevents import churn during refactors.
- Avoid: shared utility buckets that mix parsing, git/repo discovery, filesystem IO, prompting, rendering, and templates.
