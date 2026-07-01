---
name: jhste-change-review
description: "Changed-path quality and design review for external input, failure handling, logging, module boundaries, responsibility splits, and side effects."
---

# jhste-change-review

Quality and design review of the code you just changed. Runs inside `../_shared/core-loop.md` (after editing, alongside guard; before `jhste-redteam`). Repo-local instructions remain authoritative.

Keep this skill thin: select only the review cards the change actually touches, then apply them to the changed execution path. Do not load every card by default.

## Card selection

Pick cards from the touched files and the changed execution path:

- external input / failure handling / logging / cleanup / tests → `../_shared/review-cards/code-quality.md`
- module boundary / responsibility split / side-effect placement / abstraction → `../_shared/review-cards/architecture.md`
- route / controller / service / repository / SQL / DTO / auth / tenant → route to `jhste-db-api-boundary` (card `../_shared/review-cards/api-db.md`)
- crawler / scraper / worker / scheduler / browser / filesystem / artifact → route to `jhste-crawler-automation` (card `../_shared/review-cards/automation.md`)

The API/DB and automation domains keep their own trigger skills so their safety checks fire reliably; hand off when the change is mostly in those domains.

## Owns

- selecting the relevant card(s) for the changed path;
- naming one main responsibility per changed class/module/function and rejecting adjacent scope;
- oversized responsibility as a review signal — split before adding more when a unit crosses the profile budget.

## Delegates to

- common loop → `../_shared/core-loop.md`
- SOLID lens → `../_shared/solid-lens.md`
- adjacent scope + bounded fix → `../_shared/scope-discipline.md`
- proof vs not-checked → `../_shared/evidence-discipline.md`

## Does not own

Pre-edit grounding (`jhste-preflight`); final read-only completion review and verdict (`jhste-redteam`).

## References

- `../_shared/review-cards/code-quality.md`
- `../_shared/review-cards/architecture.md`
- `../_shared/review-cards/api-db.md`
- `../_shared/review-cards/automation.md`
- `../_shared/core-loop.md`
- `../_shared/solid-lens.md`
- `../../rules/core/no_silent_failure.yaml`
- `../../rules/core/no_secret_logging.yaml`
- `../../rules/core/external_input_validation.yaml`
- `../../rules/core/file_size_advisory.yaml`
- `../../rules/core/responsibility_budget.yaml`
- `../../rules/core/single_responsibility_advisory.yaml`
- `../../rules/core/side_effect_boundary.yaml`
