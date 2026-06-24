#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`profile-fixtures-test failed: ${message}`);
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

const emptyCatch = 'catch ' + '{}';

function makeRepo(name) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), `jhste-profile-${name}-`));
  run('git', ['init'], { cwd: repo });
  fs.mkdirSync(path.join(repo, '.jhste'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'src'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'src', 'route.ts'), `export function route() {\n  try {\n    return true;\n  } ${emptyCatch}\n}\n`);
  return repo;
}

function expectConfigError(name, profileText, expectedText) {
  const repo = makeRepo(name);
  fs.writeFileSync(path.join(repo, '.jhste', 'profile.yaml'), profileText);
  const result = runAny(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--format', 'json'], { cwd: repo });
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status !== 3) fail(`${name} should exit 3, got ${result.status}`);
  if (!output.includes(expectedText)) fail(`${name} output did not include ${expectedText}`);
}

expectConfigError('unknown-rule', `version: 1\nmode: advisory\nrules:\n  no_secret_loggin:\n    mode: off\n`, 'Unknown rule family id');
expectConfigError('unknown-pack', `version: 1\nmode: advisory\npacks:\n  databse:\n    mode: off\n`, 'Unknown pack id');
expectConfigError('unknown-top-level', `version: 1\nmode: advisory\nsurprise:\n  enabled: true\n`, 'Unsupported top-level profile section');
expectConfigError('bad-indentation', `version: 1\nmode: advisory\nrules:\n   no_secret_logging:\n    mode: off\n`, 'Unsupported rules profile syntax');
expectConfigError('unknown-nested-rule-key', `version: 1\nmode: advisory\nrules:\n  no_secret_logging:\n    mdoe: off\n`, 'Unsupported rules.no_secret_logging profile key');
expectConfigError('invalid-threshold', `version: 1\nmode: advisory\nrules:\n  file_size_advisory:\n    source_file_warning_lines: -1\n`, 'rules.file_size_advisory.source_file_warning_lines must be an integer');
expectConfigError('unknown-command-key', `version: 1\nmode: advisory\ncommands:\n  - name: local\n    cmd: node\n    unexpected: true\n`, 'Unsupported commands profile key');
expectConfigError('invalid-command-args', `version: 1\nmode: advisory\ncommands:\n  - name: local\n    cmd: node\n    args: nope\n`, 'args must be an inline string array');
expectConfigError('unknown-guard-nested-key', `version: 1\nmode: advisory\nguard:\n  some_unknown_nested:\n    value: true\n`, 'Unsupported guard profile key some_unknown_nested');


{
  const generatedProfile = fs.readFileSync(path.join(root, 'cli/shared/templates.mjs'), 'utf8');
  const exampleProfile = fs.readFileSync(path.join(root, 'examples/profile.yaml'), 'utf8');
  if (generatedProfile.includes('exit_codes:')) fail('DEFAULT_PROFILE should not include guard.exit_codes');
  if (exampleProfile.includes('exit_codes:')) fail('example profile should not include guard.exit_codes');
}

{
  const repo = makeRepo('legacy-exit-codes-noop');
  fs.writeFileSync(path.join(repo, '.jhste', 'profile.yaml'), `version: 1
mode: advisory
guard:
  fail_on: warning
  exit_codes:
    violation_failure: 7
`);
  const result = runAny(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--format', 'text'], { cwd: repo });
  if (result.status !== 1) fail(`legacy guard.exit_codes should be ignored and use fixed violation exit 1, got ${result.status}`);
  if (`${result.stdout}\n${result.stderr}`.includes('guard.config')) fail('legacy guard.exit_codes should not be a config failure');
}

{
  const repo = makeRepo('deep-scan-invalid-profile');
  fs.writeFileSync(path.join(repo, '.jhste', 'profile.yaml'), `version: 1
mode: advisory
rules:
  file_size_advisory:
    source_file_warning_lines: -1
    source_file_review_lines: -1
`);
  const result = runAny(process.execPath, [path.join(root, 'cli/deep-scan.mjs'), '--repo', repo], { cwd: repo });
  if (result.status !== 3) fail(`deep-scan invalid profile should exit 3, got ${result.status}`);
  if (!`${result.stdout}\n${result.stderr}`.includes('Invalid profile .jhste/profile.yaml.')) fail('deep-scan invalid profile output did not name the profile');
  if (fs.existsSync(path.join(repo, '.jhste', 'deep-scan-report.md'))) fail('deep-scan invalid profile wrote report');
  if (fs.existsSync(path.join(repo, '.jhste', 'profile.recommended.yaml'))) fail('deep-scan invalid profile wrote recommended profile');
}

{
  const repo = makeRepo('deep-scan-valid-profile');
  fs.writeFileSync(path.join(repo, '.jhste', 'profile.yaml'), `version: 1
mode: advisory
`);
  run(process.execPath, [path.join(root, 'cli/deep-scan.mjs'), '--repo', repo], { cwd: repo });
  if (!fs.existsSync(path.join(repo, '.jhste', 'deep-scan-report.md'))) fail('deep-scan valid profile did not write report');
  if (!fs.existsSync(path.join(repo, '.jhste', 'profile.recommended.yaml'))) fail('deep-scan valid profile did not write recommended profile');
}

{
  const repo = makeRepo('baseline-custom-path');
  fs.writeFileSync(path.join(repo, '.jhste', 'profile.yaml'), `version: 1
mode: advisory
baseline:
  path: .jhste/custom-baseline.json
`);
  const dryRun = runAny(process.execPath, [path.join(root, 'cli/baseline.mjs'), '--repo', repo, '--dry-run'], { cwd: repo });
  if (dryRun.status !== 0) fail(`baseline --dry-run should exit 0, got ${dryRun.status}`);
  if (!dryRun.stdout.includes('Planned changed files:\n- .jhste/custom-baseline.json')) fail('baseline --dry-run did not show custom baseline path');
  if (dryRun.stdout.includes('.jhste/baseline.json')) fail('baseline --dry-run showed default baseline path despite custom profile path');
  run(process.execPath, [path.join(root, 'cli/baseline.mjs'), '--repo', repo, '--yes'], { cwd: repo });
  if (!fs.existsSync(path.join(repo, '.jhste', 'custom-baseline.json'))) fail('baseline did not create custom profile path');
  if (fs.existsSync(path.join(repo, '.jhste', 'baseline.json'))) fail('baseline created default path instead of custom path');
}

{
  const repo = makeRepo('baseline-invalid-profile');
  fs.writeFileSync(path.join(repo, '.jhste', 'profile.yaml'), `version: 1
mode: advisory
rules:
  file_size_advisory:
    source_file_warning_lines: -1
`);
  const result = runAny(process.execPath, [path.join(root, 'cli/baseline.mjs'), '--repo', repo, '--yes'], { cwd: repo });
  if (result.status !== 3) fail(`baseline invalid profile should exit 3, got ${result.status}`);
  if (`${result.stdout}\n${result.stderr}`.includes('Changed files:')) fail('baseline invalid profile should fail before prompting or printing changed files');
  if (fs.existsSync(path.join(repo, '.jhste', 'baseline.json'))) fail('baseline invalid profile created baseline.json');
}

{
  const repo = makeRepo('baseline-outside-path');
  const outside = path.join(path.dirname(repo), 'outside-baseline.json');
  const result = runAny(process.execPath, [path.join(root, 'cli/baseline.mjs'), '--repo', repo, '--yes', '--baseline-path', '../outside-baseline.json'], { cwd: repo });
  if (result.status !== 3) fail(`baseline outside path should exit 3, got ${result.status}`);
  if (fs.existsSync(outside)) fail('baseline outside path was written');
}

{
  const repo = makeRepo('tune-idempotent');
  fs.writeFileSync(path.join(repo, '.jhste', 'profile.yaml'), `version: 1\nmode: advisory\nrules:\n  no_silent_failure:\n    mode: advisory\n`);
  fs.writeFileSync(path.join(repo, '.jhste', 'profile.recommended.yaml'), `version: 1\nmode: advisory\nrecommendations:\n  generated_by: deep-scan\npacks:\n  api:\n    mode: changed-files\nrules:\n  no_silent_failure:\n    mode: changed-files\nbaseline:\n  enabled: true\n  path: .jhste/baseline.json\n`);
  const refused = runAny(process.execPath, [path.join(root, 'cli/tune.mjs'), '--repo', repo], { cwd: repo });
  if (refused.status !== 3) fail(`non-interactive tune without --yes should exit 3, got ${refused.status}`);
  const beforeTune = fs.readFileSync(path.join(repo, '.jhste', 'profile.yaml'), 'utf8');
  if (!beforeTune.includes('mode: advisory')) fail('refused tune changed profile unexpectedly');
  run(process.execPath, [path.join(root, 'cli/tune.mjs'), '--repo', repo, '--yes'], { cwd: repo });
  run(process.execPath, [path.join(root, 'cli/tune.mjs'), '--repo', repo, '--yes'], { cwd: repo });
  const tuned = fs.readFileSync(path.join(repo, '.jhste', 'profile.yaml'), 'utf8');
  for (const heading of ['packs', 'rules', 'baseline']) {
    const count = (tuned.match(new RegExp(`^${heading}:`, 'gm')) || []).length;
    if (count !== 1) fail(`tune should render exactly one ${heading} section, got ${count}`);
  }
  if (!tuned.includes('mode: changed-files')) fail('tune did not apply recommended changed-files mode');
}

{
  const repo = makeRepo('baseline-noninteractive-refusal');
  const result = runAny(process.execPath, [path.join(root, 'cli/baseline.mjs'), '--repo', repo], { cwd: repo });
  if (result.status !== 3) fail(`non-interactive baseline without --yes should exit 3, got ${result.status}`);
  if (fs.existsSync(path.join(repo, '.jhste', 'baseline.json'))) fail('refused baseline created baseline.json');
}

console.log('profile-fixtures-test passed: profile schema errors, legacy guard no-ops, deep-scan validation, baseline paths, and tune idempotent merge verified.');
