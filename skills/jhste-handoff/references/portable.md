# Portable Handoff

Use one Markdown artifact in the harness's artifact or temporary-file location when possible. Tailor it to the next session's stated focus. If no focus is supplied, use the first incomplete material outcome rather than asking a routine question.

Include only material sections:

```markdown
# Handoff

## Next objective

## Current verified state

## Settled decisions

## Authoritative references

## Changed or owned resources

## Verification performed

## Remaining blocker or risk

## Exact first action

## Suggested skills
```

Omit empty sections. Suggested skills should be few and directly relevant to the next objective; do not recommend orchestration merely because workers were previously involved.

Redact API keys, passwords, tokens, private payloads, personally identifiable information, and unrelated sensitive data. Refer to secure locations or credential names without copying secret values.

Do not duplicate specification, ADR, issue, commit, or diff contents. Preserve the exact identifier or path and state why it matters to the next action.
