# Architecture review reference

Good boundaries reduce repeated explanations for AI agents and humans. Prefer modules that own a real decision, policy, or side-effect boundary. Be skeptical of wrappers that only rename a call.

When reviewing a proposed change, ask:

- Which layer should own the decision?
- What side effect becomes easier to test or replace?
- Does this module hide complexity or merely pass it through?
- Are repo-local docs using a more specific term or rule?
- Where do caller contracts, mutation safety, or hot-path performance assumptions belong so they stay visible instead of leaking across boundaries?
- Which SOLID-informed question is actually relevant: SRP responsibility, OCP extension boundary, LSP caller contract, ISP contract size, or DIP dependency direction?
- Does repeated variant/provider/policy branching force core edits, or is the explicit branch still the clearest domain model?
- Does an implementation weaken return shape, nullability, error behavior, side-effect expectations, or documented invariants promised to callers?
- Is a caller coupled to a broad config/interface/props bag it barely uses, or is that bag one cohesive public contract?
- Does high-level policy directly own concrete DB/API/browser/filesystem/email/payment effects without an intentional visible boundary?
- Do the proposed files change independently, or do they always move together as one cohesive contract?
- Would the split reduce the number of files touched for a typical change, or merely make readers chase more files?

## Bad / better / why skeletons

### Next.js or API route split

- Bad: `route.ts` performs auth, schema parsing, business rules, database queries, error mapping, and response DTO shaping inline.
- Better: route/controller does request parsing and response mapping; a usecase owns business invariants; a repository/query owns persistence; errors are mapped through a small public-error boundary.
- Why: caller contracts, authorization, partial-failure handling, and test boundaries are easier to inspect from entrypoint to side effect.

### React client path split

- Bad: a page or client module mixes fetches, cache keys, mutation calls, derived model mapping, modal state, and presentation.
- Better: loader/hook/adapter/view each own one decision: data acquisition, client state, external API shape, and rendering.
- Why: loading/empty/error states and duplicate-fetch risks can be tested without reviewing unrelated UI details.

### Adjacent-code scope limit

Change adjacent code only when it sits on the changed execution path and leaving it unchanged creates a concrete failure mode. Otherwise record an issue candidate instead of expanding the refactor.

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

### SOLID-informed design review

- Bad: treat SOLID as a compliance checklist and add interfaces, registries, strategies, or wrappers that only rename calls.
- Better: use SOLID as a review lens: SRP names one responsibility, OCP looks for extension boundaries, LSP checks caller contracts, ISP keeps contracts right-sized, and DIP makes concrete side effects visible.
- Why: the useful outcome is lower change risk and clearer boundaries, not more abstraction.

### Extension boundary review

- Bad: every new provider, channel, variant, or policy requires editing the same core branching in several places.
- Better: review whether a registry, strategy, adapter, or explicit policy table would localize new variants; keep the branch when it is the clearest domain model.
- Why: OCP is about reducing repeated core edits, not hiding simple logic behind premature abstraction.

### Dependency boundary review

- Bad: service or policy code creates concrete database, payment, email, filesystem, browser, or network clients inline while also owning business decisions.
- Better: put concrete side effects behind a repository, adapter, injected dependency, or intentionally local boundary with tests around the caller-visible behavior.
- Why: DIP keeps high-level policy testable and replaceable without forcing every caller to know infrastructure details.

### Substitutability review

- Bad: a subtype or implementation returns a different shape, weakens nullability guarantees, throws unsupported errors, or skips promised side effects.
- Better: preserve the caller-visible contract or make the contract change explicit at the boundary with tests.
- Why: LSP risk is about broken caller expectations, and static pattern matching alone cannot prove it.

### Interface segregation review

- Bad: a caller accepts a broad config, interface, or props bag while using only a small slice, creating unrelated coupling.
- Better: depend on the smallest useful contract, while keeping cohesive public contracts together when they are read and changed together.
- Why: ISP should reduce coupling, not fragment a contract that always moves as one unit.

