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

{
  const repo = makeRepo('tune-idempotent');
  fs.writeFileSync(path.join(repo, '.jhste', 'profile.yaml'), `version: 1\nmode: advisory\nrules:\n  no_silent_failure:\n    mode: advisory\n`);
  fs.writeFileSync(path.join(repo, '.jhste', 'profile.recommended.yaml'), `version: 1\nmode: advisory\npacks:\n  api:\n    mode: changed-files\nrules:\n  no_silent_failure:\n    mode: changed-files\nbaseline:\n  enabled: true\n  path: .jhste/baseline.json\n`);
  run(process.execPath, [path.join(root, 'cli/tune.mjs'), '--repo', repo, '--yes'], { cwd: repo });
  run(process.execPath, [path.join(root, 'cli/tune.mjs'), '--repo', repo, '--yes'], { cwd: repo });
  const tuned = fs.readFileSync(path.join(repo, '.jhste', 'profile.yaml'), 'utf8');
  for (const heading of ['packs', 'rules', 'baseline']) {
    const count = (tuned.match(new RegExp(`^${heading}:`, 'gm')) || []).length;
    if (count !== 1) fail(`tune should render exactly one ${heading} section, got ${count}`);
  }
  if (!tuned.includes('mode: changed-files')) fail('tune did not apply recommended changed-files mode');
}

console.log('profile-fixtures-test passed: profile schema errors and tune idempotent merge verified.');
