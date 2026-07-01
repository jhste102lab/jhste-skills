import fs from 'node:fs';
import path from 'node:path';
import { fail, readManagedSkillsManifest, run } from './helpers.mjs';

function initRepo(repo) {
  fs.mkdirSync(repo, { recursive: true });
  run('git', ['init'], { cwd: repo });
}

export function runPreReformUpdateMigrationScenario({ root, tmp }) {
  const preReformRepo = path.join(tmp, 'pre-reform-update-repo');
  const preReformSkills = path.join(tmp, 'pre-reform-update-skills');
  initRepo(preReformRepo);
  fs.writeFileSync(path.join(preReformRepo, 'AGENTS.md'), `# Pre-reform update repo

<!-- jhste-skills:start -->
stale managed bridge
<!-- jhste-skills:end -->
`);

  const carriedForwardSkills = ['ask-jhste', 'triage'];
  const retiredSkillReplacements = {
    'write-a-skill': 'writing-great-skills',
    diagnose: 'diagnosing-bugs',
    'jhste-engineering-judgment': 'jhste-preflight',
    'jhste-engineering-groundwork': 'jhste-preflight',
    'jhste-code-quality': 'jhste-change-review',
    'jhste-architecture-review': 'jhste-change-review',
    'jhste-red-team-review': 'jhste-redteam',
    'jhste-long-running-work-loop': 'jhste-workstate',
  };
  const manifest = { managed_by: 'jhste-skills', version: '0.3.0', installed_at: '2026-06-30T00:00:00.000Z', skills: {} };
  for (const name of [...carriedForwardSkills, ...Object.keys(retiredSkillReplacements)]) {
    const skillDir = path.join(preReformSkills, name);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), `# stale pre-reform ${name}\n`);
    manifest.skills[name] = { digest: `stale-${name}` };
  }
  fs.writeFileSync(path.join(preReformSkills, '.jhste-skills-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  run(process.execPath, [path.join(root, 'cli/update.mjs'), '--yes', '--repo', preReformRepo, '--skills-dir', preReformSkills, '--skills-only'], { cwd: preReformRepo });

  for (const [retiredName, replacementName] of Object.entries(retiredSkillReplacements)) {
    if (fs.existsSync(path.join(preReformSkills, retiredName))) fail(`pre-reform update did not prune retired skill ${retiredName}`);
    const replacementSkill = path.join(preReformSkills, replacementName, 'SKILL.md');
    if (!fs.existsSync(replacementSkill)) fail(`pre-reform update did not install replacement skill ${replacementName} for ${retiredName}`);
    if (fs.readFileSync(replacementSkill, 'utf8') !== fs.readFileSync(path.join(root, 'skills', replacementName, 'SKILL.md'), 'utf8')) {
      fail(`pre-reform update did not refresh replacement skill ${replacementName}`);
    }
  }

  const migratedManifest = readManagedSkillsManifest(preReformSkills);
  for (const retiredName of Object.keys(retiredSkillReplacements)) {
    if (migratedManifest.skills?.[retiredName]) fail(`pre-reform update left retired manifest entry ${retiredName}`);
  }
  for (const replacementName of new Set(Object.values(retiredSkillReplacements))) {
    if (!migratedManifest.skills?.[replacementName]?.digest) fail(`pre-reform update did not record replacement manifest entry ${replacementName}`);
  }
}
