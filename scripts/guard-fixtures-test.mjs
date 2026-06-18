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

function runAny(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', ...options });
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

const emptyCatch = 'catch ' + '{}';

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
  const repo = makeRepo('root-off');
  write(path.join(repo, '.jhste/profile.yaml'), `version: 1\nmode: off\n`);
  write(path.join(repo, 'src/route.ts'), `export function route() {\n  try {\n    return true;\n  } ${emptyCatch}\n}\n`);
  const result = guardJson(repo);
  if (result.violations.length !== 0) fail('root mode off should disable findings when not shadowed by nested modes');
}

{
  const repo = makeRepo('changed-files-all');
  write(path.join(repo, '.jhste/profile.yaml'), `version: 1\nmode: changed-files\n`);
  write(path.join(repo, 'src/route.ts'), `export function route() {\n  try {\n    return true;\n  } ${emptyCatch}\n}\n`);
  const result = guardJson(repo);
  if (hasRule(result, 'silent.catch.empty')) fail('changed-files mode should be inactive for --scope all');
}

{
  const repo = makeRepo('strict-defaults');
  write(path.join(repo, '.jhste/profile.yaml'), `version: 1\nmode: strict\n`);
  write(path.join(repo, 'src/route.ts'), `export function route() {\n  try {\n    return true;\n  } ${emptyCatch}\n}\n`);
  const result = runAny(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--format', 'json'], { cwd: repo });
  if (result.status !== 1) fail(`strict profile should fail on errors by default, got ${result.status}`);
  const parsed = JSON.parse(result.stdout);
  if (parsed.meta?.scope !== 'all') fail('strict profile should default guard scope to all');
  if (parsed.meta?.fail_on !== 'error') fail('strict profile should default fail_on to error');
}

{
  const repo = makeRepo('baseline-new-only');
  write(path.join(repo, '.jhste/profile.yaml'), `version: 1\nmode: advisory\n`);
  write(path.join(repo, 'src/a.ts'), `export function a() {\n  try {\n    return true;\n  } ${emptyCatch}\n}\n`);
  run(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--baseline', 'update', '--format', 'json'], { cwd: repo });
  write(path.join(repo, '.jhste/profile.yaml'), `version: 1\nmode: baseline-new-only\n`);
  let result = runAny(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--format', 'json'], { cwd: repo });
  if (result.status !== 0) fail(`baseline-new-only should pass when all findings are baseline-matched, got ${result.status}`);
  let parsed = JSON.parse(result.stdout);
  if (parsed.meta?.baseline_mode !== 'ratchet') fail('baseline-new-only should default to baseline ratchet mode');
  if (parsed.summary?.suppressed !== 1) fail('baseline-new-only should suppress only accepted debt from failure counts');
  write(path.join(repo, 'src/b.ts'), `export function b() {\n  try {\n    return true;\n  } ${emptyCatch}\n}\n`);
  result = runAny(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--format', 'json'], { cwd: repo });
  if (result.status !== 1) fail(`baseline-new-only should fail when a new finding appears, got ${result.status}`);
  parsed = JSON.parse(result.stdout);
  if (!parsed.violations.some((item) => item.baseline_status === 'new')) fail('baseline-new-only did not mark the added finding as new');
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
  const sessionLabel = 'sess' + 'ion';
  const sqlKeyword = 'SEL' + 'ECT';
  write(path.join(repo, 'src/logging.ts'), `export function log(tokenValue: string) {\n  console.error('${tokenLabel}', tokenValue);\n}\n`);
  write(path.join(repo, 'src/string-message-log.ts'), `export function logMessage() {\n  console.error('${sessionLabel} ${tokenLabel} refresh failed');\n}\n`);
  write(path.join(repo, 'src/raw-sql.ts'), `export async function bad(db, userId) {\n  await db.query(\`${sqlKeyword} * FROM users WHERE id = \${userId}\`);\n}\n`);
  write(path.join(repo, 'src/safe-tagged-sql.ts'), `export async function good(userId) {\n  return sql\`${sqlKeyword} * FROM users WHERE id = \${userId}\`;\n}\n`);
  write(path.join(repo, 'src/bound-sql.ts'), `export async function good(db, userId) {\n  await db.query('SELECT * FROM users WHERE id = $1', [userId]);\n}\n`);
  write(path.join(repo, 'src/assembled-sql.ts'), `export async function assembled(db, userId) {\n  const q = '${sqlKeyword} * FROM users WHERE id = ' + userId;\n  await db.query(q);\n}\n`);
  const result = guardJson(repo);
  if (!hasRule(result, 'secret.logging', 'logging.ts')) fail('secret logging was not reported');
  if (!hasRule(result, 'sql.raw_interpolation', 'raw-sql.ts')) fail('raw SQL interpolation was not reported');
  if (!hasRule(result, 'sql.raw_interpolation', 'assembled-sql.ts')) fail('assembled SQL query execution was not reported');
  notHasRule(result, 'sql.raw_interpolation', 'safe-tagged-sql.ts');
  notHasRule(result, 'sql.raw_interpolation', 'bound-sql.ts');
  const secret = result.violations.find((item) => item.rule_id === 'secret.logging');
  if (String(secret.symbol).includes('tokenValue')) fail('secret logging symbol should stay redacted');
  const messageOnly = result.violations.find((item) => item.rule_id === 'secret.logging' && item.path.includes('string-message-log.ts'));
  if (!messageOnly) fail('string-only secret-like log message should be reported as review candidate');
  if (messageOnly.confidence !== 'low' || messageOnly.severity !== 'warning') fail('string-only secret-like log should be low-confidence warning');
}

{
  const repo = makeRepo('api-read');
  write(path.join(repo, 'src/app/api/orders/route.ts'), `export async function GET() {\n  const count = await prisma.order.count();\n  const rows = await prisma.order.findMany();\n  return Response.json({ orders: rows, count });\n}\n`);
  const result = guardJson(repo);
  if (!hasRule(result, 'authz.read_without_auth_context')) fail('read route without auth was not reported');
  if (!hasRule(result, 'database.raw_row_public_response')) fail('nested raw row public response was not reported');
}

{
  const repo = makeRepo('direct-storage-related');
  write(path.join(repo, 'src/app/api/orders/route.ts'), `export async function GET() {\n  return Response.json(await prisma.order.findMany());\n}\n`);
  const result = guardJson(repo);
  const related = result.violations.filter((item) => ['contract.raw_storage_response', 'database.raw_row_public_response'].includes(item.rule_id));
  if (related.length !== 2) fail('direct storage response should report contract and DB row concerns');
  if (!related.every((item) => item.related_key === 'raw-storage-response')) fail('related storage findings should share a related_key');
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
  const repo = makeRepo('external-input');
  write(path.join(repo, 'src/file-input.ts'), `import fs from 'node:fs';\nexport function load(file) {\n  const raw = fs.readFileSync(file, 'utf8');\n  return JSON.parse(raw);\n}\n`);
  write(path.join(repo, 'src/file-input-safe.ts'), `import fs from 'node:fs';\nconst schema = { parse(value) { return value; } };\nexport function load(file) {\n  const raw = fs.readFileSync(file, 'utf8');\n  return schema.parse(JSON.parse(raw));\n}\n`);
  write(path.join(repo, 'src/third-party.ts'), `export async function load() {\n  const response = await fetch('https://api.example.test/items');\n  return response.json();\n}\n`);
  write(path.join(repo, 'src/third-party-safe.ts'), `const schema = { safeParse(value) { return { success: true, data: value }; } };\nexport async function load() {\n  const response = await fetch('https://api.example.test/items');\n  return schema.safeParse(await response.json());\n}\n`);
  write(path.join(repo, 'src/app/api/orders/route.ts'), `export async function POST(request) {\n  const body = await request.json();\n  return Response.json(await service.createOrder(body));\n}\n`);
  write(path.join(repo, 'src/app/api/orders/safe-route.ts'), `const schema = { parse(value) { return value; } };\nexport async function POST(request) {\n  const body = schema.parse(await request.json());\n  return Response.json(await service.createOrder(body));\n}\n`);
  const envLookup = 'process.env.' + 'API_URL';
  write(path.join(repo, 'src/config.ts'), `export const config = { url: ${envLookup} };\n`);
  write(path.join(repo, 'src/config-safe.ts'), `export const config = parseEnv(process.env);\n`);
  const result = guardJson(repo);
  for (const [ruleId, filePart] of [
    ['input.file_parse_unvalidated', 'file-input.ts'],
    ['input.third_party_json_unvalidated', 'third-party.ts'],
    ['input.request_body_direct_use', 'route.ts'],
    ['input.env_export_unvalidated', 'config.ts'],
  ]) {
    if (!hasRule(result, ruleId, filePart)) fail(`${ruleId} was not reported for ${filePart}`);
    const item = result.violations.find((violation) => violation.rule_id === ruleId && violation.path.includes(filePart));
    if (item.confidence !== 'low' || item.severity !== 'warning') fail(`${ruleId} should be low-confidence warning`);
  }
  notHasRule(result, 'input.file_parse_unvalidated', 'file-input-safe.ts');
  notHasRule(result, 'input.third_party_json_unvalidated', 'third-party-safe.ts');
  notHasRule(result, 'input.request_body_direct_use', 'safe-route.ts');
  notHasRule(result, 'input.env_export_unvalidated', 'config-safe.ts');
}

{
  const repo = makeRepo('confidence-text');
  write(path.join(repo, 'src/client.tsx'), `"use client";\nexport function C() {\n  fetch('/a');\n  fetch('/b');\n  return null;\n}\n`);
  const text = run(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--format', 'text', '--fail-on', 'none'], { cwd: repo }).stdout;
  if (!text.includes('[low-confidence]')) fail('text output did not show confidence');
  if (!text.includes('의미:') || !text.includes('대처:')) fail('text output did not show actionable warning guidance');
}

{
  const repo = makeRepo('baseline-omitted-count');
  write(path.join(repo, 'src/a.ts'), `export function a() {\n  try {\n    return true;\n  } ${emptyCatch}\n}\n`);
  run(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--baseline', 'update', '--format', 'json'], { cwd: repo });
  const baseline = JSON.parse(fs.readFileSync(path.join(repo, '.jhste', 'baseline.json'), 'utf8'));
  const baselineRow = baseline.violations?.[0] || {};
  for (const field of ['reason', 'first_seen', 'last_seen']) {
    if (!baselineRow[field]) fail(`baseline row missing ${field}`);
  }
  for (const field of ['owner', 'expires_at', 'fix_tracking']) {
    if (!Object.prototype.hasOwnProperty.call(baselineRow, field)) fail(`baseline row missing optional ${field}`);
  }
  write(path.join(repo, 'src/b.ts'), `export function b() {\n  try {\n    return true;\n  } ${emptyCatch}\n}\n`);
  const text = run(process.execPath, [path.join(root, 'cli/guard.mjs'), '--repo', repo, '--scope', 'all', '--baseline', 'use', '--format', 'text', '--fail-on', 'none'], { cwd: repo }).stdout;
  if (!text.includes('suppressed=1')) fail('baseline suppressed count missing from text summary');
  if (!text.includes('Existing baseline issues encountered')) fail('baseline-matched finding was not shown as encountered existing issue');
  if (text.includes('more omitted from text output')) fail('baseline-suppressed finding was counted as text omission');
}

{
  const repo = makeRepo('unique-fingerprints');
  const tokenLabel = 'tok' + 'en';
  const firstParam = tokenLabel + 'A';
  const secondParam = tokenLabel + 'B';
  write(path.join(repo, 'src/logging.ts'), `export function log(${firstParam}: string, ${secondParam}: string) {\n  console.error('${tokenLabel}', ${firstParam});\n  console.error('${tokenLabel}', ${secondParam});\n}\n`);
  write(path.join(repo, 'src/types.ts'), `const first = value as any;\nconst second = other as any;\n`);
  const result = guardJson(repo);
  const secretFindings = result.violations.filter((item) => item.rule_id === 'secret.logging');
  if (secretFindings.length !== 2) fail(`expected two secret logging findings, got ${secretFindings.length}`);
  if (new Set(secretFindings.map((item) => item.fingerprint)).size !== 2) fail('same-file secret logging findings shared a fingerprint');
  if (secretFindings.some((item) => String(item.occurrence_key || '').includes('tokenA') || String(item.occurrence_key || '').includes('tokenB'))) {
    fail('secret occurrence key exposed raw symbol text');
  }
  const typeFindings = result.violations.filter((item) => item.rule_id === 'type.escape');
  if (typeFindings.length !== 2) fail(`expected two type escape findings, got ${typeFindings.length}`);
  if (new Set(typeFindings.map((item) => item.fingerprint)).size !== 2) fail('same-file type escape findings shared a fingerprint');
}

console.log('guard-fixtures-test passed: profile modes, thresholds, security scanners, read auth, DTO false positive, and confidence output verified.');
