#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`solid-design-fixtures-test failed: ${message}`);
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
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), `jhste-solid-${name}-`));
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

function findRule(result, ruleId, filePart = '') {
  return result.violations.find((item) => item.rule_id === ruleId && (!filePart || item.path.includes(filePart)));
}

{
  const repo = makeRepo('extension-boundary');
  write(path.join(repo, 'src/checkout.ts'), `export function feeForProvider(provider: string) {
  switch (provider) {
    case 'stripe':
      return 30;
    case 'paypal':
      return 35;
    case 'adyen':
      return 25;
    default:
      return 0;
  }
}
`);
  const result = guardJson(repo);
  const item = findRule(result, 'solid.ocp.variant_branching_hotspot', 'checkout.ts');
  if (!item) fail('OCP extension boundary candidate was not reported');
  if (item.rule_family !== 'extension_seam_advisory') fail('OCP candidate should map to extension_seam_advisory');
  if (item.confidence !== 'low' || item.severity !== 'warning') fail('OCP candidate should be low-confidence warning');
}

{
  const repo = makeRepo('dependency-boundary');
  write(path.join(repo, 'src/services/RegisterUserService.ts'), `export async function registerUser(input) {
  const user = await prisma.user.create({ data: input });
  await fetch('https://example.invalid/welcome', { method: 'POST' });
  return user;
}
`);
  const result = guardJson(repo);
  const item = findRule(result, 'solid.dip.concrete_side_effect_dependency', 'RegisterUserService.ts');
  if (!item) fail('DIP dependency boundary candidate was not reported');
  if (item.rule_family !== 'dependency_boundary_advisory') fail('DIP candidate should map to dependency_boundary_advisory');
  if (item.confidence !== 'low' || item.severity !== 'warning') fail('DIP candidate should be low-confidence warning');
}

{
  const repo = makeRepo('metadata-only');
  write(path.join(repo, '.jhste/profile.yaml'), `version: 1
mode: advisory
rules:
  substitutability_advisory:
    mode: advisory
  interface_segregation_advisory:
    mode: advisory
`);
  write(path.join(repo, 'src/contracts.ts'), `export interface WideContract {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}
`);
  const result = guardJson(repo);
  if (findRule(result, 'solid.lsp.violation') || findRule(result, 'solid.isp.violation')) fail('metadata-only LSP/ISP rules must not emit automatic violation findings');
}

console.log('solid-design-fixtures-test passed: SOLID OCP/DIP candidates and LSP/ISP metadata-only behavior verified.');
