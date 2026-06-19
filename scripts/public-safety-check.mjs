#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRIVATE_PATTERNS_REL = '.jhste/private-safety-patterns.txt';
const excludedDirs = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'out', 'coverage', 'worker-goals']);
const textExts = new Set(['.md', '.mdx', '.txt', '.json', '.yaml', '.yml', '.mjs', '.js', '.ts', '.tsx']);
const secretLikeFileNamePatterns = [
  { pattern: /(^|\/)\.env(?:$|\.(?:local|development|production|test|staging)(?:\..*)?$)/i, label: 'environment file' },
  { pattern: /(^|\/)id_(?:rsa|ed25519)$/i, label: 'private key filename' },
  { pattern: /\.(?:pem|key|p12|pfx)$/i, label: 'credential/private-key filename' },
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

function parseArgs(argv) {
  const args = { root };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--root' && argv[index + 1]) {
      args.root = path.resolve(argv[index + 1]);
      index += 1;
    }
  }
  return args;
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
    files.push({ full, scanContent: textExts.has(ext) || entry.name === 'LICENSE' });
  }
  return files;
}

function loadPrivatePatterns(scanRoot) {
  const file = path.join(scanRoot, PRIVATE_PATTERNS_REL);
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

const args = parseArgs(process.argv.slice(2));
const scanRoot = args.root;
const privateRepoFragments = loadPrivatePatterns(scanRoot);

for (const { full: file, scanContent } of walk(scanRoot)) {
  const rel = path.relative(scanRoot, file).replaceAll(path.sep, '/');
  for (const { pattern, label } of secretLikeFileNamePatterns) {
    if (pattern.test(rel)) fail(`${rel} has secret-like filename (${label}); remove it from public artifacts.`);
  }
  if (!scanContent) continue;
  if (rel === PRIVATE_PATTERNS_REL) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const fragment of privateRepoFragments) {
    if (text.includes(fragment)) fail(`${rel} matches a local private safety pattern; remove it from public artifacts.`);
  }
  for (const fragment of privatePathFragments) {
    if (text.includes(fragment) && !text.includes('/path/to/repo')) fail(`${rel} contains private local path fragment: ${fragment}`);
  }
  for (const pattern of secretValuePatterns) {
    if (pattern.test(text)) fail(`${rel} contains secret-like value pattern ${pattern}`);
  }
}

if (!process.exitCode) {
  console.log('public-safety-check passed: no configured private patterns, private local paths, or sensitive value patterns detected.');
}
