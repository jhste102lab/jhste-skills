# Architecture review reference

Good boundaries reduce repeated explanations for AI agents and humans. Prefer modules that own a real decision, policy, or side-effect seam. Be skeptical of wrappers that only rename a call.

When reviewing a proposed change, ask:

- Which layer should own the decision?
- What side effect becomes easier to test or replace?
- Does this module hide complexity or merely pass it through?
- Are repo-local docs using a more specific term or rule?
