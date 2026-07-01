import fs from 'node:fs';
import path from 'node:path';
import { assertInstalledReferenceIntegrity, fail, run, skillDirs } from './helpers.mjs';

// Global advisory install: canonical skills dir + marker-managed bridges in each
// agent's global instruction file, no per-repo files, no git hooks.
export function runGlobalScenarios({ root, tmp }) {
  const base = path.join(tmp, 'global');
  const skillsDir = path.join(base, 'jhste-skills');
  const claudeFile = path.join(base, 'claude', 'CLAUDE.md');
  const codexFile = path.join(base, 'codex', 'AGENTS.md');
  const cli = path.join(root, 'cli/global.mjs');

  // Existing personal content that must survive install and uninstall.
  fs.mkdirSync(path.dirname(claudeFile), { recursive: true });
  const personal = '# Personal Claude instructions\n\nKeep my style.\n';
  fs.writeFileSync(claudeFile, personal);

  run(process.execPath, [cli, '--yes', '--skill-set', 'all', '--skills-dir', skillsDir, '--claude-file', claudeFile, '--codex-file', codexFile]);

  const dirs = skillDirs(skillsDir);
  if (dirs.length !== 22) fail(`global install should copy 22 skills, got ${dirs.length}`);
  if (!fs.existsSync(path.join(skillsDir, '_shared', 'solid-lens.md'))) fail('global install did not copy _shared companion');
  assertInstalledReferenceIntegrity(skillsDir);

  for (const file of [claudeFile, codexFile]) {
    const text = fs.readFileSync(file, 'utf8');
    if (!text.includes('<!-- jhste-skills:start -->') || !text.includes('<!-- jhste-skills:end -->')) fail(`global bridge missing markers in ${file}`);
    if (!text.includes('jhste-engineering-groundwork') || !text.includes('jhste-red-team-review')) fail(`global bridge missing workflow skills in ${file}`);
    if (text.includes('.jhste/profile.yaml')) fail(`global bridge should not reference a repo profile in ${file}`);
  }
  if (!fs.readFileSync(claudeFile, 'utf8').includes('Keep my style.')) fail('global install clobbered existing personal instructions');
  // Advisory only: no git hooks anywhere under the global base.
  if (fs.existsSync(path.join(base, '.git'))) fail('global install must not create a git repo or hooks');

  // Idempotent: re-run yields a single managed block.
  run(process.execPath, [cli, '--yes', '--skill-set', 'all', '--skills-dir', skillsDir, '--claude-file', claudeFile, '--codex-file', codexFile]);
  const starts = (fs.readFileSync(claudeFile, 'utf8').match(/jhste-skills:start/g) || []).length;
  if (starts !== 1) fail(`global install is not idempotent: ${starts} managed blocks in CLAUDE.md`);

  // Uninstall removes managed blocks and skills, preserves personal content.
  run(process.execPath, [cli, '--uninstall', '--skills-dir', skillsDir, '--claude-file', claudeFile, '--codex-file', codexFile]);
  if (fs.existsSync(skillsDir)) fail('global uninstall did not remove managed skills dir');
  if (fs.existsSync(codexFile)) fail('global uninstall did not remove bridge-only codex file');
  const claudeAfter = fs.readFileSync(claudeFile, 'utf8');
  if (claudeAfter.includes('jhste-skills:start')) fail('global uninstall left a managed block in CLAUDE.md');
  if (!claudeAfter.includes('Keep my style.')) fail('global uninstall removed personal instructions');
}
