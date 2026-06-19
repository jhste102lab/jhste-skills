#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const excludedDirs = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'out', 'coverage', '.turbo', '.cache']);
const files = [];

function fail(message) {
  console.error(`syntax-check failed: ${message}`);
  process.exit(1);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!excludedDirs.has(entry.name)) walk(full);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.mjs')) files.push(full);
  }
}

walk(root);
for (const file of files.sort()) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    fail(`${path.relative(root, file)} failed node --check`);
  }
}

console.log(`syntax-check passed: ${files.length} .mjs files parsed by node --check.`);
