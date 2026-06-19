#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`single-responsibility-fixtures-test failed: ${message}`);
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

function makeRepo(name) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), `jhste-srp-${name}-`));
  run('git', ['init'], { cwd: repo });
  return repo;
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function guardJson(repo) {
  return JSON.parse(run(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--format', 'json', '--fail-on', 'none'], { cwd: repo }).stdout);
}

function hasRule(result, ruleId, filePart = '') {
  return result.violations.some((item) => item.rule_id === ruleId && (!filePart || item.path.includes(filePart)));
}

{
  const repo = makeRepo('function-mixed');
  write(path.join(repo, 'src/importer.ts'), `import fs from 'node:fs';
export function importRows(argv) {
  const file = argv[2];
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = JSON.parse(raw);
  const errors = [];
  if (!Array.isArray(parsed)) errors.push('expected array');
  const rows = parsed.map((row) => ({ id: String(row.id) }));
  console.log('imported', rows.length);
  return { rows, errors };
}
`);
  const result = guardJson(repo);
  if (!hasRule(result, 'srp.function.mixed_responsibility', 'importer.ts')) fail('mixed function SRP candidate was not reported');
  const item = result.violations.find((violation) => violation.rule_id === 'srp.function.mixed_responsibility');
  if (item.confidence !== 'low' || item.severity !== 'warning') fail('mixed function SRP candidate should be low-confidence warning');
}

{
  const repo = makeRepo('module-exports');
  write(path.join(repo, 'src/shared.ts'), `export function parseArgs() { return {}; }
export function findGitRoot() { return '.'; }
export function writeFileIfChanged() { return false; }
export function askUser() { return ''; }
export function renderReport() { return ''; }
`);
  const result = guardJson(repo);
  if (!hasRule(result, 'srp.module.mixed_exports', 'shared.ts')) fail('mixed module exports SRP candidate was not reported');
}

{
  const repo = makeRepo('function-length');
  const lines = ['export function longPolicy() {'];
  for (let i = 0; i < 82; i += 1) lines.push(`  const value${i} = ${i};`);
  lines.push('  return value0;', '}');
  write(path.join(repo, 'src/long.ts'), `${lines.join('\n')}\n`);
  const result = guardJson(repo);
  if (!hasRule(result, 'srp.function.length', 'long.ts')) fail('long function SRP candidate was not reported');
}

console.log('single-responsibility-fixtures-test passed: function and module SRP candidates verified.');
