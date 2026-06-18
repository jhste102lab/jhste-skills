import fs from 'node:fs';
import path from 'node:path';
import {
  assertNoInstallSideEffects,
  fail,
  hashFile,
  run,
  runAny,
  skillDirs,
} from './helpers.mjs';
import { runConnectScenarios } from './connect-scenarios.mjs';
import { runModeScenarios } from './mode-scenarios.mjs';

export function runInstallScenarios(ctx) {
  runRefusalScenarios(ctx);
  runDefaultInstall(ctx);
  runLineLimitScenarios(ctx);
  runSkillSetScenarios(ctx);
  runModeScenarios(ctx);
  runConnectScenarios(ctx);
}

function initRepo(repo) {
  fs.mkdirSync(repo, { recursive: true });
  run('git', ['init'], { cwd: repo });
}

function runRefusalScenarios({ root, tmp }) {
  const nonInteractiveRepo = path.join(tmp, 'noninteractive-repo');
  const nonInteractiveSkills = path.join(tmp, 'noninteractive-skills');
  initRepo(nonInteractiveRepo);
  fs.writeFileSync(path.join(nonInteractiveRepo, 'AGENTS.md'), '# Non-interactive repo\n');
  const nonInteractiveAgentsBefore = fs.readFileSync(path.join(nonInteractiveRepo, 'AGENTS.md'), 'utf8');
  const refusedNonInteractive = runAny(process.execPath, [
    path.join(root, 'cli/install.mjs'),
    '--repo',
    nonInteractiveRepo,
    '--skills-dir',
    nonInteractiveSkills,
    '--skip-hooks',
    '--skip-deep-scan',
  ], { cwd: nonInteractiveRepo, input: '' });
  if (refusedNonInteractive.status !== 3) fail(`non-interactive install without --yes should exit 3, got ${refusedNonInteractive.status}`);
  assertNoInstallSideEffects({
    repo: nonInteractiveRepo,
    skillsDir: nonInteractiveSkills,
    agentsBefore: nonInteractiveAgentsBefore,
    label: 'non-interactive install without --yes',
  });

  const invalidHookRepo = path.join(tmp, 'invalid-hook-repo');
  const invalidHookSkills = path.join(tmp, 'invalid-hook-skills');
  initRepo(invalidHookRepo);
  fs.writeFileSync(path.join(invalidHookRepo, 'AGENTS.md'), '# Invalid hook repo\n');
  const invalidHookAgentsBefore = fs.readFileSync(path.join(invalidHookRepo, 'AGENTS.md'), 'utf8');
  const invalidHookInstall = runAny(process.execPath, [
    path.join(root, 'cli/install.mjs'),
    '--yes',
    '--repo',
    invalidHookRepo,
    '--skills-dir',
    invalidHookSkills,
    '--hooks',
    'typo',
    '--skip-deep-scan',
  ], { cwd: invalidHookRepo });
  if (invalidHookInstall.status !== 3) fail(`install --hooks typo should exit 3, got ${invalidHookInstall.status}`);
  assertNoInstallSideEffects({
    repo: invalidHookRepo,
    skillsDir: invalidHookSkills,
    agentsBefore: invalidHookAgentsBefore,
    label: 'install --hooks typo',
  });
}

function runDefaultInstall(ctx) {
  const { root, repo, skillsDir } = ctx;
  ctx.packageHashBefore = hashFile(path.join(repo, 'package.json'));
  ctx.lockHashBefore = hashFile(path.join(repo, 'package-lock.json'));
  const started = Date.now();
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', repo, '--skills-dir', skillsDir, '--skip-deep-scan'], { cwd: repo });
  ctx.elapsed = Date.now() - started;
  if (ctx.elapsed > 30000) fail(`install exceeded 30 seconds: ${ctx.elapsed}ms`);

  ctx.profilePath = path.join(repo, '.jhste', 'profile.yaml');
  if (!fs.existsSync(ctx.profilePath)) fail('profile was not created');
  const profile = fs.readFileSync(ctx.profilePath, 'utf8');
  if (!/^mode: advisory$/m.test(profile)) fail('profile default mode is not advisory');
  if (/mode:\s*strict/.test(profile)) fail('profile enabled strict mode');
  if (!/file_size_advisory:\n    mode: advisory\n    source_file_warning_lines: 300\n    source_file_review_lines: 300/m.test(profile)) {
    fail('profile did not use default 300-line advisory file-size policy');
  }
  if (!profile.includes('auto_for_non_trivial_code_changes: true')) fail('profile missing red-team review workflow guidance');
  if (hashFile(path.join(repo, 'package.json')) !== ctx.packageHashBefore) fail('install modified target package.json');
  if (hashFile(path.join(repo, 'package-lock.json')) !== ctx.lockHashBefore) fail('install modified target lockfile');
  const defaultPreCommit = path.join(repo, '.git', 'hooks', 'pre-commit');
  if (!fs.existsSync(defaultPreCommit)) fail('install did not create default advisory pre-commit hook');
  if (!fs.readFileSync(defaultPreCommit, 'utf8').includes('mode=advisory')) fail('default pre-commit hook is not advisory');
  if (!fs.existsSync(path.join(skillsDir, 'jhste-red-team-review', 'SKILL.md'))) fail('install did not copy jhste-red-team-review skill');
  const defaultSkillDirs = skillDirs(skillsDir);
  if (defaultSkillDirs.length !== 7) fail(`default install should copy 7 core skills, got ${defaultSkillDirs.length}`);
  if (defaultSkillDirs.includes('improve-codebase-architecture')) fail('default install should not copy vendored workflow skills');
}

function runLineLimitScenarios({ root, tmp }) {
  const lineLimitRepo = path.join(tmp, 'line-limit-repo');
  const lineLimitSkills = path.join(tmp, 'line-limit-skills');
  initRepo(lineLimitRepo);
  run(process.execPath, [
    path.join(root, 'cli/install.mjs'),
    '--yes',
    '--repo',
    lineLimitRepo,
    '--skills-dir',
    lineLimitSkills,
    '--skip-deep-scan',
    '--line-limit',
    '123',
    '--line-limit-mode',
    'blocking',
  ], { cwd: lineLimitRepo });
  const lineLimitProfile = fs.readFileSync(path.join(lineLimitRepo, '.jhste', 'profile.yaml'), 'utf8');
  if (!lineLimitProfile.includes('source_file_warning_lines: 123') || !lineLimitProfile.includes('source_file_review_lines: 123')) {
    fail('custom line limit was not written to profile');
  }
  const lineLimitHook = fs.readFileSync(path.join(lineLimitRepo, '.git', 'hooks', 'pre-commit'), 'utf8');
  if (!lineLimitHook.includes('mode=blocking') || !lineLimitHook.includes('--fail-on warning')) {
    fail('blocking line limit did not install warning-blocking hook');
  }

  const noLineLimitRepo = path.join(tmp, 'no-line-limit-repo');
  const noLineLimitSkills = path.join(tmp, 'no-line-limit-skills');
  initRepo(noLineLimitRepo);
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', noLineLimitRepo, '--skills-dir', noLineLimitSkills, '--skip-deep-scan', '--no-line-limit'], { cwd: noLineLimitRepo });
  const noLineLimitProfile = fs.readFileSync(path.join(noLineLimitRepo, '.jhste', 'profile.yaml'), 'utf8');
  if (!/file_size_advisory:\n    mode: off/m.test(noLineLimitProfile)) fail('--no-line-limit did not disable file-size policy');
}

function runSkillSetScenarios({ root, tmp }) {
  const vendorRepo = path.join(tmp, 'vendor-skill-repo');
  const vendorSkillsDir = path.join(tmp, 'vendor-skills');
  initRepo(vendorRepo);
  fs.writeFileSync(path.join(vendorRepo, 'AGENTS.md'), '# Vendor skill repo\n');
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', vendorRepo, '--skills-dir', vendorSkillsDir, '--skip-deep-scan', '--skip-hooks', '--skill-set', 'vendor'], { cwd: vendorRepo });
  const vendorSkillDirs = skillDirs(vendorSkillsDir);
  if (vendorSkillDirs.length !== 14) fail(`--skill-set vendor should copy 14 skills, got ${vendorSkillDirs.length}`);
  if (!vendorSkillDirs.includes('improve-codebase-architecture')) fail('--skill-set vendor did not copy expected vendored skill');
  if (vendorSkillDirs.includes('jhste-red-team-review')) fail('--skill-set vendor copied core skill');

  const allRepo = path.join(tmp, 'all-skill-repo');
  const allSkillsDir = path.join(tmp, 'all-skills');
  initRepo(allRepo);
  fs.writeFileSync(path.join(allRepo, 'AGENTS.md'), '# All skill repo\n');
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', allRepo, '--skills-dir', allSkillsDir, '--skip-deep-scan', '--skip-hooks', '--skill-set', 'all'], { cwd: allRepo });
  const allSkillDirs = skillDirs(allSkillsDir);
  if (allSkillDirs.length !== 21) fail(`--skill-set all should copy 21 skills, got ${allSkillDirs.length}`);
  if (!allSkillDirs.includes('jhste-red-team-review') || !allSkillDirs.includes('improve-codebase-architecture')) fail('--skill-set all missing core or vendored skill');
}
