---
name: jhste-engineering-judgment
description: "Pre-change engineering judgment for non-trivial code work: verify user premises against repo instructions and code, reject unnecessary scope expansion, identify ownership seams, failure paths, data contracts, and safer alternatives before implementing."
---

# jhste-engineering-judgment

Use before non-trivial code changes. Repo-local instructions and architecture docs remain authoritative.

## Contract

- Restate the goal in concrete terms and reject unnecessary scope expansion.
- Check the user's premise against code, tests, and repo-local instructions before accepting it.
- Identify the ownership seam: UI, route/controller, usecase/service, repository/query, adapter, job, script, or test fixture.
- List the important failure paths before writing code.
- State the data contract entering and leaving the changed seam.
- Prefer the smallest change that preserves future extension.
- If the requested implementation conflicts with repo architecture, say so directly and propose the safer alternative.
- Do not praise, agree, or proceed based on unsupported assumptions.

## Shape guidance

For common structures, read `references/structure-templates.md` and follow the closest template unless repo-local conventions say otherwise.
