import fs from 'node:fs';
import path from 'node:path';
import { fail, run, runAny, skillDirs } from './helpers.mjs';

function initRepo(repo) {
  fs.mkdirSync(repo, { recursive: true });
  run('git', ['init'], { cwd: repo });
}

export function runConnectScenarios({ root, tmp, skillsDir }) {
  const nonGitCwd = path.join(tmp, 'non-git-cwd');
  const nonGitCwdSkills = path.join(tmp, 'non-git-cwd-skills');
  fs.mkdirSync(nonGitCwd, { recursive: true });
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--skills-dir', nonGitCwdSkills, '--skip-deep-scan'], { cwd: nonGitCwd });
  if (fs.existsSync(path.join(nonGitCwd, '.jhste'))) fail('install outside git repo created .jhste');
  if (skillDirs(nonGitCwdSkills).length !== 21) fail('install outside git repo did not install 21 bundled skills');

  const explicitNonGitRepo = path.join(tmp, 'explicit-non-git-repo');
  const explicitNonGitSkills = path.join(tmp, 'explicit-non-git-skills');
  fs.mkdirSync(explicitNonGitRepo, { recursive: true });
  const explicitNonGitInstall = runAny(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', explicitNonGitRepo, '--skills-dir', explicitNonGitSkills, '--skip-deep-scan'], { cwd: explicitNonGitRepo });
  if (explicitNonGitInstall.status !== 3) fail(`install --repo non-git should exit 3, got ${explicitNonGitInstall.status}`);
  if (fs.existsSync(path.join(explicitNonGitRepo, '.jhste'))) fail('install --repo non-git created .jhste');
  if (fs.existsSync(explicitNonGitSkills)) fail('install --repo non-git created skills');

  const connectNoRepo = path.join(tmp, 'connect-no-repo');
  fs.mkdirSync(connectNoRepo, { recursive: true });
  const connectNoRepoResult = runAny(process.execPath, [path.join(root, 'cli/connect.mjs'), '--yes', '--repo', connectNoRepo, '--skills-dir', skillsDir, '--skip-deep-scan'], { cwd: connectNoRepo });
  if (connectNoRepoResult.status !== 3) fail(`connect outside git repo should exit 3, got ${connectNoRepoResult.status}`);
  if (fs.existsSync(path.join(connectNoRepo, '.jhste'))) fail('connect outside git repo created .jhste');

  const connectMinimalRepo = path.join(tmp, 'connect-minimal-repo');
  initRepo(connectMinimalRepo);
  const connectMinimal = runAny(process.execPath, [path.join(root, 'cli/connect.mjs'), '--mode', 'minimal', '--yes', '--repo', connectMinimalRepo, '--skills-dir', skillsDir, '--skip-deep-scan'], { cwd: connectMinimalRepo });
  if (connectMinimal.status !== 3) fail(`connect --mode minimal should exit 3, got ${connectMinimal.status}`);
  if (fs.existsSync(path.join(connectMinimalRepo, '.jhste'))) fail('connect --mode minimal created .jhste');

  const connectMissingRepo = path.join(tmp, 'connect-missing-repo');
  const connectMissingSkills = path.join(tmp, 'connect-missing-skills');
  initRepo(connectMissingRepo);
  const connectMissing = runAny(process.execPath, [path.join(root, 'cli/connect.mjs'), '--mode', 'normal', '--yes', '--repo', connectMissingRepo, '--skills-dir', connectMissingSkills, '--skip-deep-scan'], { cwd: connectMissingRepo });
  if (connectMissing.status !== 3) fail(`connect missing skills should exit 3, got ${connectMissing.status}`);
  if (fs.existsSync(path.join(connectMissingRepo, '.jhste'))) fail('connect missing skills created .jhste');
  run(process.execPath, [path.join(root, 'cli/connect.mjs'), '--mode', 'normal', '--yes', '--repo', connectMissingRepo, '--skills-dir', connectMissingSkills, '--skip-deep-scan', '--install-missing'], { cwd: connectMissingRepo });
  if (skillDirs(connectMissingSkills).length !== 21) fail('connect --install-missing did not install 21 bundled skills');
  if (!fs.existsSync(path.join(connectMissingRepo, '.jhste', 'profile.yaml'))) fail('connect --install-missing did not create profile');
}
