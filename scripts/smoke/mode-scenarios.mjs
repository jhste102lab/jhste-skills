import fs from 'node:fs';
import path from 'node:path';
import { fail, run, runAny, skillDirs } from './helpers.mjs';

function initRepo(repo) {
  fs.mkdirSync(repo, { recursive: true });
  run('git', ['init'], { cwd: repo });
}

export function runModeScenarios(ctx) {
  runCustomAndMinimalScenarios(ctx);
  runFullModeScenarios(ctx);
}

function runCustomAndMinimalScenarios({ root, tmp }) {
  const customYesRepo = path.join(tmp, 'custom-yes-repo');
  const customYesSkills = path.join(tmp, 'custom-yes-skills');
  initRepo(customYesRepo);
  const customYesInstall = runAny(process.execPath, [path.join(root, 'cli/install.mjs'), '--mode', 'custom', '--yes', '--repo', customYesRepo, '--skills-dir', customYesSkills], { cwd: customYesRepo });
  if (customYesInstall.status !== 3) fail(`install --mode custom --yes should exit 3, got ${customYesInstall.status}`);
  if (fs.existsSync(path.join(customYesRepo, '.jhste'))) fail('install --mode custom --yes created repo files');
  if (fs.existsSync(customYesSkills)) fail('install --mode custom --yes created skills');

  const minimalRepo = path.join(tmp, 'minimal-repo');
  const minimalSkillsDir = path.join(tmp, 'minimal-skills');
  initRepo(minimalRepo);
  fs.writeFileSync(path.join(minimalRepo, 'AGENTS.md'), '# Minimal repo\n');
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--mode', 'minimal', '--yes', '--repo', minimalRepo, '--skills-dir', minimalSkillsDir, '--skip-deep-scan'], { cwd: minimalRepo });
  const minimalSkillDirs = skillDirs(minimalSkillsDir);
  if (minimalSkillDirs.length !== 7) fail(`--mode minimal should copy 7 core skills, got ${minimalSkillDirs.length}`);
  if (fs.existsSync(path.join(minimalRepo, '.jhste'))) fail('--mode minimal created .jhste');
  if (fs.existsSync(path.join(minimalRepo, '.git', 'hooks', 'pre-commit'))) fail('--mode minimal created pre-commit hook');
  if (fs.readFileSync(path.join(minimalRepo, 'AGENTS.md'), 'utf8') !== '# Minimal repo\n') fail('--mode minimal modified AGENTS.md');

  const minimalHookRepo = path.join(tmp, 'minimal-hook-repo');
  const minimalHookSkillsDir = path.join(tmp, 'minimal-hook-skills');
  initRepo(minimalHookRepo);
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--mode', 'minimal', '--hooks', 'advisory', '--yes', '--repo', minimalHookRepo, '--skills-dir', minimalHookSkillsDir, '--skip-deep-scan'], { cwd: minimalHookRepo });
  if (!fs.existsSync(path.join(minimalHookRepo, '.git', 'hooks', 'pre-commit'))) fail('--mode minimal --hooks advisory did not install explicit hook');
  if (fs.existsSync(path.join(minimalHookRepo, '.jhste'))) fail('--mode minimal --hooks advisory should not create profile');
}

function runFullModeScenarios({ root, tmp }) {
  const fullModeRepo = path.join(tmp, 'full-mode-repo');
  const fullModeSkillsDir = path.join(tmp, 'full-mode-skills');
  initRepo(fullModeRepo);
  fs.writeFileSync(path.join(fullModeRepo, 'AGENTS.md'), '# Full mode repo\n');
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--mode', 'full', '--yes', '--repo', fullModeRepo, '--skills-dir', fullModeSkillsDir, '--skip-deep-scan'], { cwd: fullModeRepo });
  const fullModeSkillDirs = skillDirs(fullModeSkillsDir);
  if (fullModeSkillDirs.length !== 20) fail(`--mode full should copy 20 skills, got ${fullModeSkillDirs.length}`);
  const fullPreCommit = path.join(fullModeRepo, '.git', 'hooks', 'pre-commit');
  const fullPrePush = path.join(fullModeRepo, '.git', 'hooks', 'pre-push');
  if (!fs.existsSync(fullPreCommit) || !fs.existsSync(fullPrePush)) fail('--mode full did not install pre-commit and pre-push');
  if (!fs.readFileSync(fullPreCommit, 'utf8').includes('mode=advisory')) fail('--mode full pre-commit is not advisory by default');
  if (!fs.readFileSync(fullPrePush, 'utf8').includes('mode=advisory')) fail('--mode full pre-push is not advisory by default');
  if (!fs.readFileSync(path.join(fullModeRepo, 'AGENTS.md'), 'utf8').includes('jhste-skills:start')) fail('--mode full bridge missing managed marker');

  const fullBlockingRepo = path.join(tmp, 'full-blocking-repo');
  const fullBlockingSkillsDir = path.join(tmp, 'full-blocking-skills');
  initRepo(fullBlockingRepo);
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--mode', 'full', '--hooks', 'blocking', '--yes', '--repo', fullBlockingRepo, '--skills-dir', fullBlockingSkillsDir, '--skip-deep-scan'], { cwd: fullBlockingRepo });
  if (!fs.readFileSync(path.join(fullBlockingRepo, '.git', 'hooks', 'pre-commit'), 'utf8').includes('mode=blocking')) fail('--mode full --hooks blocking pre-commit not blocking');
  if (!fs.readFileSync(path.join(fullBlockingRepo, '.git', 'hooks', 'pre-push'), 'utf8').includes('mode=blocking')) fail('--mode full --hooks blocking pre-push not blocking');

  const fullExistingHookRepo = path.join(tmp, 'full-existing-hook-repo');
  const fullExistingHookSkillsDir = path.join(tmp, 'full-existing-hook-skills');
  initRepo(fullExistingHookRepo);
  const fullExistingPreCommit = path.join(fullExistingHookRepo, '.git', 'hooks', 'pre-commit');
  fs.writeFileSync(fullExistingPreCommit, '#!/usr/bin/env sh\necho existing\n', { mode: 0o755 });
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--mode', 'full', '--yes', '--repo', fullExistingHookRepo, '--skills-dir', fullExistingHookSkillsDir, '--skip-deep-scan'], { cwd: fullExistingHookRepo });
  if (!fs.readFileSync(fullExistingPreCommit, 'utf8').includes('echo existing')) fail('--mode full overwrote non-managed pre-commit');
  if (!fs.existsSync(path.join(fullExistingHookRepo, '.git', 'hooks', 'pre-push'))) fail('--mode full did not install pre-push when pre-commit was non-managed');
  const fullBlockingExistingHook = runAny(process.execPath, [path.join(root, 'cli/install.mjs'), '--mode', 'full', '--hooks', 'blocking', '--yes', '--repo', fullExistingHookRepo, '--skills-dir', fullExistingHookSkillsDir, '--skip-deep-scan'], { cwd: fullExistingHookRepo });
  if (fullBlockingExistingHook.status !== 3) fail(`--mode full --hooks blocking with non-managed pre-commit should exit 3, got ${fullBlockingExistingHook.status}`);
  if (!fs.readFileSync(fullExistingPreCommit, 'utf8').includes('echo existing')) fail('--mode full --hooks blocking overwrote non-managed pre-commit');
}
