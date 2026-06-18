#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`guard-fixtures-test failed: ${message}`);
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
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), `jhste-guard-${name}-`));
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

function notHasRule(result, ruleId, filePart = '') {
  if (hasRule(result, ruleId, filePart)) fail(`unexpected ${ruleId}${filePart ? ` in ${filePart}` : ''}`);
}

function makeLargePage(repo) {
  const lines = ['export default function Page() { return <main/>; }'];
  for (let i = 0; i < 205; i += 1) lines.push(`// filler ${i}`);
  write(path.join(repo, 'src/app/dashboard/page.tsx'), `${lines.join('\n')}\n`);
}

{
  const repo = makeRepo('profile-off');
  write(path.join(repo, '.jhste/profile.yaml'), `version: 1\nmode: advisory\nrules:\n  responsibility_budget:\n    mode: off\n`);
  makeLargePage(repo);
  const result = guardJson(repo);
  notHasRule(result, 'responsibility.page.budget');
}

{
  const repo = makeRepo('profile-threshold');
  write(path.join(repo, '.jhste/profile.yaml'), `version: 1\nmode: advisory\nrules:\n  responsibility_budget:\n    mode: advisory\n    next_page_review_lines: 999\n`);
  makeLargePage(repo);
  const result = guardJson(repo);
  notHasRule(result, 'responsibility.page.budget');
}

{
  const repo = makeRepo('security');
  const tokenLabel = 'tok' + 'en';
  const sqlKeyword = 'SEL' + 'ECT';
  write(path.join(repo, 'src/logging.ts'), `export function log(tokenValue: string) {\n  console.error('${tokenLabel}', tokenValue);\n}\n`);
  write(path.join(repo, 'src/raw-sql.ts'), `export async function bad(db, userId) {\n  await db.query(\`${sqlKeyword} * FROM users WHERE id = \${userId}\`);\n}\n`);
  write(path.join(repo, 'src/bound-sql.ts'), `export async function good(db, userId) {\n  await db.query('SELECT * FROM users WHERE id = $1', [userId]);\n}\n`);
  const result = guardJson(repo);
  if (!hasRule(result, 'secret.logging', 'logging.ts')) fail('secret logging was not reported');
  if (!hasRule(result, 'sql.raw_interpolation', 'raw-sql.ts')) fail('raw SQL interpolation was not reported');
  notHasRule(result, 'sql.raw_interpolation', 'bound-sql.ts');
  const secret = result.violations.find((item) => item.rule_id === 'secret.logging');
  if (String(secret.symbol).includes('tokenValue')) fail('secret logging symbol should stay redacted');
}

{
  const repo = makeRepo('api-read');
  write(path.join(repo, 'src/app/api/orders/route.ts'), `export async function GET() {\n  const rows = await prisma.order.findMany();\n  return Response.json(rows);\n}\n`);
  const result = guardJson(repo);
  if (!hasRule(result, 'authz.read_without_auth_context')) fail('read route without auth was not reported');
  if (!hasRule(result, 'database.raw_row_public_response')) fail('raw row public response was not reported');
}

{
  const repo = makeRepo('safe-dto');
  write(path.join(repo, 'src/app/api/orders/route.ts'), `export async function GET(request) {\n  const user = await requireUser();\n  const userId = user.id;\n  const order = await getOrderForUser(userId, request.url);\n  return Response.json({ id: order.id, status: order.status });\n}\n`);
  const result = guardJson(repo);
  notHasRule(result, 'authz.read_without_auth_context');
  notHasRule(result, 'database.raw_row_public_response');
  notHasRule(result, 'contract.raw_storage_response');
}

{
  const repo = makeRepo('confidence-text');
  write(path.join(repo, 'src/client.tsx'), `"use client";\nexport function C() {\n  fetch('/a');\n  fetch('/b');\n  return null;\n}\n`);
  const text = run(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--format', 'text', '--fail-on', 'none'], { cwd: repo }).stdout;
  if (!text.includes('[low-confidence]')) fail('text output did not show confidence');
}

console.log('guard-fixtures-test passed: profile modes, thresholds, security scanners, read auth, DTO false positive, and confidence output verified.');
