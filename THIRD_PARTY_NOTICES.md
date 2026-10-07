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

Upstream was re-reviewed at commit `6fd947921b935b7e1e69293a200400f0fdd5c15f` on 2026-10-07 (previous review: `3cca18b368ae95cdbdebbff572ccafa662551015` on 2026-09-05):

- https://github.com/mattpocock/skills
- https://github.com/mattpocock/skills/tree/6fd947921b935b7e1e69293a200400f0fdd5c15f/skills/engineering/domain-modeling
- https://github.com/mattpocock/skills/tree/6fd947921b935b7e1e69293a200400f0fdd5c15f/skills/engineering/to-tickets
- https://github.com/mattpocock/skills/tree/6fd947921b935b7e1e69293a200400f0fdd5c15f/skills/productivity/handoff
- https://github.com/mattpocock/skills/tree/6fd947921b935b7e1e69293a200400f0fdd5c15f/skills/engineering/retro
- https://github.com/mattpocock/skills/blob/6fd947921b935b7e1e69293a200400f0fdd5c15f/SCOPE.md

The 2026-10-07 review covered 68 upstream commits since the previous baseline. JHSTE adopted the newer `GLOSSARY.md` / `GLOSSARY-MAP.md` naming for newly created fallback domain documents while preserving repositories that already use legacy `CONTEXT.md` / `CONTEXT-MAP.md`. It also adopted the maintenance principle that recurring mechanically detectable failures should be enforced by deterministic validators, CI, linters, type checks, builds, or tests rather than by more model-facing prose.

JHSTE did not adopt upstream `implement-spec`, `pr`, or `retro` as new package skills, fixed TDD/full-suite/reviewer sequences, context-window-based ticket sizing, or skill-level controls for subagent recursion. Those either duplicate existing JHSTE contracts or belong to the active harness. The current handoff flow already covered the material upstream behavior: portable handoffs prefer an artifact or temporary-file location, reference existing authoritative artifacts instead of copying them, redact sensitive information, and suggest only directly relevant next skills. No new handoff workflow was added; only stale retired `finalizer` terminology in the durable reference was cleaned up.

The review also reconfirmed the existing JHSTE adaptations for secret redaction in debugging evidence, intent-based merge/rebase conflict resolution, questionnaire ownership, dependency-aware decision rounds, and issue dependency modeling.

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

## Anthropic Claude Fable 5.1 prompting guidance

The 0.14.1 maintenance pass reviewed Anthropic's public prompting guidance for Claude Fable 5.1 and adapted one model-agnostic behavior into the existing JHSTE contracts:

- when behavior is equivalent, prefer a targeted edit over rewriting otherwise unchanged files.

The 0.14.3 maintenance pass re-reviewed the Claude Fable 5.1 guidance together with the general Claude prompting best practices and adapted two more behaviors:

- `jhste-coding` reports a pre-existing bug or unrelated problem noticed during the work as a follow-up instead of fixing it, unless the requested behavior cannot work without that fix;
- the portable handoff records approaches tried and set aside, mirroring what a compaction summary must preserve so the next executor does not repeat them.

The Fable 5.1 guidance was re-reviewed on 2026-10-07; no additional model-agnostic skill changes were needed beyond the behaviors already recorded below.

Guidance reviewed on 2026-09-03 and 2026-09-05, and re-reviewed on 2026-10-07:

- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices

No guide text is copied. Model-specific effort, search-trigger, conversation-history, thinking-display, progress-update, formatting, and API-message guidance remains outside these harness-neutral skills.

## OpenAI GPT-6 Astra prompting guidance

The 0.14.2 maintenance pass reviewed OpenAI's public prompting guidance for GPT-6 Astra, which notes stronger sensitivity to skill-file instructions, more frequent clarifying questions, and broader testing than a change needs. Two model-agnostic behaviors were adapted into existing contracts:

- `jhste-to-tickets` drafts the issue graph with visible uncertainty and asks a user-owned question alongside the draft, matching the synthesis-first behavior already in `jhste-to-spec`;
- `jhste-prototype` resolves an ambiguous question or evidence surface from the surrounding code and records that assumption instead of stopping when the user is unavailable.

Guidance reviewed on 2026-09-05:

- https://developers.openai.com/api/docs/guides/latest-model

No guide text is copied. User-versus-skill precedence, delegation encouragement, writing style, and model-specific API guidance remain harness- and user-owned and are not written into these skills.

## OpenAI GPT-5.6 model guidance

The 0.17.0 maintenance pass reviewed OpenAI's current GPT-5.6 model guidance on 2026-10-07. JHSTE adopted or reinforced three model-agnostic behaviors:

- requests to answer, explain, review, diagnose, or plan inspect and report by default rather than mutating files unless the request also asks for a change;
- requests to change, build, or fix may make safe in-scope local edits and run relevant non-destructive validation without routine confirmation;
- prompts stay lean: each instruction should appear once, and duplicated ceremony or tool orchestration belongs outside task skills unless representative evaluation proves it is needed.

These changes tighten write authority for `jhste-grill`, `jhste-domain-modeling`, and `jhste-code-result-double-check` without weakening explicit fix or update requests. Model-specific reasoning modes, effort, Programmatic Tool Calling, prompt caching, and multi-agent runtime configuration remain harness-owned.

Guidance reviewed on 2026-10-07:

- https://developers.openai.com/api/docs/guides/latest-model

## Anthropic Claude Sonnet 5.5 and Opus 5.5 prompting guidance

The 0.17.0 maintenance pass reviewed the Claude Sonnet 5.5 and Claude Opus 5.5 model-specific prompting guides together with the current general Claude prompting best practices.

One model-agnostic behavior was added to `jhste-coding`: once the requested behavior is verified and the task-owned diff is clean, stop rather than starting extra review or hardening rounds that the user did not request. The existing JHSTE validation contract already requires a real task-appropriate signal, so no fixed test, typecheck, build, or full-suite ladder was added.

Opus 5.5 unattended-work and multi-agent guidance was treated as harness-specific. JHSTE does not add time budgets, worker recursion limits, effort selection, progress transport, or multi-agent topology rules to individual task skills.

Guidance reviewed on 2026-10-07:

- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
