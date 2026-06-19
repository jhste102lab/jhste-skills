import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_PROFILE, ensureDir, nowIso } from '../shared.mjs';

function renderProfile(lineLimit) {
  const base = DEFAULT_PROFILE.replace('<installed_at>', nowIso());
  const limit = lineLimit || { enabled: true, maxLines: 300, enforcement: 'advisory' };
  const fileSizeBlock = limit.enabled
    ? `  file_size_advisory:\n    mode: advisory\n    source_file_warning_lines: ${limit.maxLines}\n    source_file_review_lines: ${limit.maxLines}`
    : `  file_size_advisory:\n    mode: off`;
  return base.replace(/  file_size_advisory:\n(?:    .+\n){2,3}/, `${fileSizeBlock}\n`);
}

export function writeProfile(repoRoot, { force = false, lineLimit = null } = {}) {
  const profilePath = path.join(repoRoot, '.jhste', 'profile.yaml');
  if (fs.existsSync(profilePath) && !force) return { status: 'skipped-existing', path: profilePath };
  const existed = fs.existsSync(profilePath);
  ensureDir(path.dirname(profilePath));
  fs.writeFileSync(profilePath, renderProfile(lineLimit));
  return { status: existed ? 'overwritten-managed' : 'created', path: profilePath };
}
