#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const excludedDirs = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'out', 'coverage']);
const textExts = new Set(['.md', '.mdx', '.txt', '.json', '.yaml', '.yml', '.mjs', '.js', '.ts', '.tsx']);
const privateRepoFragments = [
  'JH' + 'financial',
  'Novel' + 'Crawler',
  'Novel' + 'Track',
  'Story' + 'Index',
  'crawler-' + 'platform',
  'front' + 'bench',
  'ssh' + 'bridge',
];
const privatePathFragments = ['/' + 'home/', '/' + 'Users/', 'C:' + '\\' + 'Users' + '\\'];
const secretValuePatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /(?:password|secret|token|api[_-]?key|authorization)\s*[:=]\s*['\"][^'\"]{8,}['\"]/i,
];

function fail(message) {
  console.error(`public-safety-check failed: ${message}`);
  process.exitCode = 1;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!excludedDirs.has(entry.name)) walk(full, files);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (textExts.has(ext) || entry.name === 'LICENSE') files.push(full);
  }
  return files;
}

for (const file of walk(root)) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const text = fs.readFileSync(file, 'utf8');
  for (const fragment of privateRepoFragments) {
    if (text.includes(fragment)) fail(`${rel} contains private reference repo name fragment: ${fragment}`);
  }
  for (const fragment of privatePathFragments) {
    if (text.includes(fragment) && !text.includes('/path/to/repo')) fail(`${rel} contains private local path fragment: ${fragment}`);
  }
  for (const pattern of secretValuePatterns) {
    if (pattern.test(text)) fail(`${rel} contains secret-like value pattern ${pattern}`);
  }
}

if (!process.exitCode) {
  console.log('public-safety-check passed: no private repo names, private local paths, or secret-like values detected.');
}
