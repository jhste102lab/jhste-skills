import fs from 'node:fs';
import path from 'node:path';
import {
  fail,
  hashFile,
  packageVersion,
  parseJsonOutput,
  run,
  runAny,
} from './helpers.mjs';

export function runGuardAndHookScenarios(ctx) {
  runHookInstallContracts(ctx);
  runBridgeAndDeepScanContracts(ctx);
  runGuardContracts(ctx);
  runProfileCommandAndHookContracts(ctx);
}

function initRepo(repo) {
  fs.mkdirSync(repo, { recursive: true });
  run('git', ['init'], { cwd: repo });
}

function runHookInstallContracts({ root, tmp, skillsDir }) {
  const skipHookRepo = path.join(tmp, 'skip-hook-repo');
  initRepo(skipHookRepo);
  fs.writeFileSync(path.join(skipHookRepo, 'AGENTS.md'), '# Skip hook repo\n');
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', skipHookRepo, '--skills-dir', skillsDir, '--skip-deep-scan', '--skip-hooks'], { cwd: skipHookRepo });
  if (fs.existsSync(path.join(skipHookRepo, '.git', 'hooks', 'pre-commit'))) fail('install --skip-hooks created pre-commit hook');

  const existingHookRepo = path.join(tmp, 'existing-hook-repo');
  initRepo(existingHookRepo);
  fs.writeFileSync(path.join(existingHookRepo, 'AGENTS.md'), '# Existing hook repo\n');
  const existingPreCommit = path.join(existingHookRepo, '.git', 'hooks', 'pre-commit');
  fs.writeFileSync(existingPreCommit, '#!/usr/bin/env sh\necho existing\n', { mode: 0o755 });
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', existingHookRepo, '--skills-dir', skillsDir, '--skip-deep-scan'], { cwd: existingHookRepo });
  if (!fs.readFileSync(existingPreCommit, 'utf8').includes('echo existing')) fail('default install overwrote non-managed pre-commit hook');

  const hookRepo = path.join(tmp, 'hook-repo');
  initRepo(hookRepo);
  fs.writeFileSync(path.join(hookRepo, 'AGENTS.md'), '# Hook repo\n');
  fs.writeFileSync(path.join(hookRepo, 'package.json'), '{"name":"hook-target"}\n');
  const hookPackageHashBefore = hashFile(path.join(hookRepo, 'package.json'));
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', hookRepo, '--skills-dir', skillsDir, '--skip-deep-scan', '--hooks', 'advisory'], { cwd: hookRepo });
  const hookPreCommit = path.join(hookRepo, '.git', 'hooks', 'pre-commit');
  if (!fs.existsSync(hookPreCommit)) fail('install --hooks advisory did not create pre-commit hook');
  if (!fs.readFileSync(hookPreCommit, 'utf8').includes('mode=advisory')) fail('install --hooks advisory did not create advisory hook');
  if (hashFile(path.join(hookRepo, 'package.json')) !== hookPackageHashBefore) fail('install --hooks modified target package.json');
}

function runBridgeAndDeepScanContracts(ctx) {
  const { root, repo, profilePath, packageHashBefore } = ctx;
  const agentsAfterFirst = fs.readFileSync(path.join(repo, 'AGENTS.md'), 'utf8');
  const bridgeCount = (agentsAfterFirst.match(/Repo-local instructions in this file remain authoritative\./g) || []).length;
  if (bridgeCount !== 1) fail('bridge block was not inserted exactly once');
  if ((agentsAfterFirst.match(/jhste-skills:start/g) || []).length !== 1 || (agentsAfterFirst.match(/jhste-skills:end/g) || []).length !== 1) fail('bridge block missing managed markers');
  if (!agentsAfterFirst.includes('jhste-red-team-review')) fail('bridge block missing red-team review guidance');

  fs.appendFileSync(profilePath, '# keep-existing-profile-marker\n');
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', repo, '--skills-dir', ctx.skillsDir, '--skip-deep-scan'], { cwd: repo });
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
  ctx.report = fs.readFileSync(path.join(repo, '.jhste', 'deep-scan-report.md'), 'utf8');
  assertDeepScanReport(ctx.report);
  const recommended = fs.readFileSync(path.join(repo, '.jhste', 'profile.recommended.yaml'), 'utf8');
  if (/mode:\s*strict/.test(recommended) || /enabled:\s*true/.test(recommended)) fail('recommended profile enabled strict mode');
  if (!recommended.includes('responsibility_budget:')) fail('recommended profile missing responsibility budget rule');
  for (const ruleName of ['null_state_safety:', 'authz_data_isolation:', 'build_runtime_env_safety:', 'write_safety_idempotency:', 'api_contract_compatibility:', 'performance_duplicate_fetch:']) {
    if (!recommended.includes(ruleName)) fail(`recommended profile missing ${ruleName}`);
  }
  const profileBeforeTune = fs.readFileSync(profilePath, 'utf8');
  run(process.execPath, [path.join(root, 'cli/tune.mjs'), '--repo', repo, '--yes'], { cwd: repo });
  const tunedGuard = run(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--format', 'json', '--fail-on', 'none'], { cwd: repo });
  const tunedGuardResult = parseJsonOutput(tunedGuard.stdout, 'tuned guard result');
  if (tunedGuardResult.meta?.baseline_path !== '.jhste/baseline.json') fail('deep-scan -> tune -> guard did not preserve baseline path');
  if (!tunedGuardResult.violations.some((item) => item.rule_family === 'external_input_validation')) fail('deep-scan -> tune -> guard did not keep shared scanner findings active');
  fs.writeFileSync(profilePath, profileBeforeTune);
}

function assertDeepScanReport(report) {
  if (!report.includes('File collection source: git-ls-files')) fail('deep scan report missing git-backed file collection source');
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
}

function runGuardContracts(ctx) {
  const { root, repo, report, tmp } = ctx;
  const version = packageVersion(root);
  const guardJson = run(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--format', 'json', '--fail-on', 'none'], { cwd: repo }).stdout;
  const guardResult = parseJsonOutput(guardJson, 'guard result');
  if (guardResult.schema_version !== 1) fail('guard JSON schema_version missing');
  if (guardResult.meta?.tool_version !== version) fail('guard JSON meta tool_version missing');
  if (typeof guardResult.meta?.files_considered !== 'number') fail('guard JSON meta files_considered missing');
  for (const [ruleId, message] of [
    ['silent.catch.empty', 'guard did not report empty catch'],
    ['responsibility.page.budget', 'guard did not report responsibility budget'],
    ['state.non_null_assertion', 'guard did not report null/state safety'],
    ['authz.scope_not_visible', 'guard did not report auth/data isolation'],
    ['runtime.env_direct_access', 'guard did not report runtime/env safety'],
    ['write.mutation_retry_safety', 'guard did not report write safety'],
    ['contract.boundary_without_schema', 'guard did not report API contract compatibility'],
    ['performance.multiple_fetch_sources', 'guard did not report performance duplication'],
  ]) {
    if (!guardResult.violations.some((item) => item.rule_id === ruleId)) fail(message);
  }
  const sharedExternalInputPath = 'src/app/api/profile/route.ts:1';
  const guardSharedExternalInput = guardResult.violations.some((item) => item.rule_id === 'input.request_body_direct_use' && item.path.includes('src/app/api/profile/route.ts'));
  const deepScanSharedExternalInput = report.includes(sharedExternalInputPath);
  if (!guardSharedExternalInput) fail('guard did not report shared external input candidate');
  if (!deepScanSharedExternalInput) fail('deep scan did not report shared external input candidate');
  if (!guardSharedExternalInput || !deepScanSharedExternalInput) fail('guard and deep-scan did not agree on shared external input scanner family');
  if (!guardResult.violations.some((item) => item.category === 'heuristic_candidate' && item.why_not_proof)) fail('guard JSON did not expose heuristic finding interpretation');
  assertGuardFailureModes({ root, repo, tmp });
}

function assertGuardFailureModes({ root, repo, tmp }) {
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
  const baselineUse = parseJsonOutput(run(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--baseline', 'use', '--format', 'json', '--fail-on', 'error'], { cwd: repo }).stdout, 'baseline result');
  if (baselineUse.summary.baseline_matched < 1) fail('guard baseline use did not count matched known issues');
  if (baselineUse.summary.suppressed < 1) fail('guard baseline use did not preserve suppressed compatibility alias');
}

function runProfileCommandAndHookContracts({ root, repo, profilePath, packageHashBefore }) {
  const version = packageVersion(root);
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
  fs.appendFileSync(profilePath, `\ncommands:\n  - name: local-check\n    cmd: ${JSON.stringify(process.execPath)}\n    args: [\"-e\", \"process.stdout.write(${JSON.stringify(secretLikeOutput)}); process.exit(1)\"]\n    timeout_seconds: 5\n`);
  const untrustedGuard = runAny(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--run-profile-commands', '--format', 'json', '--fail-on', 'error'], { cwd: repo });
  if (untrustedGuard.status !== 3) fail(`profile commands without trust should exit 3, got ${untrustedGuard.status}`);
  const profileGuardRaw = runAny(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--run-profile-commands', '--trust-repo-profile', '--format', 'json', '--fail-on', 'error'], { cwd: repo }).stdout;
  const profileGuard = parseJsonOutput(profileGuardRaw, 'profile command guard result');
  if (!profileGuard.violations.some((item) => item.rule_id === 'profile.command.local-check' && item.source === 'profile')) fail('profile command failure was not reported as profile violation');
  for (const rawSecret of [fakeOpenAiKey, fakeGithubToken, fakeGenericSecret]) {
    if (profileGuardRaw.includes(rawSecret)) fail('profile command output exposed secret-like value');
  }
  if (!profileGuardRaw.includes('[REDACTED_')) fail('profile command output did not include redaction marker');
  const hookProfileGuard = runAny(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--run-profile-commands', '--format', 'json', '--fail-on', 'error'], {
    cwd: repo,
    env: { ...process.env, JHSTE_HOOK_ACTIVE: '1' },
  });
  if (hookProfileGuard.status !== 3) fail(`guard run-profile-commands inside managed hook should exit 3, got ${hookProfileGuard.status}`);

  fs.appendFileSync(profilePath, `\n  - name: legacy-shell\n    run: exit 1\n`);
  const shellBlocked = runAny(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--run-profile-commands', '--trust-repo-profile', '--format', 'json'], { cwd: repo });
  if (shellBlocked.status !== 3) fail(`legacy run without --allow-profile-shell should exit 3, got ${shellBlocked.status}`);

  run(process.execPath, [path.join(root, 'cli/hooks.mjs'), 'install', '--repo', repo, '--mode', 'advisory'], { cwd: repo });
  const preCommit = path.join(repo, '.git', 'hooks', 'pre-commit');
  const preCommitText = fs.readFileSync(preCommit, 'utf8');
  if (!preCommitText.includes('jhste-skills managed hook start')) fail('managed pre-commit hook missing marker');
  if (!preCommitText.includes(`# jhste-skills version=${version}`)) fail('managed pre-commit hook missing version comment');
  if (preCommitText.indexOf("node '") > preCommitText.indexOf('command -v jhste-skills')) fail('managed hook should prefer local CLI before global fallback');
  const fakeBin = path.join(path.dirname(preCommit), 'fake-bin');
  fs.mkdirSync(fakeBin);
  fs.writeFileSync(path.join(fakeBin, 'jhste-skills'), '#!/usr/bin/env sh\necho GLOBAL_SENTINEL\nexit 9\n', { mode: 0o755 });
  const currentPath = process.env.PATH || '';
  const localFirstHook = run('sh', [preCommit], { cwd: repo, env: { ...process.env, PATH: `${fakeBin}${path.delimiter}${currentPath}` } });
  if (localFirstHook.stdout.includes('GLOBAL_SENTINEL')) fail('managed hook used global jhste-skills before local CLI path');
  const nestedHook = run('sh', [preCommit], { cwd: repo, env: { ...process.env, JHSTE_HOOK_ACTIVE: '1' } });
  if (!nestedHook.stdout.includes('nested managed hook invocation skipped')) fail('managed hook did not skip nested invocation');
  run(process.execPath, [path.join(root, 'cli/hooks.mjs'), 'uninstall', '--repo', repo], { cwd: repo });
  if (fs.existsSync(preCommit)) fail('managed pre-commit hook was not removed');
  fs.writeFileSync(preCommit, '#!/usr/bin/env sh\necho existing\n', { mode: 0o755 });
  const refusedHook = runAny(process.execPath, [path.join(root, 'cli/hooks.mjs'), 'install', '--repo', repo], { cwd: repo });
  if (refusedHook.status !== 3) fail(`hooks install should refuse non-managed hook, got ${refusedHook.status}`);
  if (!fs.readFileSync(preCommit, 'utf8').includes('echo existing')) fail('hooks install overwrote non-managed hook');
  if (hashFile(path.join(repo, 'package.json')) !== packageHashBefore) fail('hooks modified target package.json');
}
