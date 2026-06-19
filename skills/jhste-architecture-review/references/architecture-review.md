# Architecture review reference

Good boundaries reduce repeated explanations for AI agents and humans. Prefer modules that own a real decision, policy, or side-effect seam. Be skeptical of wrappers that only rename a call.

When reviewing a proposed change, ask:

- Which layer should own the decision?
- What side effect becomes easier to test or replace?
- Does this module hide complexity or merely pass it through?
- Are repo-local docs using a more specific term or rule?
- Where do caller contracts, mutation safety, or hot-path performance assumptions belong so they stay visible instead of leaking across seams?

## Bad / better / why skeletons

### Next.js or API route split

- Bad: `route.ts` performs auth, schema parsing, business rules, database queries, error mapping, and response DTO shaping inline.
- Better: route/controller does request parsing and response mapping; a usecase owns business invariants; a repository/query owns persistence; errors are mapped through a small public-error seam.
- Why: caller contracts, authorization, partial-failure handling, and test seams are easier to inspect from entrypoint to side effect.

### React client path split

- Bad: a page or client module mixes fetches, cache keys, mutation calls, derived model mapping, modal state, and presentation.
- Better: loader/hook/adapter/view each own one decision: data acquisition, client state, external API shape, and rendering.
- Why: loading/empty/error states and duplicate-fetch risks can be tested without reviewing unrelated UI details.

### Adjacent-code scope limit

Change adjacent code only when it sits on the changed execution path and leaving it unchanged creates a concrete failure mode. Otherwise record an issue candidate instead of expanding the refactor.
