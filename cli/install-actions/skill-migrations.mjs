// Personal-use topology reform keeps no back-compat aliases for direct skill
// selection: retired names are not installable aliases. `sync`/`update` still use
// this migration-only replacement map so existing managed installs select the new
// workflow skills before pruning old directories.
export const LEGACY_SKILL_RENAMES = Object.freeze({});

export const RETIRED_SKILL_REPLACEMENTS = Object.freeze({
  'write-a-skill': ['writing-great-skills'],
  diagnose: ['diagnosing-bugs'],
  'jhste-engineering-judgment': ['jhste-preflight'],
  'jhste-engineering-groundwork': ['jhste-preflight'],
  'jhste-code-quality': ['jhste-change-review'],
  'jhste-architecture-review': ['jhste-change-review'],
  'jhste-red-team-review': ['jhste-redteam'],
  'jhste-long-running-work-loop': ['jhste-workstate'],
});

export const DELETED_MANAGED_SKILLS = Object.freeze(Object.keys(RETIRED_SKILL_REPLACEMENTS));

export function canonicalSkillName(name) {
  return LEGACY_SKILL_RENAMES[name] || name;
}
