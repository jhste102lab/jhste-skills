# Third-Party Notices

## Matt Pocock Skills

The JHSTE workflow set is independently maintained, but parts of the workflow structure and terminology in the following areas were informed by or adapted from the `mattpocock/skills` repository:

- `jhste-grill`: dependency-aware decision trees, frontier-style question rounds, environment-first fact gathering, continuous domain-document maintenance, and resolving consequential branches before stopping;
- `jhste-to-questionnaire`: separating the current user from the authoritative respondent, clarifying who should answer and what the answers must unlock, and asking the respondent only for the missing knowledge rather than grilling the user on a subject they do not own;
- `jhste-domain-modeling`: immediate owning-glossary updates, concrete scenario checks, bounded-context maps, canonical terms with discouraged synonyms, lazy context and ADR locations, the three-part ADR threshold, and trigger coverage for direct domain-artifact requests;
- `jhste-to-spec`: conversation and codebase synthesis, behavioral test seams, adaptive specification sections, and avoiding stale implementation recipes;
- `jhste-diagnosing-bugs`: feedback-loop construction, symptom-specific signals, falsifiable hypotheses, targeted instrumentation, regression verification, cleanup, and credential redaction before surfaced diagnostic evidence;
- `jhste-to-tickets`: tracer-bullet slices, blocking edges, bounded preparatory work, expand-migrate-contract sequencing, and explicit integration for batches that cannot stay independently green;
- `jhste-handoff`: portable conversation compaction, references instead of duplicated artifact contents, next-session focus, suggested next skills, and sensitive-information redaction;
- `jhste-coding`: module/interface/seam reasoning, caller-visible contracts, avoiding shallow pass-through abstractions, and conflict resolution guided by repository history and the intent of both sides rather than conflict text alone;
- `jhste-prototype`: disposable runnable evidence for one design question, separate logic and UI exploration modes, visible state, in-memory or stubbed side effects by default, structurally distinct UI variants, non-developer-facing shareable logic experiments, and preserving the question and verdict separately from production implementation.

Upstream was re-reviewed at commit `068b6e0c62393147daf03530149cdce209c93da8` on 2026-08-17:

- https://github.com/mattpocock/skills
- https://github.com/mattpocock/skills/tree/068b6e0c62393147daf03530149cdce209c93da8/skills/engineering/diagnosing-bugs
- https://github.com/mattpocock/skills/tree/068b6e0c62393147daf03530149cdce209c93da8/skills/engineering/resolving-merge-conflicts
- https://github.com/mattpocock/skills/tree/068b6e0c62393147daf03530149cdce209c93da8/skills/engineering/domain-modeling
- https://github.com/mattpocock/skills/tree/068b6e0c62393147daf03530149cdce209c93da8/skills/productivity/to-questionnaire
- https://github.com/mattpocock/skills/tree/068b6e0c62393147daf03530149cdce209c93da8/skills/engineering/prototype
- https://github.com/mattpocock/skills/tree/068b6e0c62393147daf03530149cdce209c93da8/skills/productivity/grilling
- https://github.com/mattpocock/skills/tree/068b6e0c62393147daf03530149cdce209c93da8/skills/productivity/handoff

The current review considered upstream secret-redaction guidance for debugging evidence, intent-based merge/rebase conflict resolution, literal domain-artifact triggers, and the questionnaire boundary between the current user and another knowledge owner. JHSTE adapts these ideas into its existing authority and deletion-first model: it does not force merge completion when aborting or restarting is safer, does not turn every ADR into domain modeling, does not force questionnaires into repository files, and does not add a separate research, TDD, Wayfinder, wizard, or architecture-audit workflow.

The related GitHub article was reviewed as contextual evidence for both early executable exploration and the maintenance risk of adding too many skills; no article text is copied:

- https://github.blog/ai-and-ml/github-copilot/the-harness-is-all-you-need-mostly/

No upstream skill file is distributed verbatim. The full upstream MIT notice is retained because the resulting instructions adapt workflow structure and some terminology.

### MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Codexclaw

The `jhste-subagent-orchestration` design is independently maintained. Its review considered the following orchestration concepts from `lidge-jun/codexclaw`:

- distinguish runtime-enforced harness controls from model-followed guidance;
- delegate work that is decision-complete, independently verifiable, and bounded so consequential judgment remains with the head;
- record a head disposition for each worker return before dependent work proceeds;
- bind verification evidence to the source state it covered so later integration can invalidate stale evidence;
- treat repeated independent failures of the same unchanged assignment as evidence that the assignment packet may be defective;
- dispatch independent work in waves and triage required returns before opening dependent work.

Upstream reviewed at commit `ecc644e7742dc516ea91777414baf3da1859a162` on 2026-08-03:

- https://github.com/lidge-jun/codexclaw
- https://github.com/lidge-jun/codexclaw/tree/ecc644e7742dc516ea91777414baf3da1859a162

The JHSTE skill does not copy Codexclaw's PABCD state machine, hooks, evidence-receipt runtime, role TOMLs, model or reasoning-effort routing, worker-count limits, or fixed retry counts. No Codexclaw source file is distributed verbatim. The full upstream MIT notice is retained conservatively because the resulting instructions adapt several orchestration concepts and terms.

### MIT License

Copyright (c) 2026 lidge-jun

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
