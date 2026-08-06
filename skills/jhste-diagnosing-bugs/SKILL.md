---
name: jhste-diagnosing-bugs
description: Diagnose difficult bugs and performance regressions in existing behavior whose cause or correct fix is uncertain, intermittent, environment-dependent, or spread across components. Use when the user asks to diagnose or debug, or reports broken, failing, throwing, hanging, or slow behavior that needs reproduction, competing hypotheses, instrumentation, or measurement. Do not use for an obvious typo, a direct compile or lint error, a known fix, ordinary implementation, or executable exploration of what should be built before production; use jhste-prototype for the latter.
---

# JHSTE Diagnosing Bugs

## Goal

Establish the strongest evidence-backed explanation available and, when a fix is requested, prove that the smallest supported correction resolves the reported symptom without leaving diagnostic artifacts behind.

## Establish the investigation without routine questions

Derive the observed symptom, affected environment, expected behavior, known-good comparison, and requested outcome from the user's request and available evidence. Inspect repository guidance, domain context, relevant code, recent changes, tests, logs, traces, and operational artifacts before asking the user for anything discoverable.

Treat requests to diagnose, investigate, debug, or explain as diagnosis-only unless a fix is also requested. Treat requests to fix, resolve, repair, or correct as authority to diagnose and apply the in-scope correction. Ask only when unavailable access, evidence, credentials, or a consequential user-owned decision actually blocks progress.

When the cause and correction are already clear, use `jhste-coding` instead. When there is no existing failure to explain and the question is what should be built, use `jhste-prototype`.

## Build the shortest useful signal

Prefer the shortest practical signal that exercises the reported behavior: an existing test, focused command, request replay, fixture, benchmark, profiler capture, trace replay, differential run, or small harness.

A useful signal should:

- observe the user's reported symptom rather than a nearby failure;
- distinguish failure from success;
- be repeatable, or quantitatively measurable when the failure is intermittent;
- be runnable by the agent without user interaction when practical; and
- support the same comparison before and after a fix.

Run the signal when the environment permits and record what it can actually prove. Tighten it only when doing so materially improves speed, determinism, or fidelity.

For intermittent failures, increase the observation rate through bounded repetition, stress, controlled timing, or a fixed seed when appropriate. Record counts or rates rather than treating one passing run as proof. For performance regressions, establish a comparable baseline and measure the affected path before choosing an optimization.

When no runnable signal is safe or available, continue from the strongest captured artifact or observation. Do not call a hypothesis a confirmed root cause when the available evidence cannot distinguish it from credible alternatives; report the best-supported explanation, confidence limit, and exact missing evidence.

## Reduce uncertainty

Minimize the reproduction when that narrows the search without changing the failure. When more than one cause remains credible, form at least two falsifiable hypotheses, rank them by inspected evidence, and choose probes that distinguish them. Do not manufacture extra hypotheses after the evidence has already isolated one cause.

Prefer direct runtime inspection when the harness supports it. Otherwise add only instrumentation that separates named hypotheses. Change one material variable at a time where practical. Give temporary logs, flags, fixtures, or harnesses a unique searchable marker so cleanup is reliable.

Do not pause to present hypotheses for approval. Continue testing them unless user knowledge is the only available discriminator.

## Fix and verify

When a fix is requested, apply the smallest change that addresses the supported root cause. Add a regression test only at a seam that reproduces the real failure pattern. If the available seam would create false confidence, document that limit and verify the original reproduction, artifact, or measurement directly.

Re-run the original signal after the fix, then run the narrowest relevant nearby checks. For intermittent or performance failures, compare the same bounded measurement before and after. Remove temporary instrumentation and throwaway artifacts unless the user asked to retain a clearly identified diagnostic aid.

Temporary production instrumentation, shared-infrastructure changes, or writes to an external environment require explicit authorization for that target.

## Completion

Report:

- the reproduced or captured symptom;
- the signal or evidence and what it could prove;
- hypotheses tested and their disposition;
- the supported root cause or best-supported explanation with remaining uncertainty;
- the change made, when requested;
- regression protection or why no honest test seam existed;
- commands, repetitions, rates, or measurements run;
- diagnostic artifacts removed; and
- any evidence that was unavailable.

Do not describe an unrun check as successful or an insufficiently distinguished hypothesis as confirmed.
