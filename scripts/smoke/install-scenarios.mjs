import fs from 'node:fs';
import path from 'node:path';
import { assertInstalledReferenceIntegrity, assertLegacySkillRenameMigration, assertManagedDeletedSkillRemoval, assertNoInstallSideEffects, fail, hashFile, packageVersion, readManagedSkillsManifest, run, runAny, skillDirs } from './helpers.mjs';
import { runConnectScenarios } from './connect-scenarios.mjs';
import { runModeScenarios } from './mode-scenarios.mjs';
import { runProfileOverwriteScenarios } from './profile-overwrite-scenarios.mjs';

export function runInstallScenarios(ctx) {
  runRefusalScenarios(ctx);
  runDefaultInstall(ctx);
  runProfileOverwriteScenarios(ctx);
  runUpdateScenarios(ctx);
  runLineLimitScenarios(ctx);
  runSkillSetScenarios(ctx);
  runUninstallScenarios(ctx);
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
  const version = packageVersion(root);
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
  if (profile.includes('exit_codes:')) fail('generated profile should not include guard.exit_codes');
  if (hashFile(path.join(repo, 'package.json')) !== ctx.packageHashBefore) fail('install modified target package.json');
  if (hashFile(path.join(repo, 'package-lock.json')) !== ctx.lockHashBefore) fail('install modified target lockfile');
  const defaultPreCommit = path.join(repo, '.git', 'hooks', 'pre-commit');
  if (!fs.existsSync(defaultPreCommit)) fail('install did not create default advisory pre-commit hook');
  if (!fs.readFileSync(defaultPreCommit, 'utf8').includes('mode=advisory')) fail('default pre-commit hook is not advisory');
  if (!fs.readFileSync(defaultPreCommit, 'utf8').includes(`# jhste-skills version=${version}`)) fail('default pre-commit hook missing version comment');
  if (!fs.existsSync(path.join(skillsDir, 'jhste-engineering-groundwork', 'SKILL.md'))) fail('install did not copy jhste-engineering-groundwork skill');
  if (!fs.existsSync(path.join(skillsDir, 'jhste-red-team-review', 'SKILL.md'))) fail('install did not copy jhste-red-team-review skill');
  if (!fs.existsSync(path.join(skillsDir, '.jhste-skills-manifest.json'))) fail('install did not write skills manifest');
  const manifest = readManagedSkillsManifest(skillsDir);
  if (manifest.managed_by !== 'jhste-skills' || !manifest.skills?.['jhste-red-team-review']?.digest) fail('skills manifest missing managed skill digest');
  const defaultSkillDirs = skillDirs(skillsDir);
  if (defaultSkillDirs.length !== 23) fail(`default install should copy 23 bundled skills, got ${defaultSkillDirs.length}`);
  if (!defaultSkillDirs.includes('improve-codebase-architecture')) fail('default install should copy vendored workflow skills');
  if (!fs.existsSync(path.join(skillsDir, '_shared', 'solid-lens.md'))) fail('install did not copy _shared companion resource');
  if (manifest.skills?.['_shared'] && defaultSkillDirs.includes('_shared')) fail('_shared must not be counted as a skill');
  assertInstalledReferenceIntegrity(skillsDir);
}
function runUpdateScenarios({ root, repo, skillsDir }) {
  const version = packageVersion(root);
  const skillPath = path.join(skillsDir, 'jhste-code-quality', 'SKILL.md');
  const sourceSkillPath = path.join(root, 'skills', 'jhste-code-quality', 'SKILL.md');
  const adoptedSkillName = 'triage';
  const adoptedSkillPath = path.join(skillsDir, adoptedSkillName, 'SKILL.md');
  const adoptedSourceSkillPath = path.join(root, 'skills', adoptedSkillName, 'SKILL.md');
  const agentsPath = path.join(repo, 'AGENTS.md');
  const preCommitPath = path.join(repo, '.git', 'hooks', 'pre-commit');

  fs.writeFileSync(skillPath, '# stale local copy\n');
  fs.mkdirSync(path.dirname(adoptedSkillPath), { recursive: true });
  fs.writeFileSync(adoptedSkillPath, '# unmanaged but known skill copy\n');

  const existingAgents = fs.readFileSync(agentsPath, 'utf8');
  const staleAgents = existingAgents.replace(
    'Repo-local instructions in this file remain authoritative.',
    'Old bridge text that should be replaced.',
  );
  fs.writeFileSync(agentsPath, staleAgents);

  fs.writeFileSync(preCommitPath, `#!/usr/bin/env sh
# jhste-skills managed hook start
# mode=blocking hook=pre-commit scope=staged
echo "stale hook"
run_jhste_skills guard --scope staged --format text --fail-on warning
# jhste-skills managed hook end
`, { mode: 0o755 });

  run(process.execPath, [path.join(root, 'cli/update.mjs'), '--yes', '--repo', repo, '--skills-dir', skillsDir], { cwd: repo });

  if (fs.readFileSync(skillPath, 'utf8') !== fs.readFileSync(sourceSkillPath, 'utf8')) {
    fail('update did not refresh an installed skill back to the current source version');
  }
  if (fs.readFileSync(adoptedSkillPath, 'utf8') !== fs.readFileSync(adoptedSourceSkillPath, 'utf8')) {
    fail('update did not adopt and refresh a known jhste skill into an existing managed installation');
  }

  const updatedAgents = fs.readFileSync(agentsPath, 'utf8');
  if (updatedAgents.includes('Old bridge text that should be replaced.')) {
    fail('update did not refresh the managed bridge block');
  }
  if (!updatedAgents.includes('Repo-local instructions in this file remain authoritative.')) {
    fail('update removed the managed bridge guidance');
  }

  const updatedPreCommit = fs.readFileSync(preCommitPath, 'utf8');
  if (!updatedPreCommit.includes('mode=blocking')) fail('update did not preserve managed hook mode');
  if (!updatedPreCommit.includes('--fail-on warning')) fail('update did not preserve managed hook fail-on behavior');
  if (!updatedPreCommit.includes(`# jhste-skills version=${version}`)) fail('update did not refresh hook version comment');
  if (updatedPreCommit.includes('stale hook')) fail('update did not replace stale managed hook content');

  const managedManifest = readManagedSkillsManifest(skillsDir);
  if (!managedManifest.skills?.[adoptedSkillName]?.digest) fail('update did not record adopted known skill in manifest');
  const profilePath = path.join(repo, '.jhste', 'profile.yaml');
  const profileBeforeSkillsOnly = fs.readFileSync(profilePath, 'utf8');
  fs.writeFileSync(skillPath, '# stale local copy for skills-only\n');
  fs.writeFileSync(agentsPath, updatedAgents.replace(
    'Repo-local instructions in this file remain authoritative.',
    'Bridge text that skills-only must not replace.',
  ));
  fs.writeFileSync(preCommitPath, `#!/usr/bin/env sh
# jhste-skills managed hook start
# mode=blocking hook=pre-commit scope=staged
echo "skills-only must not replace hook"
run_jhste_skills guard --scope staged --format text --fail-on warning
# jhste-skills managed hook end
`, { mode: 0o755 });
  run(process.execPath, [path.join(root, 'cli/update.mjs'), '--yes', '--repo', repo, '--skills-dir', skillsDir, '--skills-only'], { cwd: repo });
  if (fs.readFileSync(skillPath, 'utf8') !== fs.readFileSync(sourceSkillPath, 'utf8')) {
    fail('update --skills-only did not refresh an installed skill');
  }
  if (!fs.readFileSync(agentsPath, 'utf8').includes('Bridge text that skills-only must not replace.')) {
    fail('update --skills-only rewrote a managed bridge block');
  }
  if (!fs.readFileSync(preCommitPath, 'utf8').includes('skills-only must not replace hook')) {
    fail('update --skills-only rewrote a managed hook');
  }
  if (fs.readFileSync(profilePath, 'utf8') !== profileBeforeSkillsOnly) {
    fail('update --skills-only rewrote a managed profile');
  }
  let migratedManifest = assertLegacySkillRenameMigration({
    root, repo, skillsDir, manifest: managedManifest, legacyName: 'diagnose', canonicalName: 'diagnosing-bugs', digest: 'legacy-digest',
  });
  migratedManifest = assertLegacySkillRenameMigration({
    root, repo, skillsDir, manifest: migratedManifest, legacyName: 'jhste-engineering-judgment', canonicalName: 'jhste-engineering-groundwork', digest: 'legacy-groundwork-digest',
  });
  migratedManifest = assertManagedDeletedSkillRemoval({ root, repo, skillsDir, manifest: migratedManifest, deletedName: 'write-a-skill', digest: 'legacy-write-skill-digest' });
  const unmanagedSkills = path.join(path.dirname(skillsDir), 'unmanaged-skills');
  fs.mkdirSync(path.join(unmanagedSkills, 'jhste-code-quality'), { recursive: true });
  fs.writeFileSync(path.join(unmanagedSkills, 'jhste-code-quality', 'SKILL.md'), '# unmanaged local copy\n');
  const refused = runAny(process.execPath, [path.join(root, 'cli/update.mjs'), '--yes', '--repo', repo, '--skills-dir', unmanagedSkills, '--skill-set', 'core', '--force'], { cwd: repo });
  if (refused.status !== 3) fail(`update should refuse unmanaged skill overwrite with --force, got ${refused.status}`);
  if (fs.readFileSync(path.join(unmanagedSkills, 'jhste-code-quality', 'SKILL.md'), 'utf8') !== '# unmanaged local copy\n') fail('refused unmanaged update changed local skill');
  run(process.execPath, [path.join(root, 'cli/update.mjs'), '--yes', '--repo', repo, '--skills-dir', unmanagedSkills, '--skill-set', 'core', '--force', '--allow-unmanaged-skill-overwrite'], { cwd: repo });
  if (fs.readFileSync(path.join(unmanagedSkills, 'jhste-code-quality', 'SKILL.md'), 'utf8') !== fs.readFileSync(sourceSkillPath, 'utf8')) {
    fail('explicit unmanaged overwrite did not refresh local skill');
  }
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
  if (allSkillDirs.length !== 23) fail(`--skill-set all should copy 23 skills, got ${allSkillDirs.length}`);
  if (!allSkillDirs.includes('jhste-red-team-review') || !allSkillDirs.includes('improve-codebase-architecture')) fail('--skill-set all missing core or vendored skill');
}

function runUninstallScenarios({ root, tmp }) {
  const uninstallRepo = path.join(tmp, 'uninstall-repo');
  const uninstallSkills = path.join(tmp, 'uninstall-skills');
  initRepo(uninstallRepo);
  fs.writeFileSync(path.join(uninstallRepo, 'AGENTS.md'), '# Uninstall repo\n\nKeep this instruction.\n');
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', uninstallRepo, '--skills-dir', uninstallSkills, '--skip-deep-scan'], { cwd: uninstallRepo });
  if (!fs.existsSync(path.join(uninstallRepo, '.git', 'hooks', 'pre-commit'))) fail('uninstall scenario install did not create hook');
  if (!fs.existsSync(path.join(uninstallSkills, '.jhste-skills-manifest.json'))) fail('uninstall scenario install did not create manifest');
  run(process.execPath, [path.join(root, 'cli/uninstall.mjs'), '--yes', '--repo', uninstallRepo, '--skills-dir', uninstallSkills], { cwd: uninstallRepo });
  if (fs.existsSync(path.join(uninstallRepo, '.git', 'hooks', 'pre-commit'))) fail('uninstall did not remove managed pre-commit hook');
  const agentsAfter = fs.readFileSync(path.join(uninstallRepo, 'AGENTS.md'), 'utf8');
  if (agentsAfter.includes('jhste-skills:start') || !agentsAfter.includes('Keep this instruction.')) fail('uninstall did not remove only the managed bridge block');
  if (fs.existsSync(path.join(uninstallRepo, '.jhste', 'profile.yaml'))) fail('uninstall did not remove generated profile');
  if (fs.existsSync(path.join(uninstallSkills, '.jhste-skills-manifest.json'))) fail('uninstall did not remove skills manifest');
  if (fs.existsSync(uninstallSkills) && skillDirs(uninstallSkills).length !== 0) fail('uninstall did not remove manifest-managed skills');

  const modifiedProfileRepo = path.join(tmp, 'uninstall-modified-profile-repo');
  const modifiedProfileSkills = path.join(tmp, 'uninstall-modified-profile-skills');
  initRepo(modifiedProfileRepo);
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', modifiedProfileRepo, '--skills-dir', modifiedProfileSkills, '--skip-deep-scan', '--skip-hooks'], { cwd: modifiedProfileRepo });
  fs.appendFileSync(path.join(modifiedProfileRepo, '.jhste', 'profile.yaml'), '\ncommands:\n  local-check:\n    cmd: npm\n    args: [test]\n');
  run(process.execPath, [path.join(root, 'cli/uninstall.mjs'), '--yes', '--repo', modifiedProfileRepo, '--skills-dir', modifiedProfileSkills, '--repo-only'], { cwd: modifiedProfileRepo });
  if (!fs.existsSync(path.join(modifiedProfileRepo, '.jhste', 'profile.yaml'))) fail('uninstall removed modified profile without --force-profile');
}
