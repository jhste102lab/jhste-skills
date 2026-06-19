import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function fail(message) {
  console.error(`guard-fixtures-test failed: ${message}`);
  process.exit(1);
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    fail(`${command} ${args.join(' ')} exited ${result.status}`);
  }
  return result;
}

export function runAny(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', ...options });
}

export function makeRepo(name) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), `jhste-guard-${name}-`));
  run('git', ['init'], { cwd: repo });
  return repo;
}

export function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

export function guardJson(repo) {
  return JSON.parse(run(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--format', 'json', '--fail-on', 'none'], { cwd: repo }).stdout);
}

export function hasRule(result, ruleId, filePart = '') {
  return result.violations.some((item) => item.rule_id === ruleId && (!filePart || item.path.includes(filePart)));
}

export function notHasRule(result, ruleId, filePart = '') {
  if (hasRule(result, ruleId, filePart)) fail(`unexpected ${ruleId}${filePart ? ` in ${filePart}` : ''}`);
}

export const emptyCatch = 'catch ' + '{}';

export function makeLargePage(repo) {
  const lines = ['export default function Page() { return <main/>; }'];
  for (let i = 0; i < 205; i += 1) lines.push(`// filler ${i}`);
  write(path.join(repo, 'src/app/dashboard/page.tsx'), `${lines.join('\n')}\n`);
}

