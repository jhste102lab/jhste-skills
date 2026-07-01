---
name: handoff
description: Compact the current conversation into a handoff document for another agent. Use when the user asks for a handoff, session summary, continuation brief, or next-agent context.
argument-hint: "What will the next session be used for?"
---

## jhste compatibility

- Repo-local instructions remain authoritative.
- Use `jhste-preflight` for scope, boundaries, assumptions, and failure paths when it applies.
- Vocabulary in this vendored skill is advisory unless adopted by repo-local docs; do not rename established repo concepts only to match this skill.
- File, repo, command, issue, PR, or other external side effects are allowed when the user directly requested that workflow or repo-local standing approval covers it. Ask for destructive, irreversible, ambiguous, production, secret, cost-bearing, broad existing-item, or out-of-scope changes.


Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.

When the user asks for a handoff, session summary, continuation brief, or next-agent context, create the handoff artifact without additional confirmation. Save it outside the workspace unless the user explicitly asks for a repo file.

Include a "suggested skills" section in the document, which suggests skills that the agent should invoke.

Do not duplicate content already captured in other artifacts (PRDs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
