# SOLID-informed lens (shared doctrine)

Single source of truth for SOLID discipline across the jhste skills. Cited by `jhste-engineering-groundwork`, `jhste-code-quality`, `jhste-architecture-review`, and `jhste-red-team-review`. Use SOLID as a review lens for concrete maintenance and failure risks, **not** as a compliance checklist and never as a reason to add abstraction that only renames a call. Guard findings for these families are review candidates, not proof.

Each changed function, module, or class should have one main responsibility and one main reason to change.

- **SRP — responsibility.** Name one responsibility per changed unit. Split only when responsibilities change for independent reasons; splitting to maximize file count increases reader navigation cost without reducing change surface.
- **OCP — extension boundary.** Review a registry/strategy/adapter/policy table only when new variants force repeated edits to the same core branching. Keep the explicit branch when it is the clearest domain model; avoid premature abstraction.
- **LSP — substitutability.** Preserve caller-visible return shape, nullability, error behavior, and side-effect expectations across subtypes/implementations, or make the contract change explicit at the boundary with tests. There is no default guard proof; this is human review.
- **ISP — interface size.** Depend on the smallest useful contract; do not accept a broad config/interface/props bag while using a small slice. Keep cohesive public contracts together when they are read and changed as one unit. Human review, no default guard proof.
- **DIP — dependency direction.** Keep high-level policy from directly owning concrete DB/API/browser/filesystem/email/payment/queue effects; put them behind a repository, adapter, injected dependency, or an intentionally local, visible, testable boundary.

## Bad / better / why skeletons

### SOLID-informed design review
- Bad: treat SOLID as a compliance checklist and add interfaces, registries, strategies, or wrappers that only rename calls.
- Better: use SOLID as a lens — SRP names one responsibility, OCP looks for extension boundaries, LSP checks caller contracts, ISP keeps contracts right-sized, DIP makes concrete side effects visible.
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
