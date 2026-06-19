import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { isPathInside, relativeDisplay } from '../shared.mjs';

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

export function collectFiles(repoRoot) {
  const files = [];
  const skipped = [];
  const source = {
    type: 'git-ls-files',
    command: 'git ls-files --cached --others --exclude-standard -z',
    fallback: false,
    fallback_reason: null,
    listed_count: 0,
  };
  function skip(reason, fullPath) {
    skipped.push({ reason, path: relativeDisplay(repoRoot, fullPath) });
  }
  function consider(full, entryName = path.basename(full)) {
    const rel = relativeDisplay(repoRoot, full);
    if (EXCLUDED_FILE_NAMES.has(entryName) || SECRET_FILE_RE.test(rel)) {
      skip('excluded sensitive or lock file', full);
      return;
    }
    const ext = path.extname(entryName).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext)) {
      skip('non-source extension', full);
      return;
    }
    const stat = fs.statSync(full);
    if (stat.size > MAX_FILE_BYTES) {
      skip('large file', full);
      return;
    }
    files.push({ full, rel, ext, size: stat.size });
  }
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) {
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
      consider(full, entry.name);
    }
  }
  try {
    execFileSync('git', ['-C', repoRoot, 'rev-parse', '--is-inside-work-tree'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const raw = execFileSync('git', ['-C', repoRoot, 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'buffer', stdio: ['ignore', 'pipe', 'pipe'] });
    const rels = raw.toString('utf8').split('\0').map((item) => item.trim()).filter(Boolean);
    source.listed_count = rels.length;
    for (const rel of [...new Set(rels)].sort()) {
      const full = path.resolve(repoRoot, rel);
      if (!isPathInside(repoRoot, full)) {
        skip('outside repository', full);
        continue;
      }
      if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
        skip('missing or non-file', full);
        continue;
      }
      if (rel.split('/').some((part) => EXCLUDED_DIRS.has(part))) {
        skip('excluded directory', full);
        continue;
      }
      consider(full);
    }
  } catch (error) {
    source.type = 'filesystem-fallback';
    source.fallback = true;
    source.fallback_reason = error instanceof Error ? error.message : String(error);
    walk(repoRoot);
    source.listed_count = files.length + skipped.length;
  }
  return { files, skipped, source };
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
