---
name: jhste-diagnosing-bugs
description: Diagnose difficult bugs and performance regressions in existing behavior whose cause or correct fix is uncertain, intermittent, environment-dependent, or spread across components. Use for explicit root-cause investigation that needs reproduction, competing hypotheses, instrumentation, or measurement. Do not use for an obvious typo, a direct compile or lint error, a known fix, ordinary implementation, or executable exploration of what should be built before production; use jhste-prototype for the latter.
---

# JHSTE Diagnosing Bugs

## Goal

Establish an evidence-backed root cause and, when a fix is in scope, prove that the smallest correction resolves the reported symptom without leaving diagnostic artifacts behind.

## Frame the investigation

Confirm the exact observed symptom, affected environment, expected behavior, known-good comparison, and whether the user requested diagnosis only or diagnosis plus a fix. Read repository guidance, relevant code, recent changes, tests, logs, traces, and operational evidence that are available.

When the cause and correction are already clear, use `jhste-coding` instead. When there is no existing failure to explain and the question is whether a proposed state model, data shape, API surface, interaction flow, or UI structure should be built, use `jhste-prototype`. Route failing pull request checks to the repository's CI workflow unless the user is asking for a deeper root-cause investigation.

## Build a useful feedback loop

Prefer the shortest practical signal that exercises the reported behavior: an existing test, focused command, request replay, fixture, benchmark, profiler capture, or small harness. Run it when the environment permits and record the exact symptom it can detect.

Tighten the loop when doing so materially improves speed, determinism, or fidelity. For intermittent failures, increase the reproduction rate and capture the conditions rather than claiming determinism that the evidence does not support. If no runnable loop is available, continue with the strongest captured artifact or observation available and state the resulting limit.

## Reduce uncertainty

Minimize the reproduction when that narrows the search without changing the failure. When more than one cause remains plausible, form at least two falsifiable hypotheses, rank them by inspected evidence, and choose probes that distinguish them. Change one material variable at a time where practical.

Use targeted instrumentation at the boundaries that separate hypotheses. Tag temporary logs, flags, fixtures, or harnesses so they can be found and removed. For performance regressions, establish a comparable baseline and measure the affected path before choosing an optimization.

## Fix and verify

When a fix is requested, apply the smallest change that addresses the supported root cause. Add a regression test at a seam that reproduces the real failure pattern when such a seam exists. If the available seam would create false confidence, document that limitation and verify the original reproduction or measurement directly.

Re-run the original signal after the fix, then run relevant nearby checks. Remove temporary instrumentation and throwaway artifacts unless the user asked to retain a clearly identified diagnostic aid. A need for temporary production instrumentation, changes to shared infrastructure, or writes to an external environment requires explicit authorization for that target.

## Completion

Report the reproduced symptom, evidence considered, hypotheses tested, supported root cause, change made if any, regression protection, commands or measurements run, diagnostic artifacts removed, and remaining uncertainty. Do not describe an unrun check as successful.
