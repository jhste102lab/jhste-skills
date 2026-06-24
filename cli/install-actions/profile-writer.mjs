import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_PROFILE, ensureDir, generatedProfileShape, nowIso } from '../shared.mjs';

function renderProfile(lineLimit) {
  const base = DEFAULT_PROFILE.replace('<installed_at>', nowIso());
  const limit = lineLimit || { enabled: true, maxLines: 300, enforcement: 'advisory' };
  const fileSizeBlock = limit.enabled
    ? `  file_size_advisory:\n    mode: advisory\n    source_file_warning_lines: ${limit.maxLines}\n    source_file_review_lines: ${limit.maxLines}`
    : `  file_size_advisory:\n    mode: off`;
  return base.replace(/  file_size_advisory:\n(?:    .+\n){2,3}/, `${fileSizeBlock}\n`);
}

export function writeProfile(repoRoot, { force = false, allowProfileOverwrite = false, lineLimit = null } = {}) {
  const profilePath = path.join(repoRoot, '.jhste', 'profile.yaml');
  const existed = fs.existsSync(profilePath);
  if (existed) {
    const existing = fs.readFileSync(profilePath, 'utf8');
    const managed = generatedProfileShape(existing);
    if (!force) {
      return {
        status: managed ? 'skipped-existing' : 'skipped-modified',
        path: profilePath,
        reason: managed ? undefined : 'existing profile does not match the generated shape',
      };
    }
    if (!managed && !allowProfileOverwrite) {
      return {
        status: 'skipped-modified',
        path: profilePath,
        reason: 'pass --force --allow-profile-overwrite to replace a modified profile',
      };
    }
    ensureDir(path.dirname(profilePath));
    fs.writeFileSync(profilePath, renderProfile(lineLimit));
    return { status: managed ? 'overwritten-managed' : 'overwritten-modified', path: profilePath };
  }
  ensureDir(path.dirname(profilePath));
  fs.writeFileSync(profilePath, renderProfile(lineLimit));
  return { status: 'created', path: profilePath };
}
