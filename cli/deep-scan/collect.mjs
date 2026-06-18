import fs from 'node:fs';
import path from 'node:path';
import { relativeDisplay } from '../shared.mjs';

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.sql', '.md', '.mdx', '.json']);
const TEXT_EXTENSIONS = new Set([...SOURCE_EXTENSIONS, '.yaml', '.yml', '.toml']);
const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  'vendor',
  'dist',
  'build',
  '.next',
  'out',
  'coverage',
  '.turbo',
  '.cache',
  '__pycache__',
]);
const EXCLUDED_FILE_NAMES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'bun.lock',
  'poetry.lock',
  'Pipfile.lock',
]);
const SECRET_FILE_RE = /(^|\/)(\.env(\..*)?|.*\.(pem|key|p12|pfx|crt)|id_rsa|id_ed25519)$/i;
const MAX_FILE_BYTES = 1024 * 1024;

function readGitignoreRoots(repoRoot) {
  const gitignore = path.join(repoRoot, '.gitignore');
  if (!fs.existsSync(gitignore)) return new Set();
  const roots = new Set();
  for (const raw of fs.readFileSync(gitignore, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.includes('*') || line.startsWith('!')) continue;
    const normalized = line.replace(/^\//, '').replace(/\/$/, '');
    if (normalized && !normalized.includes('/')) roots.add(normalized);
  }
  return roots;
}

export function collectFiles(repoRoot) {
  const gitignoreRoots = readGitignoreRoots(repoRoot);
  const files = [];
  const skipped = [];
  function skip(reason, fullPath) {
    skipped.push({ reason, path: relativeDisplay(repoRoot, fullPath) });
  }
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = relativeDisplay(repoRoot, full);
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name) || gitignoreRoots.has(entry.name)) {
          skip('excluded directory', full);
          continue;
        }
        walk(full);
        continue;
      }
      if (!entry.isFile()) {
        skip('non-file', full);
        continue;
      }
      if (EXCLUDED_FILE_NAMES.has(entry.name) || SECRET_FILE_RE.test(rel)) {
        skip('excluded sensitive or lock file', full);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext)) {
        skip('non-source extension', full);
        continue;
      }
      const stat = fs.statSync(full);
      if (stat.size > MAX_FILE_BYTES) {
        skip('large file', full);
        continue;
      }
      files.push({ full, rel, ext, size: stat.size });
    }
  }
  walk(repoRoot);
  return { files, skipped };
}

export function detectStack(repoRoot, files) {
  const rels = files.map((file) => file.rel);
  const packageJsonPath = path.join(repoRoot, 'package.json');
  const packageText = fs.existsSync(packageJsonPath) ? fs.readFileSync(packageJsonPath, 'utf8') : '';
  return {
    typescript: rels.some((rel) => /\.(ts|tsx)$/.test(rel)) || /typescript/.test(packageText),
    react: rels.some((rel) => /\.(jsx|tsx)$/.test(rel)) || /"react"\s*:/.test(packageText),
    nextjs: rels.some((rel) => /(^|\/)(next\.config\.|app\/.*route\.(js|ts)|pages\/api\/)/.test(rel)) || /"next"\s*:/.test(packageText),
    python: rels.some((rel) => rel.endsWith('.py')),
    postgresql: /postgres|pg\b|postgresql/i.test(packageText) || rels.some((rel) => /migrations?|sql|database|db/i.test(rel)),
    crawler: rels.some((rel) => /crawler|scraper|automation|playwright|puppeteer|worker|scheduler/i.test(rel)) || /playwright|puppeteer|scrap/i.test(packageText),
  };
}

export function detectInstructions(repoRoot) {
  return {
    agents: fs.existsSync(path.join(repoRoot, 'AGENTS.md')),
    claude: fs.existsSync(path.join(repoRoot, 'CLAUDE.md')),
    docs: fs.existsSync(path.join(repoRoot, 'docs')),
  };
}
