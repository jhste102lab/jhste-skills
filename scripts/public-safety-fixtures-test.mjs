#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checker = path.join(root, 'scripts', 'public-safety-check.mjs');
const secretLikeFilenames = [
  '.env',
  '.env.local',
  'private.pem',
  'private.key',
  'private.p12',
  'private.pfx',
  'id_rsa',
  'id_ed25519',
];

function fail(message) {
  console.error(`public-safety-fixtures-test failed: ${message}`);
  process.exit(1);
}

function runChecker(scanRoot) {
  return spawnSync(process.execPath, [checker, '--root', scanRoot], { encoding: 'utf8' });
}

{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jhste-public-safety-clean-'));
  fs.writeFileSync(path.join(tmp, 'README.md'), '# Public fixture\n');
  const result = runChecker(tmp);
  if (result.status !== 0) fail(`clean fixture should pass, got ${result.status}: ${result.stderr || result.stdout}`);
}

for (const filename of secretLikeFilenames) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jhste-public-safety-secret-name-'));
  fs.writeFileSync(path.join(tmp, filename), 'harmless fixture text\n');
  const result = runChecker(tmp);
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status !== 1) fail(`${filename} should fail, got ${result.status}`);
  if (!output.includes(filename)) fail(`${filename} failure did not name the file`);
  if (!output.includes('secret-like filename')) fail(`${filename} failure did not explain filename risk`);
  if (output.includes('harmless fixture text')) fail(`${filename} failure leaked file contents`);
}

console.log('public-safety-fixtures-test passed: secret-like filenames are rejected without content leakage.');
