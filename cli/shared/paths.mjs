import path from 'node:path';

export function isPathInside(parent, child) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

export function resolveRepoContainedPath(repoRoot, inputPath, { label = 'path' } = {}) {
  const raw = String(inputPath || '').trim();
  if (!raw) throw new Error(`${label} must not be empty.`);
  const resolved = path.isAbsolute(raw) ? path.resolve(raw) : path.resolve(repoRoot, raw);
  if (!isPathInside(repoRoot, resolved)) {
    throw new Error(`${label} must resolve inside the repository: ${raw}`);
  }
  return resolved;
}

export function relativeDisplay(root, file) {
  return path.relative(root, file).replaceAll(path.sep, '/') || '.';
}

export function printChangedFiles(repoRoot, files, { prefix = 'Changed files' } = {}) {
  const normalized = [...new Set((files || []).filter(Boolean).map((file) => relativeDisplay(repoRoot, file)))];
  console.log(`${prefix}:`);
  for (const file of normalized) console.log(`- ${file}`);
  if (normalized.length === 0) console.log('- none');
}
