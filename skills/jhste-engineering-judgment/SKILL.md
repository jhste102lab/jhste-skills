---
name: jhste-engineering-judgment
description: "Pre-change engineering judgment for non-trivial code work: verify user premises against repo instructions and code, reject unnecessary scope expansion, identify ownership seams, failure paths, data contracts, and safer alternatives before implementing."
---

# jhste-engineering-judgment

Use before non-trivial code changes. Repo-local instructions and architecture docs remain authoritative.

## Contract

- Restate the goal in concrete terms and reject unnecessary scope expansion.
- Check the user's premise against code, tests, and repo-local instructions before accepting it.
- Before editing, produce a short evidence block for non-trivial code changes.
- Identify the ownership seam: UI, route/controller, usecase/service, repository/query, adapter, job, script, or test fixture.
- List the important failure paths before writing code.
- State the data contract entering and leaving the changed seam.
- Prefer the smallest change that preserves future extension.
- If the requested implementation conflicts with repo architecture, say so directly and propose the safer alternative.
- Do not praise, agree, or proceed based on unsupported assumptions.
- Avoid unrelated refactors unless they are on the changed execution path and required for safety.

## Required pre-edit evidence block

For non-trivial code changes, state this before editing:

1. **Goal** — concrete behavior or safety property being changed.
2. **Evidence inspected** — repo instructions, issue/PR context, files, tests, and code paths actually inspected.
3. **Ownership seam** — the smallest module boundary being changed.
4. **Data in/out** — inputs entering the seam and outputs/errors leaving it.
5. **Failure paths** — important ways this can fail or mislead users/tools.
6. **Rejected scope** — adjacent refactors or old problems intentionally not touched.
7. **Smallest safe change** — why the planned change is minimal.
8. **Verification plan** — tests, guards, builds, or manual checks to run, plus any checks likely to be skipped.

If a premise was not checked, say **not checked**. Do not write "not found" unless you actually inspected the relevant path.

## Shape guidance

For common structures, read `references/structure-templates.md` and follow the closest template unless repo-local conventions say otherwise.
