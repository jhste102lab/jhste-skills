import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const TEXT_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.yml', '.yaml']);
const EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'vendor', 'dist', 'build', '.next', 'out', 'coverage', '.turbo', '.cache', '__pycache__']);
const EXCLUDED_FILE_NAMES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'bun.lock', 'poetry.lock', 'Pipfile.lock']);
const SECRET_FILE_RE = /(^|\/)(\.env(\..*)?|.*\.(pem|key|p12|pfx|crt)|id_rsa|id_ed25519)$/i;

function git(repoRoot, args, options = {}) {
  return execFileSync('git', ['-C', repoRoot, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

function normalizePath(value) {
  return value.replaceAll(path.sep, '/').replace(/^\.\//, '');
}

function isScannablePath(relPath) {
  const normalized = normalizePath(relPath);
  if (!normalized || normalized.startsWith('..')) return false;
  if (EXCLUDED_FILE_NAMES.has(path.basename(normalized)) || SECRET_FILE_RE.test(normalized)) return false;
  if (normalized.split('/').some((part) => EXCLUDED_DIRS.has(part))) return false;
  return TEXT_EXTENSIONS.has(path.extname(normalized).toLowerCase());
}

function listAllFiles(repoRoot) {
  const out = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = normalizePath(path.relative(repoRoot, full));
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) walk(full);
        continue;
      }
      if (entry.isFile() && isScannablePath(rel)) out.push(rel);
    }
  }
  walk(repoRoot);
  return out;
}

function readNulFile(filePath) {
  const raw = fs.readFileSync(filePath);
  return raw.toString('utf8').split('\0').map((item) => item.trim()).filter(Boolean);
}

function readGitPathList(repoRoot, args) {
  const raw = execFileSync('git', ['-C', repoRoot, ...args], { encoding: 'buffer', stdio: ['ignore', 'pipe', 'pipe'] });
  return raw.toString('utf8').split('\0').map((item) => item.trim()).filter(Boolean);
}

function resolveBaseRef(repoRoot, explicitBase, headRef) {
  if (explicitBase) return explicitBase;
  for (const candidate of ['origin/main', 'main', 'origin/master', 'master']) {
    try {
      git(repoRoot, ['rev-parse', '--verify', '--quiet', `${candidate}^{commit}`]);
      return git(repoRoot, ['merge-base', candidate, headRef]).trim();
    } catch {
      // Try the next common base candidate.
    }
  }
  try {
    return git(repoRoot, ['rev-parse', `${headRef}^`]).trim();
  } catch {
    return '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
  }
}

function repoRelativePath(repoRoot, rawPath) {
  const raw = String(rawPath || '').trim();
  if (!raw) return '';
  const resolved = path.isAbsolute(raw) ? path.resolve(raw) : path.resolve(repoRoot, raw);
  const relative = normalizePath(path.relative(repoRoot, resolved));
  if (!relative || relative === '.') return '';
  if (relative.startsWith('../') || relative === '..' || path.isAbsolute(relative)) {
    throw new Error(`Path escapes repo root: ${raw}`);
  }
  return relative;
}

function uniqueExistingScannableWithCount(repoRoot, relPaths) {
  const normalized = [];
  for (const relPath of relPaths) {
    if (!relPath) continue;
    normalized.push(repoRelativePath(repoRoot, relPath));
  }
  const unique = [...new Set(normalized)].sort();
  return {
    considered: unique.length,
    files: unique.filter(isScannablePath).filter((rel) => fs.existsSync(path.join(repoRoot, rel))),
  };
}

function scopePayload(repoRoot, scope, relPaths, gitMeta = {}) {
  const { files, considered } = uniqueExistingScannableWithCount(repoRoot, relPaths);
  return { scope, files, files_considered: considered, git: gitMeta };
}

export function resolveScopeFiles(repoRoot, args, callbacks = {}) {
  const failConfig = callbacks.failConfig || ((message) => { throw new Error(message); });
  const failGuard = callbacks.failGuard || ((message) => { throw new Error(message); });
  const scope = String(args.scope || 'changed');
  if (!['changed', 'staged', 'all', 'files-from'].includes(scope)) {
    failConfig(`Unsupported --scope ${scope}. Use changed, staged, all, or files-from.`);
  }
  const gitMeta = {
    root: repoRoot,
    head: '',
    base: '',
  };
  try {
    gitMeta.head = git(repoRoot, ['rev-parse', '--short', 'HEAD']).trim();
  } catch {
    gitMeta.head = 'unavailable';
  }

  if (scope === 'all') {
    const files = listAllFiles(repoRoot).sort();
    return { scope, files, files_considered: files.length, git: gitMeta };
  }

  if (scope === 'files-from') {
    if (!args['files-from']) failConfig('--scope files-from requires --files-from <nul-delimited-file>.');
    let rawPaths;
    try {
      rawPaths = readNulFile(path.resolve(String(args['files-from'])));
    } catch (error) {
      failGuard('Failed to read --files-from input.', [error instanceof Error ? error.message : String(error)]);
    }
    try {
      return scopePayload(repoRoot, scope, rawPaths, gitMeta);
    } catch (error) {
      failGuard('Invalid path in --files-from input.', [error instanceof Error ? error.message : String(error)]);
    }
  }

  if (scope === 'staged') {
    try {
      return scopePayload(repoRoot, scope, readGitPathList(repoRoot, ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMRTUX', '--']), gitMeta);
    } catch (error) {
      failGuard('Failed to resolve staged files.', [error instanceof Error ? error.message : String(error)]);
    }
  }

  try {
    const headRef = String(args.head || 'HEAD');
    const baseRef = resolveBaseRef(repoRoot, args.base ? String(args.base) : '', headRef);
    gitMeta.head = git(repoRoot, ['rev-parse', '--short', headRef]).trim();
    gitMeta.base = baseRef;
    const files = [
      ...readGitPathList(repoRoot, ['diff', '--name-only', '-z', '--diff-filter=ACMRTUX', baseRef, headRef, '--']),
      ...readGitPathList(repoRoot, ['diff', '--name-only', '-z', '--diff-filter=ACMRTUX', '--']),
      ...readGitPathList(repoRoot, ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMRTUX', '--']),
      ...readGitPathList(repoRoot, ['ls-files', '--others', '--exclude-standard', '-z']),
    ];
    return scopePayload(repoRoot, scope, files, gitMeta);
  } catch (error) {
    failGuard('Failed to resolve changed files.', [error instanceof Error ? error.message : String(error)]);
  }
  return { scope, files: [], files_considered: 0, git: gitMeta };
}

