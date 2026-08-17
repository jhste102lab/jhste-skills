---
name: jhste-diagnosing-bugs
description: Diagnose uncertain bugs and performance regressions in existing behavior through symptom-specific evidence, competing explanations, instrumentation, or measurement. Use for broken, failing, throwing, hanging, intermittent, environment-dependent, or slow behavior whose cause or correct fix is not clear. Do not use for known fixes, ordinary implementation, or not-yet-built design questions.
---

# JHSTE Diagnosing Bugs

## Goal

Establish the strongest evidence-backed explanation available and, when a fix is requested, prove that the smallest supported correction resolves the reported symptom.

## Establish the investigation

Derive the symptom, environment, expected behavior, known-good comparison, and requested outcome from the request and available evidence. Inspect relevant guidance, domain context, code, recent changes, tests, logs, traces, and operational artifacts before asking for anything discoverable.

Treat diagnose, investigate, debug, or explain as diagnosis-only unless a fix is also requested. Treat fix, resolve, repair, or correct as authority to diagnose and apply the in-scope correction.

## Build a useful signal

Prefer the shortest safe signal that observes the reported symptom and distinguishes failure from success. It may be an existing test, focused command, replay, fixture, measurement, runtime inspection, or small harness; choose by fit rather than a fixed order.

The signal should support the same comparison before and after a fix. For intermittent or performance problems, record bounded counts, rates, or measurements rather than treating one passing run as proof.

Redact API keys, tokens, passwords, cookies, session identifiers, connection strings, signed URLs, and equivalent credentials before surfacing commands, logs, traces, captures, or other artifacts. Show command shape with environment-variable placeholders instead of secret values, and quote only the signal-bearing evidence needed for the diagnosis. If redaction removes evidence required to distinguish credible explanations, state that limit and request the smallest safer substitute or user-owned observation.

When no runnable signal is safe or available, continue from the strongest captured artifact. Do not call an explanation a confirmed root cause when credible alternatives cannot be distinguished; state the evidence limit and what is missing.

## Reduce uncertainty

Minimize the reproduction when doing so narrows the search without changing the failure. When several causes remain credible, form only as many falsifiable hypotheses as needed to separate them and use probes that distinguish their predictions.

Prefer direct runtime inspection when the harness supports it. Otherwise add only targeted instrumentation that separates named explanations. Give temporary artifacts a unique searchable marker and remove them before completion.

Do not pause to seek approval for hypotheses unless user knowledge is the only available discriminator.

## Fix and verify

When a fix is requested, apply the smallest change supported by the evidence. Add regression protection only at a seam that reproduces the real failure pattern; do not create a shallow test that produces false confidence.

Re-run the original signal or compare the same captured measurement after the fix. Expand nearby validation only when risk, integration surface, or an observed failure justifies it. Production instrumentation, shared-infrastructure changes, and external writes require authority for that target.

## Completion

Report the symptom, evidence and what it could prove, explanations tested, supported root cause or confidence limit, change made when requested, verification, removed diagnostic artifacts, and any unavailable evidence. Never describe an unrun check as passed or an insufficiently distinguished explanation as confirmed.
