import fs from 'node:fs';
import path from 'node:path';
import { parseProfileText } from './parser.mjs';

export function loadProfileConfig(repoRoot) {
  const profilePath = path.join(repoRoot, '.jhste', 'profile.yaml');
  if (!fs.existsSync(profilePath)) return { path: profilePath, exists: false, profile: parseProfileText('') };
  return {
    path: profilePath,
    exists: true,
    profile: parseProfileText(fs.readFileSync(profilePath, 'utf8')),
  };
}
