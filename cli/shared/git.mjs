import path from 'node:path';
import { execFileSync } from 'node:child_process';

export function findGitRoot(startPath) {
  const resolved = path.resolve(startPath || process.cwd());
  try {
    const out = execFileSync('git', ['-C', resolved, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out || resolved;
  } catch {
    return resolved;
  }
}

export function findGitRootInfo(startPath) {
  const resolved = path.resolve(startPath || process.cwd());
  try {
    const out = execFileSync('git', ['-C', resolved, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return { isGitRepo: true, repoRoot: out || resolved, startPath: resolved };
  } catch {
    return { isGitRepo: false, repoRoot: null, startPath: resolved };
  }
}
