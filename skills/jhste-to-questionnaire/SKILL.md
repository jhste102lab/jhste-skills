---
name: jhste-to-questionnaire
description: Turn decisions or facts the current user cannot supply into a focused questionnaire for the person or role that owns the missing knowledge. Use when requirements, approvals, constraints, policy, or operational facts must come from a customer, stakeholder, domain expert, security, legal, compliance, vendor, or another external respondent. Do not use when the current user owns the unresolved decision and can be interviewed directly; use jhste-grill instead.
---

# JHSTE To Questionnaire

## Goal

Produce the smallest useful set of questions that lets an authoritative respondent supply missing facts or decisions needed to continue the user's work.

## Find the real knowledge gap

Inspect the available conversation, repository, documents, prior decisions, and external evidence first. Do not ask a respondent for facts that are already discoverable or settled.

Identify the respondent or role, what they know that the current user does not, and the concrete decision or next action their answers must unlock. Ask the current user only when the intended respondent or required outcome cannot be inferred safely.

Do not interview the current user about subject matter they have already said belongs to someone else. Clarify the handoff, not the missing expertise.

## Draft answerable questions

Order questions by decision value so a partial response still unlocks the most important work.

Each question should target one fact, constraint, approval, preference, or decision the respondent can actually own. Separate independent questions, avoid implementation trivia that does not affect the downstream decision, and include enough context for a respondent who was not part of the original conversation.

State why an answer matters only when the question could otherwise be misread or answered too narrowly. Make uncertainty usable: allow `unknown`, ranges, conditions, or links to an authoritative source when exact answers are not available.

When different respondents own different gaps, group questions by owner rather than creating one ambiguous questionnaire.

## Produce the artifact

Use the format or destination the user requested. Otherwise produce portable Markdown with a concise purpose, respondent, how the answers will be used, and the questions themselves. Do not force a repository file when an inline draft is enough.

Do not send, post, commit, or publish the questionnaire unless that external write is explicitly requested. Never include credentials or sensitive values merely to make a question self-contained.

## After answers arrive

Treat returned answers as evidence, not as automatically complete requirements. Preserve material uncertainty and contradictions. Route the resulting work to the owning task: user-owned decisions may still need `jhste-grill`, settled behavior may go to `jhste-to-spec`, and domain-language changes may require `jhste-domain-modeling`.

## Completion

Report the intended respondent, the outcome the questionnaire is meant to unlock, the artifact or draft produced, and any remaining knowledge gap that no identified respondent owns.
