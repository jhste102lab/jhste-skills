import fs from 'node:fs';
import path from 'node:path';
import { assertInstalledReferenceIntegrity, fail, run, runAny, skillDirs } from './helpers.mjs';

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
  if (dirs.length !== 23) fail(`global install should copy 23 skills, got ${dirs.length}`);
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
  run(process.execPath, [cli, '--yes', '--uninstall', '--skills-dir', skillsDir, '--claude-file', claudeFile, '--codex-file', codexFile]);
  if (fs.existsSync(skillsDir)) fail('global uninstall did not remove managed skills dir');
  if (fs.existsSync(codexFile)) fail('global uninstall did not remove bridge-only codex file');
  const claudeAfter = fs.readFileSync(claudeFile, 'utf8');
  if (claudeAfter.includes('jhste-skills:start')) fail('global uninstall left a managed block in CLAUDE.md');
  if (!claudeAfter.includes('Keep my style.')) fail('global uninstall removed personal instructions');

  // Install must be atomic enough that blocked skills never get a bridge pointing
  // at stale/incomplete installed skills.
  const invalidBase = path.join(tmp, 'global-invalid-manifest');
  const invalidSkillsDir = path.join(invalidBase, 'skills');
  const invalidClaudeFile = path.join(invalidBase, 'claude', 'CLAUDE.md');
  const invalidCodexFile = path.join(invalidBase, 'codex', 'AGENTS.md');
  fs.mkdirSync(invalidSkillsDir, { recursive: true });
  fs.writeFileSync(path.join(invalidSkillsDir, '.jhste-skills-manifest.json'), '{not json');
  const invalidResult = runAny(process.execPath, [cli, '--yes', '--skills-dir', invalidSkillsDir, '--claude-file', invalidClaudeFile, '--codex-file', invalidCodexFile]);
  if (invalidResult.status !== 3) fail(`global install with invalid manifest should exit 3, got ${invalidResult.status}`);
  if (fs.existsSync(invalidClaudeFile) || fs.existsSync(invalidCodexFile)) fail('global install wrote bridge files after invalid manifest');

  // `_shared` is a required companion resource; unmanaged conflicts there should
  // block before any selected skills are copied.
  const conflictBase = path.join(tmp, 'global-shared-conflict');
  const conflictSkillsDir = path.join(conflictBase, 'skills');
  const conflictClaudeFile = path.join(conflictBase, 'claude', 'CLAUDE.md');
  const conflictCodexFile = path.join(conflictBase, 'codex', 'AGENTS.md');
  fs.mkdirSync(path.join(conflictSkillsDir, '_shared'), { recursive: true });
  fs.writeFileSync(path.join(conflictSkillsDir, '_shared', 'solid-lens.md'), '# unmanaged local doctrine\n');
  const conflictResult = runAny(process.execPath, [cli, '--yes', '--skills-dir', conflictSkillsDir, '--claude-file', conflictClaudeFile, '--codex-file', conflictCodexFile]);
  if (conflictResult.status !== 3) fail(`global install with unmanaged _shared should exit 3, got ${conflictResult.status}`);
  if (fs.existsSync(path.join(conflictSkillsDir, 'jhste-red-team-review'))) fail('global install copied selected skills before detecting _shared conflict');
  if (fs.existsSync(conflictClaudeFile) || fs.existsSync(conflictCodexFile)) fail('global install wrote bridge files after _shared conflict');

  const noYesBase = path.join(tmp, 'global-no-yes');
  const noYesSkillsDir = path.join(noYesBase, 'skills');
  const noYesClaudeFile = path.join(noYesBase, 'claude', 'CLAUDE.md');
  const noYesResult = runAny(process.execPath, [cli, '--skills-dir', noYesSkillsDir, '--claude-file', noYesClaudeFile], { input: '' });
  if (noYesResult.status !== 3) fail(`non-interactive global install without --yes should exit 3, got ${noYesResult.status}`);
  if (fs.existsSync(noYesSkillsDir) || fs.existsSync(noYesClaudeFile)) fail('global install without --yes changed files');

  const vendorBase = path.join(tmp, 'global-vendor-refused');
  const vendorSkillsDir = path.join(vendorBase, 'skills');
  const vendorClaudeFile = path.join(vendorBase, 'claude', 'CLAUDE.md');
  const vendorResult = runAny(process.execPath, [cli, '--yes', '--skill-set', 'vendor', '--skills-dir', vendorSkillsDir, '--claude-file', vendorClaudeFile]);
  if (vendorResult.status === 0) fail('global install should reject --skill-set vendor');
  if (fs.existsSync(vendorSkillsDir) || fs.existsSync(vendorClaudeFile)) fail('global --skill-set vendor changed files');

  const missingValueBase = path.join(tmp, 'global-missing-value');
  const missingValueResult = runAny(process.execPath, [cli, '--yes', '--claude-file'], { cwd: missingValueBase });
  if (missingValueResult.status === 0) fail('global --claude-file without a value should fail');

  const invalidUninstallBase = path.join(tmp, 'global-invalid-uninstall');
  const invalidUninstallSkills = path.join(invalidUninstallBase, 'skills');
  const invalidUninstallClaude = path.join(invalidUninstallBase, 'claude', 'CLAUDE.md');
  fs.mkdirSync(invalidUninstallSkills, { recursive: true });
  fs.mkdirSync(path.dirname(invalidUninstallClaude), { recursive: true });
  fs.writeFileSync(path.join(invalidUninstallSkills, '.jhste-skills-manifest.json'), '{not json');
  fs.writeFileSync(invalidUninstallClaude, '<!-- jhste-skills:start -->\nstale\n<!-- jhste-skills:end -->\n');
  const invalidUninstallResult = runAny(process.execPath, [cli, '--yes', '--uninstall', '--skills-dir', invalidUninstallSkills, '--claude-file', invalidUninstallClaude]);
  if (invalidUninstallResult.status !== 3) fail(`global uninstall with invalid manifest should exit 3, got ${invalidUninstallResult.status}`);
  if (!fs.readFileSync(invalidUninstallClaude, 'utf8').includes('jhste-skills:start')) fail('global uninstall removed bridge after invalid skills manifest');

  const traversalBase = path.join(tmp, 'global-manifest-traversal');
  const traversalSkills = path.join(traversalBase, 'skills');
  const outside = path.join(traversalBase, 'outside');
  fs.mkdirSync(traversalSkills, { recursive: true });
  fs.mkdirSync(outside, { recursive: true });
  fs.writeFileSync(path.join(outside, 'keep.txt'), 'keep\n');
  fs.writeFileSync(path.join(traversalSkills, '.jhste-skills-manifest.json'), JSON.stringify({
    managed_by: 'jhste-skills',
    skills: { '../outside': { digest: 'bad' } },
  }));
  const traversalResult = runAny(process.execPath, [cli, '--yes', '--uninstall', '--skills-dir', traversalSkills]);
  if (traversalResult.status !== 3) fail(`global uninstall with traversal manifest should exit 3, got ${traversalResult.status}`);
  if (!fs.existsSync(path.join(outside, 'keep.txt'))) fail('global uninstall followed a traversal manifest entry outside skills dir');
}
