#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`smoke-test failed: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    fail(`${command} ${args.join(' ')} exited ${result.status}`);
  }
  return result;
}

function runAny(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', ...options });
}

function hashFile(file) {
  return fs.existsSync(file) ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null;
}

function hashDir(dir) {
  const hash = crypto.createHash('sha256');
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(current, entry.name);
      const rel = path.relative(dir, full).replaceAll(path.sep, '/');
      if (entry.isDirectory()) {
        hash.update(`dir:${rel}\n`);
        walk(full);
      } else if (entry.isFile()) {
        hash.update(`file:${rel}\n`);
        hash.update(fs.readFileSync(full));
      }
    }
  }
  if (fs.existsSync(dir)) walk(dir);
  return hash.digest('hex');
}

function skillDirs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function assertNoInstallSideEffects({ repo, skillsDir, agentsBefore, label }) {
  if (fs.existsSync(path.join(repo, '.jhste'))) fail(`${label} created .jhste`);
  if (fs.existsSync(skillsDir)) fail(`${label} touched skills directory`);
  if (fs.readFileSync(path.join(repo, 'AGENTS.md'), 'utf8') !== agentsBefore) fail(`${label} modified AGENTS.md`);
  if (fs.existsSync(path.join(repo, '.git', 'hooks', 'pre-commit'))) fail(`${label} created pre-commit hook`);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jhste-skills-smoke-'));
const repo = path.join(tmp, 'repo');
const skillsDir = path.join(tmp, 'home-skills');
fs.mkdirSync(repo, { recursive: true });
run('git', ['init'], { cwd: repo });
fs.writeFileSync(path.join(repo, 'AGENTS.md'), '# Repo instructions\n\nLocal guidance wins.\n');
fs.writeFileSync(path.join(repo, 'package.json'), '{"name":"smoke-target","scripts":{"test":"echo ok"}}\n');
fs.writeFileSync(path.join(repo, 'package-lock.json'), '{"lockfileVersion":3}\n');
fs.mkdirSync(path.join(repo, 'src'), { recursive: true });
fs.mkdirSync(path.join(repo, 'src', 'app', 'dashboard'), { recursive: true });
fs.mkdirSync(path.join(repo, 'src', 'app', 'orders'), { recursive: true });
fs.mkdirSync(path.join(repo, 'src', 'app', 'api', 'orders'), { recursive: true });
fs.mkdirSync(path.join(repo, 'src', 'app', 'api', 'profile'), { recursive: true });
const emptyCatchFixture = 'catch ' + '{}';
fs.writeFileSync(path.join(repo, 'src', 'route.ts'), `export async function GET() {\n  try {\n    return Response.json({ ok: true });\n  } ${emptyCatchFixture}\n}\n`);
fs.writeFileSync(
  path.join(repo, 'src', 'app', 'dashboard', 'page.tsx'),
  `export default function Page() {\n  return <main>dashboard</main>;\n}\n${Array.from({ length: 205 }, (_, index) => `// page shell line ${index + 1}`).join('\n')}\n`,
);
fs.writeFileSync(
  path.join(repo, 'src', 'app', 'orders', 'client.tsx'),
  `"use client";\nimport { useEffect } from "react";\nconst apiBase = process.env.NEXT_PUBLIC_API_URL;\nexport default function OrdersClient({ items }) {\n  useEffect(() => {\n    fetch(apiBase + "/orders");\n    fetch(apiBase + "/orders");\n  }, []);\n  return <ul>{items!.map((item) => <li key={item.id}>{item.name}</li>)}</ul>;\n}\n`,
);
fs.writeFileSync(
  path.join(repo, 'src', 'app', 'api', 'orders', 'route.ts'),
  `export async function POST(request) {\n  const session = await auth();\n  const body = await request.json();\n  const order = await prisma.order.update({ data: body });\n  return Response.json(order);\n}\n`,
);
fs.writeFileSync(
  path.join(repo, 'src', 'app', 'api', 'profile', 'route.ts'),
  `export async function POST(request) {\n  const body = await request.json();\n  return Response.json(await service.createProfile(body));\n}\n`,
);

const nonInteractiveRepo = path.join(tmp, 'noninteractive-repo');
const nonInteractiveSkills = path.join(tmp, 'noninteractive-skills');
fs.mkdirSync(nonInteractiveRepo, { recursive: true });
run('git', ['init'], { cwd: nonInteractiveRepo });
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
fs.mkdirSync(invalidHookRepo, { recursive: true });
run('git', ['init'], { cwd: invalidHookRepo });
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

const packageHashBefore = hashFile(path.join(repo, 'package.json'));
const lockHashBefore = hashFile(path.join(repo, 'package-lock.json'));
const started = Date.now();
run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', repo, '--skills-dir', skillsDir, '--skip-deep-scan'], { cwd: repo });
const elapsed = Date.now() - started;
if (elapsed > 30000) fail(`install exceeded 30 seconds: ${elapsed}ms`);

const profilePath = path.join(repo, '.jhste', 'profile.yaml');
if (!fs.existsSync(profilePath)) fail('profile was not created');
const profile = fs.readFileSync(profilePath, 'utf8');
if (!/^mode: advisory$/m.test(profile)) fail('profile default mode is not advisory');
if (/mode:\s*strict/.test(profile)) fail('profile enabled strict mode');
if (!profile.includes('auto_for_non_trivial_code_changes: true')) fail('profile missing red-team review workflow guidance');
if (hashFile(path.join(repo, 'package.json')) !== packageHashBefore) fail('install modified target package.json');
if (hashFile(path.join(repo, 'package-lock.json')) !== lockHashBefore) fail('install modified target lockfile');
const defaultPreCommit = path.join(repo, '.git', 'hooks', 'pre-commit');
if (!fs.existsSync(defaultPreCommit)) fail('install did not create default advisory pre-commit hook');
if (!fs.readFileSync(defaultPreCommit, 'utf8').includes('mode=advisory')) fail('default pre-commit hook is not advisory');
if (!fs.existsSync(path.join(skillsDir, 'jhste-red-team-review', 'SKILL.md'))) fail('install did not copy jhste-red-team-review skill');
const defaultSkillDirs = skillDirs(skillsDir);
if (defaultSkillDirs.length !== 7) fail(`default install should copy 7 core skills, got ${defaultSkillDirs.length}`);
if (defaultSkillDirs.includes('improve-codebase-architecture')) fail('default install should not copy vendored workflow skills');

const vendorRepo = path.join(tmp, 'vendor-skill-repo');
const vendorSkillsDir = path.join(tmp, 'vendor-skills');
fs.mkdirSync(vendorRepo, { recursive: true });
run('git', ['init'], { cwd: vendorRepo });
fs.writeFileSync(path.join(vendorRepo, 'AGENTS.md'), '# Vendor skill repo\n');
run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', vendorRepo, '--skills-dir', vendorSkillsDir, '--skip-deep-scan', '--skip-hooks', '--skill-set', 'vendor'], { cwd: vendorRepo });
const vendorSkillDirs = skillDirs(vendorSkillsDir);
if (vendorSkillDirs.length !== 14) fail(`--skill-set vendor should copy 14 skills, got ${vendorSkillDirs.length}`);
if (!vendorSkillDirs.includes('improve-codebase-architecture')) fail('--skill-set vendor did not copy expected vendored skill');
if (vendorSkillDirs.includes('jhste-red-team-review')) fail('--skill-set vendor copied core skill');

const allRepo = path.join(tmp, 'all-skill-repo');
const allSkillsDir = path.join(tmp, 'all-skills');
fs.mkdirSync(allRepo, { recursive: true });
run('git', ['init'], { cwd: allRepo });
fs.writeFileSync(path.join(allRepo, 'AGENTS.md'), '# All skill repo\n');
run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', allRepo, '--skills-dir', allSkillsDir, '--skip-deep-scan', '--skip-hooks', '--skill-set', 'all'], { cwd: allRepo });
const allSkillDirs = skillDirs(allSkillsDir);
if (allSkillDirs.length !== 21) fail(`--skill-set all should copy 21 skills, got ${allSkillDirs.length}`);
if (!allSkillDirs.includes('jhste-red-team-review') || !allSkillDirs.includes('improve-codebase-architecture')) fail('--skill-set all missing core or vendored skill');

const customYesRepo = path.join(tmp, 'custom-yes-repo');
const customYesSkills = path.join(tmp, 'custom-yes-skills');
fs.mkdirSync(customYesRepo, { recursive: true });
run('git', ['init'], { cwd: customYesRepo });
const customYesInstall = runAny(process.execPath, [path.join(root, 'cli/install.mjs'), '--mode', 'custom', '--yes', '--repo', customYesRepo, '--skills-dir', customYesSkills], { cwd: customYesRepo });
if (customYesInstall.status !== 3) fail(`install --mode custom --yes should exit 3, got ${customYesInstall.status}`);
if (fs.existsSync(path.join(customYesRepo, '.jhste'))) fail('install --mode custom --yes created repo files');
if (fs.existsSync(customYesSkills)) fail('install --mode custom --yes created skills');

const minimalRepo = path.join(tmp, 'minimal-repo');
const minimalSkillsDir = path.join(tmp, 'minimal-skills');
fs.mkdirSync(minimalRepo, { recursive: true });
run('git', ['init'], { cwd: minimalRepo });
fs.writeFileSync(path.join(minimalRepo, 'AGENTS.md'), '# Minimal repo\n');
run(process.execPath, [path.join(root, 'cli/install.mjs'), '--mode', 'minimal', '--yes', '--repo', minimalRepo, '--skills-dir', minimalSkillsDir, '--skip-deep-scan'], { cwd: minimalRepo });
const minimalSkillDirs = skillDirs(minimalSkillsDir);
if (minimalSkillDirs.length !== 7) fail(`--mode minimal should copy 7 core skills, got ${minimalSkillDirs.length}`);
if (fs.existsSync(path.join(minimalRepo, '.jhste'))) fail('--mode minimal created .jhste');
if (fs.existsSync(path.join(minimalRepo, '.git', 'hooks', 'pre-commit'))) fail('--mode minimal created pre-commit hook');
if (fs.readFileSync(path.join(minimalRepo, 'AGENTS.md'), 'utf8') !== '# Minimal repo\n') fail('--mode minimal modified AGENTS.md');

const minimalHookRepo = path.join(tmp, 'minimal-hook-repo');
const minimalHookSkillsDir = path.join(tmp, 'minimal-hook-skills');
fs.mkdirSync(minimalHookRepo, { recursive: true });
run('git', ['init'], { cwd: minimalHookRepo });
run(process.execPath, [path.join(root, 'cli/install.mjs'), '--mode', 'minimal', '--hooks', 'advisory', '--yes', '--repo', minimalHookRepo, '--skills-dir', minimalHookSkillsDir, '--skip-deep-scan'], { cwd: minimalHookRepo });
if (!fs.existsSync(path.join(minimalHookRepo, '.git', 'hooks', 'pre-commit'))) fail('--mode minimal --hooks advisory did not install explicit hook');
if (fs.existsSync(path.join(minimalHookRepo, '.jhste'))) fail('--mode minimal --hooks advisory should not create profile');

const fullModeRepo = path.join(tmp, 'full-mode-repo');
const fullModeSkillsDir = path.join(tmp, 'full-mode-skills');
fs.mkdirSync(fullModeRepo, { recursive: true });
run('git', ['init'], { cwd: fullModeRepo });
fs.writeFileSync(path.join(fullModeRepo, 'AGENTS.md'), '# Full mode repo\n');
run(process.execPath, [path.join(root, 'cli/install.mjs'), '--mode', 'full', '--yes', '--repo', fullModeRepo, '--skills-dir', fullModeSkillsDir, '--skip-deep-scan'], { cwd: fullModeRepo });
const fullModeSkillDirs = skillDirs(fullModeSkillsDir);
if (fullModeSkillDirs.length !== 21) fail(`--mode full should copy 21 skills, got ${fullModeSkillDirs.length}`);
const fullPreCommit = path.join(fullModeRepo, '.git', 'hooks', 'pre-commit');
const fullPrePush = path.join(fullModeRepo, '.git', 'hooks', 'pre-push');
if (!fs.existsSync(fullPreCommit) || !fs.existsSync(fullPrePush)) fail('--mode full did not install pre-commit and pre-push');
if (!fs.readFileSync(fullPreCommit, 'utf8').includes('mode=advisory')) fail('--mode full pre-commit is not advisory by default');
if (!fs.readFileSync(fullPrePush, 'utf8').includes('mode=advisory')) fail('--mode full pre-push is not advisory by default');
if (!fs.readFileSync(path.join(fullModeRepo, 'AGENTS.md'), 'utf8').includes('jhste-skills:start')) fail('--mode full bridge missing managed marker');

const fullBlockingRepo = path.join(tmp, 'full-blocking-repo');
const fullBlockingSkillsDir = path.join(tmp, 'full-blocking-skills');
fs.mkdirSync(fullBlockingRepo, { recursive: true });
run('git', ['init'], { cwd: fullBlockingRepo });
run(process.execPath, [path.join(root, 'cli/install.mjs'), '--mode', 'full', '--hooks', 'blocking', '--yes', '--repo', fullBlockingRepo, '--skills-dir', fullBlockingSkillsDir, '--skip-deep-scan'], { cwd: fullBlockingRepo });
if (!fs.readFileSync(path.join(fullBlockingRepo, '.git', 'hooks', 'pre-commit'), 'utf8').includes('mode=blocking')) fail('--mode full --hooks blocking pre-commit not blocking');
if (!fs.readFileSync(path.join(fullBlockingRepo, '.git', 'hooks', 'pre-push'), 'utf8').includes('mode=blocking')) fail('--mode full --hooks blocking pre-push not blocking');

const fullExistingHookRepo = path.join(tmp, 'full-existing-hook-repo');
const fullExistingHookSkillsDir = path.join(tmp, 'full-existing-hook-skills');
fs.mkdirSync(fullExistingHookRepo, { recursive: true });
run('git', ['init'], { cwd: fullExistingHookRepo });
const fullExistingPreCommit = path.join(fullExistingHookRepo, '.git', 'hooks', 'pre-commit');
fs.writeFileSync(fullExistingPreCommit, '#!/usr/bin/env sh\necho existing\n', { mode: 0o755 });
run(process.execPath, [path.join(root, 'cli/install.mjs'), '--mode', 'full', '--yes', '--repo', fullExistingHookRepo, '--skills-dir', fullExistingHookSkillsDir, '--skip-deep-scan'], { cwd: fullExistingHookRepo });
if (!fs.readFileSync(fullExistingPreCommit, 'utf8').includes('echo existing')) fail('--mode full overwrote non-managed pre-commit');
if (!fs.existsSync(path.join(fullExistingHookRepo, '.git', 'hooks', 'pre-push'))) fail('--mode full did not install pre-push when pre-commit was non-managed');
const fullBlockingExistingHook = runAny(process.execPath, [path.join(root, 'cli/install.mjs'), '--mode', 'full', '--hooks', 'blocking', '--yes', '--repo', fullExistingHookRepo, '--skills-dir', fullExistingHookSkillsDir, '--skip-deep-scan'], { cwd: fullExistingHookRepo });
if (fullBlockingExistingHook.status !== 3) fail(`--mode full --hooks blocking with non-managed pre-commit should exit 3, got ${fullBlockingExistingHook.status}`);
if (!fs.readFileSync(fullExistingPreCommit, 'utf8').includes('echo existing')) fail('--mode full --hooks blocking overwrote non-managed pre-commit');

const nonGitCwd = path.join(tmp, 'non-git-cwd');
const nonGitCwdSkills = path.join(tmp, 'non-git-cwd-skills');
fs.mkdirSync(nonGitCwd, { recursive: true });
run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--skills-dir', nonGitCwdSkills, '--skip-deep-scan'], { cwd: nonGitCwd });
if (fs.existsSync(path.join(nonGitCwd, '.jhste'))) fail('install outside git repo created .jhste');
if (skillDirs(nonGitCwdSkills).length !== 7) fail('install outside git repo did not install core skills');

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
fs.mkdirSync(connectMinimalRepo, { recursive: true });
run('git', ['init'], { cwd: connectMinimalRepo });
const connectMinimal = runAny(process.execPath, [path.join(root, 'cli/connect.mjs'), '--mode', 'minimal', '--yes', '--repo', connectMinimalRepo, '--skills-dir', skillsDir, '--skip-deep-scan'], { cwd: connectMinimalRepo });
if (connectMinimal.status !== 3) fail(`connect --mode minimal should exit 3, got ${connectMinimal.status}`);
if (fs.existsSync(path.join(connectMinimalRepo, '.jhste'))) fail('connect --mode minimal created .jhste');

const connectMissingRepo = path.join(tmp, 'connect-missing-repo');
const connectMissingSkills = path.join(tmp, 'connect-missing-skills');
fs.mkdirSync(connectMissingRepo, { recursive: true });
run('git', ['init'], { cwd: connectMissingRepo });
const connectMissing = runAny(process.execPath, [path.join(root, 'cli/connect.mjs'), '--mode', 'normal', '--yes', '--repo', connectMissingRepo, '--skills-dir', connectMissingSkills, '--skip-deep-scan'], { cwd: connectMissingRepo });
if (connectMissing.status !== 3) fail(`connect missing skills should exit 3, got ${connectMissing.status}`);
if (fs.existsSync(path.join(connectMissingRepo, '.jhste'))) fail('connect missing skills created .jhste');
run(process.execPath, [path.join(root, 'cli/connect.mjs'), '--mode', 'normal', '--yes', '--repo', connectMissingRepo, '--skills-dir', connectMissingSkills, '--skip-deep-scan', '--install-missing'], { cwd: connectMissingRepo });
if (skillDirs(connectMissingSkills).length !== 7) fail('connect --install-missing did not install core skills');
if (!fs.existsSync(path.join(connectMissingRepo, '.jhste', 'profile.yaml'))) fail('connect --install-missing did not create profile');

const skipHookRepo = path.join(tmp, 'skip-hook-repo');
fs.mkdirSync(skipHookRepo, { recursive: true });
run('git', ['init'], { cwd: skipHookRepo });
fs.writeFileSync(path.join(skipHookRepo, 'AGENTS.md'), '# Skip hook repo\n');
run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', skipHookRepo, '--skills-dir', skillsDir, '--skip-deep-scan', '--skip-hooks'], { cwd: skipHookRepo });
if (fs.existsSync(path.join(skipHookRepo, '.git', 'hooks', 'pre-commit'))) fail('install --skip-hooks created pre-commit hook');

const existingHookRepo = path.join(tmp, 'existing-hook-repo');
fs.mkdirSync(existingHookRepo, { recursive: true });
run('git', ['init'], { cwd: existingHookRepo });
fs.writeFileSync(path.join(existingHookRepo, 'AGENTS.md'), '# Existing hook repo\n');
const existingPreCommit = path.join(existingHookRepo, '.git', 'hooks', 'pre-commit');
fs.writeFileSync(existingPreCommit, '#!/usr/bin/env sh\necho existing\n', { mode: 0o755 });
run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', existingHookRepo, '--skills-dir', skillsDir, '--skip-deep-scan'], { cwd: existingHookRepo });
if (!fs.readFileSync(existingPreCommit, 'utf8').includes('echo existing')) fail('default install overwrote non-managed pre-commit hook');

const hookRepo = path.join(tmp, 'hook-repo');
fs.mkdirSync(hookRepo, { recursive: true });
run('git', ['init'], { cwd: hookRepo });
fs.writeFileSync(path.join(hookRepo, 'AGENTS.md'), '# Hook repo\n');
fs.writeFileSync(path.join(hookRepo, 'package.json'), '{"name":"hook-target"}\n');
const hookPackageHashBefore = hashFile(path.join(hookRepo, 'package.json'));
run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', hookRepo, '--skills-dir', skillsDir, '--skip-deep-scan', '--hooks', 'advisory'], { cwd: hookRepo });
const hookPreCommit = path.join(hookRepo, '.git', 'hooks', 'pre-commit');
if (!fs.existsSync(hookPreCommit)) fail('install --hooks advisory did not create pre-commit hook');
if (!fs.readFileSync(hookPreCommit, 'utf8').includes('mode=advisory')) fail('install --hooks advisory did not create advisory hook');
if (hashFile(path.join(hookRepo, 'package.json')) !== hookPackageHashBefore) fail('install --hooks modified target package.json');

const agentsAfterFirst = fs.readFileSync(path.join(repo, 'AGENTS.md'), 'utf8');
const bridgeCount = (agentsAfterFirst.match(/Repo-local instructions in this file remain authoritative\./g) || []).length;
if (bridgeCount !== 1) fail('bridge block was not inserted exactly once');
if ((agentsAfterFirst.match(/jhste-skills:start/g) || []).length !== 1 || (agentsAfterFirst.match(/jhste-skills:end/g) || []).length !== 1) fail('bridge block missing managed markers');
if (!agentsAfterFirst.includes('jhste-red-team-review')) fail('bridge block missing red-team review guidance');

fs.appendFileSync(profilePath, '# keep-existing-profile-marker\n');
run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', repo, '--skills-dir', skillsDir, '--skip-deep-scan'], { cwd: repo });
const agentsAfterSecond = fs.readFileSync(path.join(repo, 'AGENTS.md'), 'utf8');
const bridgeCountSecond = (agentsAfterSecond.match(/Repo-local instructions in this file remain authoritative\./g) || []).length;
if (bridgeCountSecond !== 1) fail('bridge block is not idempotent');
if (!fs.readFileSync(profilePath, 'utf8').includes('keep-existing-profile-marker')) fail('existing profile was overwritten without force');

const sourceHashBeforeScan = hashFile(path.join(repo, 'src', 'route.ts'));
run(process.execPath, [path.join(root, 'cli/deep-scan.mjs'), '--repo', repo], { cwd: repo });
if (hashFile(path.join(repo, 'src', 'route.ts')) !== sourceHashBeforeScan) fail('deep scan modified source code');
if (hashFile(path.join(repo, 'package.json')) !== packageHashBefore) fail('deep scan modified target package.json');
if (!fs.existsSync(path.join(repo, '.jhste', 'deep-scan-report.md'))) fail('deep scan report missing');
if (!fs.existsSync(path.join(repo, '.jhste', 'profile.recommended.yaml'))) fail('recommended profile missing');
const report = fs.readFileSync(path.join(repo, '.jhste', 'deep-scan-report.md'), 'utf8');
if (!report.includes('Existing responsibility budget candidates')) fail('responsibility budget report section missing');
if (!report.includes('src/app/dashboard/page.tsx:1')) fail('Next page responsibility budget candidate missing');
if (!report.includes('Existing external input validation candidates')) fail('deep scan report missing external input section');
if (!report.includes('src/app/api/profile/route.ts:1')) fail('deep scan did not report shared external input candidate');
for (const heading of [
  'Existing null/state safety candidates',
  'Existing auth/data isolation candidates',
  'Existing runtime/env safety candidates',
  'Existing write safety candidates',
  'Existing API contract candidates',
  'Existing performance duplication candidates',
]) {
  if (!report.includes(heading)) fail(`deep scan report missing section ${heading}`);
}
const recommended = fs.readFileSync(path.join(repo, '.jhste', 'profile.recommended.yaml'), 'utf8');
if (/mode:\s*strict/.test(recommended) || /enabled:\s*true/.test(recommended)) fail('recommended profile enabled strict mode');
if (!recommended.includes('responsibility_budget:')) fail('recommended profile missing responsibility budget rule');
for (const ruleName of ['null_state_safety:', 'authz_data_isolation:', 'build_runtime_env_safety:', 'write_safety_idempotency:', 'api_contract_compatibility:', 'performance_duplicate_fetch:']) {
  if (!recommended.includes(ruleName)) fail(`recommended profile missing ${ruleName}`);
}

const guardJson = run(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--format', 'json', '--fail-on', 'none'], { cwd: repo }).stdout;
const guardResult = JSON.parse(guardJson);
if (guardResult.schema_version !== 1) fail('guard JSON schema_version missing');
if (guardResult.meta?.tool_version !== '0.1.0') fail('guard JSON meta tool_version missing');
if (typeof guardResult.meta?.files_considered !== 'number') fail('guard JSON meta files_considered missing');
if (!guardResult.violations.some(item => item.rule_id === 'silent.catch.empty')) fail('guard did not report empty catch');
if (!guardResult.violations.some(item => item.rule_id === 'responsibility.page.budget')) fail('guard did not report responsibility budget');
if (!guardResult.violations.some(item => item.rule_id === 'state.non_null_assertion')) fail('guard did not report null/state safety');
if (!guardResult.violations.some(item => item.rule_id === 'authz.scope_not_visible')) fail('guard did not report auth/data isolation');
if (!guardResult.violations.some(item => item.rule_id === 'runtime.env_direct_access')) fail('guard did not report runtime/env safety');
if (!guardResult.violations.some(item => item.rule_id === 'write.mutation_retry_safety')) fail('guard did not report write safety');
if (!guardResult.violations.some(item => item.rule_id === 'contract.boundary_without_schema')) fail('guard did not report API contract compatibility');
if (!guardResult.violations.some(item => item.rule_id === 'performance.multiple_fetch_sources')) fail('guard did not report performance duplication');
const sharedExternalInputPath = 'src/app/api/profile/route.ts:1';
const guardSharedExternalInput = guardResult.violations.some(item => item.rule_id === 'input.request_body_direct_use' && item.path.includes('src/app/api/profile/route.ts'));
const deepScanSharedExternalInput = report.includes(sharedExternalInputPath);
if (!guardSharedExternalInput) fail('guard did not report shared external input candidate');
if (!deepScanSharedExternalInput) fail('deep scan did not report shared external input candidate');
if (!guardSharedExternalInput || !deepScanSharedExternalInput) fail('guard and deep-scan did not agree on shared external input scanner family');
if (!guardResult.violations.some(item => item.category === 'heuristic_candidate' && item.why_not_proof)) fail('guard JSON did not expose heuristic finding interpretation');
const failingGuard = runAny(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--format', 'json', '--fail-on', 'error'], { cwd: repo });
if (failingGuard.status !== 1) fail(`guard --fail-on error should exit 1, got ${failingGuard.status}`);
const missingRatchet = runAny(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--baseline', 'ratchet', '--baseline-path', '.jhste/missing-baseline.json', '--format', 'json'], { cwd: repo });
if (missingRatchet.status !== 3) fail(`guard ratchet without baseline should exit 3, got ${missingRatchet.status}`);
const filesFrom = path.join(tmp, 'files.zlist');
fs.writeFileSync(filesFrom, `/etc/passwd\0${path.join(repo, 'src', 'route.ts')}\0`);
const filesFromGuard = runAny(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'files-from', '--files-from', filesFrom, '--format', 'json'], { cwd: repo });
if (filesFromGuard.status !== 2) fail(`guard files-from outside repo should exit 2, got ${filesFromGuard.status}`);
run(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--baseline', 'update', '--format', 'json'], { cwd: repo });
if (!fs.existsSync(path.join(repo, '.jhste', 'baseline.json'))) fail('guard baseline update did not create baseline');
const hookBaselineUpdate = runAny(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--baseline', 'update', '--format', 'json'], {
  cwd: repo,
  env: { ...process.env, JHSTE_HOOK_ACTIVE: '1' },
});
if (hookBaselineUpdate.status !== 3) fail(`guard baseline write inside managed hook should exit 3, got ${hookBaselineUpdate.status}`);
const baselineUse = JSON.parse(run(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--baseline', 'use', '--format', 'json', '--fail-on', 'error'], { cwd: repo }).stdout);
if (baselineUse.summary.suppressed < 1) fail('guard baseline use did not suppress known violations');

const fakeOpenAiKey = 'sk-' + 'A'.repeat(24);
const fakeGithubToken = 'gh' + 'p_' + 'B'.repeat(36);
const fakeGenericSecret = 'C'.repeat(16);
const secretLikeOutput = [
  fakeOpenAiKey,
  fakeGithubToken,
  `token=${fakeGenericSecret}`,
  `password=${fakeGenericSecret}`,
  `api_key=${fakeGenericSecret}`,
  `authorization=${fakeGenericSecret}`,
  `cookie=${fakeGenericSecret}`,
  `session=${fakeGenericSecret}`,
].join(' ');
fs.appendFileSync(profilePath, `\ncommands:\n  - name: local-check\n    run: printf '%s' '${secretLikeOutput}'; exit 1\n    timeout_seconds: 5\n`);
const profileGuardRaw = runAny(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--run-profile-commands', '--format', 'json', '--fail-on', 'error'], { cwd: repo }).stdout;
const profileGuard = JSON.parse(profileGuardRaw);
if (!profileGuard.violations.some(item => item.rule_id === 'profile.command.local-check' && item.source === 'profile')) fail('profile command failure was not reported as profile violation');
for (const rawSecret of [fakeOpenAiKey, fakeGithubToken, fakeGenericSecret]) {
  if (profileGuardRaw.includes(rawSecret)) fail('profile command output exposed secret-like value');
}
if (!profileGuardRaw.includes('[REDACTED_')) fail('profile command output did not include redaction marker');
const hookProfileGuard = runAny(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--run-profile-commands', '--format', 'json', '--fail-on', 'error'], {
  cwd: repo,
  env: { ...process.env, JHSTE_HOOK_ACTIVE: '1' },
});
if (hookProfileGuard.status !== 3) fail(`guard run-profile-commands inside managed hook should exit 3, got ${hookProfileGuard.status}`);

run(process.execPath, [path.join(root, 'cli/hooks.mjs'), 'install', '--repo', repo, '--mode', 'advisory'], { cwd: repo });
const preCommit = path.join(repo, '.git', 'hooks', 'pre-commit');
if (!fs.readFileSync(preCommit, 'utf8').includes('jhste-skills managed hook start')) fail('managed pre-commit hook missing marker');
run('sh', [preCommit], { cwd: repo });
const nestedHook = run('sh', [preCommit], { cwd: repo, env: { ...process.env, JHSTE_HOOK_ACTIVE: '1' } });
if (!nestedHook.stdout.includes('nested managed hook invocation skipped')) fail('managed hook did not skip nested invocation');
run(process.execPath, [path.join(root, 'cli/hooks.mjs'), 'uninstall', '--repo', repo], { cwd: repo });
if (fs.existsSync(preCommit)) fail('managed pre-commit hook was not removed');
fs.writeFileSync(preCommit, '#!/usr/bin/env sh\necho existing\n', { mode: 0o755 });
const refusedHook = runAny(process.execPath, [path.join(root, 'cli/hooks.mjs'), 'install', '--repo', repo], { cwd: repo });
if (refusedHook.status !== 3) fail(`hooks install should refuse non-managed hook, got ${refusedHook.status}`);
if (!fs.readFileSync(preCommit, 'utf8').includes('echo existing')) fail('hooks install overwrote non-managed hook');
if (hashFile(path.join(repo, 'package.json')) !== packageHashBefore) fail('hooks modified target package.json');

console.log(`smoke-test passed in ${elapsed}ms: install/connect modes, hook safety, bridge idempotency, overwrite protection, deep scan read-only behavior, and guard contract verified.`);
