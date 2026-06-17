#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expected = [
  'diagnose',
  'grill-with-docs',
  'triage',
  'improve-codebase-architecture',
  'to-issues',
  'to-prd',
  'prototype',
  'grill-me',
  'handoff',
  'write-a-skill',
];

function fail(message) {
  console.error(`vendor-check failed: ${message}`);
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
}

const allowlist = readJson('vendor/matt-pocock/allowlist.json');
if (JSON.stringify(allowlist) !== JSON.stringify(expected)) {
  fail('allowlist does not match the exact 10 selected skills');
}

const sourceLock = readJson('vendor/matt-pocock/source-lock.json');
if (!Array.isArray(sourceLock.skills) || sourceLock.skills.length !== expected.length) {
  fail('source-lock must contain exactly 10 skills');
}

const seen = new Set();
for (const entry of sourceLock.skills) {
  if (!expected.includes(entry.name)) fail(`unexpected skill in source-lock: ${entry.name}`);
  if (seen.has(entry.name)) fail(`duplicate source-lock entry: ${entry.name}`);
  seen.add(entry.name);
  if (!/^https:\/\/github\.com\/mattpocock\/skills\//.test(entry.source)) fail(`invalid source for ${entry.name}`);
  if (!/^[0-9a-f]{40}$/.test(entry.commit)) fail(`commit must be a 40-char SHA for ${entry.name}`);
  if (!entry.license || !/MIT/.test(entry.license)) fail(`license missing for ${entry.name}`);
  if (entry.vendored_path !== `skills/${entry.name}`) fail(`vendored_path mismatch for ${entry.name}`);
  if (!fs.existsSync(path.join(root, entry.vendored_path, 'SKILL.md'))) fail(`vendored SKILL.md missing for ${entry.name}`);
}

for (const skill of expected) {
  if (!seen.has(skill)) fail(`source-lock missing ${skill}`);
}
if (!fs.existsSync(path.join(root, 'vendor/matt-pocock/LICENSE'))) fail('upstream LICENSE missing');
if (!fs.existsSync(path.join(root, 'vendor/matt-pocock/NOTICE.md'))) fail('NOTICE missing');

console.log('vendor-check passed: allowlist, source-lock, vendored paths, and license attribution are valid.');
