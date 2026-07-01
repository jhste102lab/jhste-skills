# Review card: architecture

Selected by `jhste-change-review` when a change touches module boundaries, responsibility splits, side-effect placement, or abstraction. Owns changed-architecture failure modes only; the shared loop lives in `../core-loop.md`, the SOLID lens in `../solid-lens.md`.

Good boundaries reduce repeated explanations for AI agents and humans. Prefer modules that own a real decision, policy, or side-effect boundary. Be skeptical of wrappers that only rename a call.

When reviewing a proposed change, ask:

- Which layer should own the decision?
- What side effect becomes easier to test or replace?
- Does this module hide complexity or merely pass it through?
- Are repo-local docs using a more specific term or rule?
- Where do caller contracts, mutation safety, or hot-path performance assumptions belong so they stay visible instead of leaking across boundaries?
- Which SOLID-informed question is actually relevant? Apply the shared lens in `../solid-lens.md` rather than restating it here.
- Do the proposed files change independently, or do they always move together as one cohesive contract?
- Would the split reduce the number of files touched for a typical change, or merely make readers chase more files?

## Bad / better / why skeletons

### Next.js or API route split
- Bad: `route.ts` performs auth, schema parsing, business rules, database queries, error mapping, and response DTO shaping inline.
- Better: route/controller does request parsing and response mapping; a usecase owns business invariants; a repository/query owns persistence; errors are mapped through a small public-error boundary.
- Why: caller contracts, authorization, failure behavior, and test boundaries are easier to inspect from entrypoint to side effect.

### React client path split
- Bad: a page or client module mixes fetches, cache keys, mutation calls, derived model mapping, modal state, and presentation.
- Better: loader/hook/adapter/view each own one decision: data acquisition, client state, external API shape, and rendering.
- Why: loading/empty/error states and duplicate-fetch risks can be tested without reviewing unrelated UI details.

### Generic module or function split
- Bad: a shared module exports argument parsing, git discovery, file copying, prompts, profile templates, and reporting helpers because they were all convenient to import from one place.
- Better: each module owns one responsibility such as argument parsing, repository discovery, filesystem operations, prompting, or rendering; keep a compatibility facade only when it contains no policy and prevents churn.
- Why: maintainers can name one reason to change the module, while callers do not learn unrelated helpers.

### Over-fragmented contract split
- Bad: a cohesive feature contract is split into separate `*-types`, `*-select`, `*-mapper`, `*-aliases`, and tiny wrapper files that are hard to understand alone and usually change in the same commit.
- Better: keep type, select/shape alias, mapper, and small constants together when they describe one caller-facing contract; split only the independently changing query, policy, side effect, or behavior boundary.
- Why: SRP is about independent reasons to change, not maximizing file count; good splits reduce change surface and test scope without increasing reader navigation cost.

### Function responsibility split
- Bad: one function parses input, validates it, reads files, transforms data, writes output, prints a report, and decides exit behavior.
- Better: keep orchestration thin and move parsing, validation, side effects, transformation, and reporting behind named functions or modules when those responsibilities change independently.
- Why: tests can target the responsibility that changed, and side effects stay visible at the boundary that owns them.
