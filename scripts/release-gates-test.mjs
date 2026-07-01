#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`release-gates-test failed: ${message}`);
  process.exit(1);
}

function releaseGateNpmEnv() {
  const env = { ...process.env };
  delete env.npm_config_allow_scripts;
  return env;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', ...options });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    fail(`${command} ${args.join(' ')} exited ${result.status}`);
  }
  return result;
}

const dryRun = run('npm', ['pack', '--dry-run', '--json']);
let packed;
try {
  packed = JSON.parse(dryRun.stdout)[0];
} catch (error) {
  fail(`npm pack --dry-run did not return parseable JSON: ${error.message}`);
}
const files = new Set((packed.files || []).map((file) => file.path));
for (const expected of ['cli/index.mjs', 'package.json', 'README.md', 'skills/jhste-redteam/SKILL.md', 'docs/ACCEPTANCE_CHECK.md']) {
  if (!files.has(expected)) fail(`npm pack --dry-run missing expected package file ${expected}`);
}
for (const forbidden of ['docs/worker-goals/2026-06-19-red-team-issues-implementation.md', '.jhste/private-safety-patterns.txt']) {
  if (files.has(forbidden)) fail(`npm pack --dry-run included local-only file ${forbidden}`);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jhste-release-gate-'));
const packResult = run('npm', ['pack', '--json', '--pack-destination', tmp]);
const tarballName = JSON.parse(packResult.stdout)[0]?.filename;
if (!tarballName) fail('npm pack did not report a tarball filename');
const installRoot = path.join(tmp, 'install-root');
fs.mkdirSync(installRoot);
run('npm', ['init', '-y'], { cwd: installRoot });
run('npm', ['install', '--silent', path.join(tmp, tarballName)], { cwd: installRoot, env: releaseGateNpmEnv() });
const binPath = path.join(installRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'jhste-skills.cmd' : 'jhste-skills');
const help = run(binPath, ['--help'], { cwd: installRoot });
if (!help.stdout.includes('jhste-skills') || !help.stdout.includes('Usage:')) fail('installed bin did not print CLI help');

console.log('release-gates-test passed: npm pack dry-run contents and packed bin execution verified.');
