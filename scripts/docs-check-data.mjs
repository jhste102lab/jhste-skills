export const required = [
  'AGENTS.md',
  'README.md',
  'LICENSE',
  'package.json',
  'skills/setup/SKILL.md',
  'skills/ask-jhste/SKILL.md',
  'skills/jhste-preflight/SKILL.md',
  'skills/jhste-preflight/references/structure-templates.md',
  'skills/jhste-change-review/SKILL.md',
  'skills/jhste-db-api-boundary/SKILL.md',
  'skills/jhste-crawler-automation/SKILL.md',
  'skills/jhste-redteam/SKILL.md',
  'skills/jhste-redteam/references/red-team-review.md',
  'skills/jhste-workstate/SKILL.md',
  'skills/_shared/core-loop.md',
  'skills/_shared/solid-lens.md',
  'skills/_shared/evidence-discipline.md',
  'skills/_shared/issue-candidate.md',
  'skills/_shared/scope-discipline.md',
  'skills/_shared/side-effect-policy.md',
  'skills/_shared/review-cards/code-quality.md',
  'skills/_shared/review-cards/architecture.md',
  'skills/_shared/review-cards/api-db.md',
  'skills/_shared/review-cards/automation.md',
  'rules/core/no_silent_failure.yaml',
  'rules/core/no_secret_logging.yaml',
  'rules/core/workflow_security.yaml',
  'rules/core/file_size_advisory.yaml',
  'rules/core/responsibility_budget.yaml',
  'rules/core/single_responsibility_advisory.yaml',
  'rules/core/extension_seam_advisory.yaml',
  'rules/core/substitutability_advisory.yaml',
  'rules/core/interface_segregation_advisory.yaml',
  'rules/core/dependency_boundary_advisory.yaml',
  'rules/core/null_state_safety.yaml',
  'rules/core/authz_data_isolation.yaml',
  'rules/core/build_runtime_env_safety.yaml',
  'rules/core/write_safety_idempotency.yaml',
  'rules/core/api_contract_compatibility.yaml',
  'rules/core/performance_duplicate_fetch.yaml',
  'rules/core/public_safe_error.yaml',
  'rules/database/sql_parameter_binding.yaml',
  'rules/database/db_row_validation.yaml',
  'rules/crawler/crawler_producer_boundary.yaml',
  'packs/core.yaml',
  'packs/web.yaml',
  'packs/api.yaml',
  'packs/database.yaml',
  'packs/crawler.yaml',
  'adapters/codex/README.md',
  'adapters/claude/README.md',
  'adapters/generic/README.md',
  'cli/profile.mjs',
  'cli/install.mjs',
  'cli/install-flow.mjs',
  'cli/install-actions.mjs',
  'cli/install-actions/skill-migrations.mjs',
  'cli/connect.mjs',
  'cli/deep-scan.mjs',
  'cli/guard.mjs',
  'cli/guard/registry.mjs',
  'cli/guard/scanners/external-input.mjs',
  'cli/guard/scanners/single-responsibility.mjs',
  'cli/guard/scanners/solid-design.mjs',
  'cli/hooks.mjs',
  'cli/hook-utils.mjs',
  'cli/tune.mjs',
  'cli/baseline.mjs',
  'scripts/syntax-check.mjs',
  'scripts/docs-check/bridge-and-retired.mjs',
  'scripts/release-gates-test.mjs',
  'scripts/single-responsibility-fixtures-test.mjs',
  'scripts/solid-design-fixtures-test.mjs',
  'vendor/matt-pocock/allowlist.json',
  'vendor/matt-pocock/source-lock.json',
  'examples/profile.yaml',
  'docs/ACCEPTANCE_CHECK.md',
  'docs/PUBLIC_SAFETY.md',
];

// Load-bearing behavior anchors only. Behaviors are pinned once at their single
// source (shared doctrine or the owning skill); reference files are examples/lookup
// and are kept alive by each SKILL's `## References` link resolution, so they do not
// need prose-title pins here. Existence of required files is enforced in `required`.
export const recipeRequirements = {
  'skills/_shared/core-loop.md': ['non-trivial code changes', 'jhste-preflight', 'jhste-redteam', 'two fix + re-review', 'guard --scope changed --format text --fail-on error'],
  'skills/_shared/scope-discipline.md': ['Adjacent-code scope', 'bounded fix', 'two fix + re-review'],
  'skills/_shared/evidence-discipline.md': ['not found', 'not checked', 'actual consumer'],
  'skills/_shared/review-cards/code-quality.md': ['EDIT_PATHS', 'PROTECTED_PATHS'],
  'skills/grilling/SKILL.md': ['read-only by default'],
  'skills/grill-me/SKILL.md': ['read-only by default'],
  'skills/improve-codebase-architecture/SKILL.md': ['Default to a concise Markdown architecture review', 'HTML/Tailwind/Mermaid report only when requested'],
  'skills/jhste-preflight/SKILL.md': ['Changed responsibility', 'Final behavior predicates'],
  'skills/jhste-redteam/SKILL.md': ['changes required', 'residual risk', 'changed execution path', 'Do not print a full checklist', 'material findings', 'affected path', 'concrete failure mode', 'smallest safe fix', 'current proof', 'not checked'],
};

// jhste-authored skills that the model may auto-invoke. Their frontmatter
// `description` must answer only "when to invoke" and stay under the length cap;
// ask-jhste is excluded because it is user-invoked (disable-model-invocation).
export const modelInvokedJhsteSkills = [
  'skills/jhste-preflight/SKILL.md',
  'skills/jhste-change-review/SKILL.md',
  'skills/jhste-db-api-boundary/SKILL.md',
  'skills/jhste-crawler-automation/SKILL.md',
  'skills/jhste-redteam/SKILL.md',
  'skills/jhste-workstate/SKILL.md',
];

export const descriptionMaxLength = 200;

// The common loop lives once in core-loop.md. Every jhste review/workflow skill must
// delegate to it, and must not re-inline the canonical full guard command. Cards and
// bridge/README carry workflow context by design and are not individual skills.
export const coreLoopOwner = 'skills/_shared/core-loop.md';
export const coreLoopDelegationRef = '../_shared/core-loop.md';
export const canonicalGuardCommand = 'guard --scope changed --format text --fail-on error';

// Skill names retired by the personal-use topology reform. They must not reappear as
// live references inside skills, shared docs, AGENTS.md, or bridge templates (broken
// routing). Install pruning and CHANGELOG history reference them intentionally.
export const retiredSkillNames = [
  'jhste-engineering-groundwork',
  'jhste-engineering-judgment',
  'jhste-code-quality',
  'jhste-architecture-review',
  'jhste-red-team-review',
  'jhste-long-running-work-loop',
];
