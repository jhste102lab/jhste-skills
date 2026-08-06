# Durable Implementation Handoff

Follow the repository's existing convention. When none exists, start with one file:

```text
docs/handoff/<work-slug>.md
```

Record only state that must remain shared across sessions or owners:

- objective, scope, current status, and exact next action;
- authoritative specifications, ADRs, domain context, issues, commits, and diffs;
- settled decisions, working assumptions, and executor discretion;
- current source state and unrelated changes;
- ownership, shared contracts, integration responsibility, and serialized resources;
- measurable remaining outcomes and important edge cases;
- verification evidence and the source state it covered;
- live activity, stable identifiers, and intervention rules; and
- remaining blockers and risks.

Omit empty sections. Add separate phase files only when outcomes have distinct ownership, real dependencies, independent verification value, or separate integration boundaries. Each phase needs one outcome, entry state, exit evidence, and next action.

Do not treat an uncommitted tree or parallel workers as blockers by themselves. Stop only when ownership cannot be distinguished, isolation is insufficient, or continuing would overwrite another workstream.

Update durable state at a material phase start, blocker or decision change, and verified phase completion. Avoid per-edit documentation churn. The active owner may update its section; the integration owner or finalizer verifies completion state.
