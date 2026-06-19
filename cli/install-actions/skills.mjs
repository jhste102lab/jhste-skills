import fs from 'node:fs';
import path from 'node:path';
import { directoryDigest, ensureDir, KIT_ROOT, listDirectories, nowIso } from '../shared.mjs';
import { readJsonFile, validateJsonObject, validateStringArray } from '../json-file.mjs';

export const SKILLS_MANIFEST_NAME = '.jhste-skills-manifest.json';
export const MANIFEST_MANAGED_BY = 'jhste-skills';

function vendoredSkillNames() {
  const allowlistPath = path.join(KIT_ROOT, 'vendor', 'matt-pocock', 'allowlist.json');
  return new Set(readJsonFile(allowlistPath, {
    description: 'vendor/matt-pocock/allowlist.json',
    validate: validateStringArray,
  }));
}

export function skillNamesForSet(skillSet) {
  const sourceRoot = path.join(KIT_ROOT, 'skills');
  const all = listDirectories(sourceRoot);
  const vendored = vendoredSkillNames();
  if (skillSet === 'all') return all;
  if (skillSet === 'vendor') return all.filter((name) => vendored.has(name));
  return all.filter((name) => !vendored.has(name));
}

export function selectedSkillNames(plan) {
  if (Array.isArray(plan.skillNames) && plan.skillNames.length > 0) return [...plan.skillNames];
  return skillNamesForSet(plan.skillSet);
}

export function installedSkillStatus(skillsDir, skillSet) {
  const expected = Array.isArray(skillSet) ? skillSet : skillNamesForSet(skillSet);
  const missing = expected.filter((name) => !fs.existsSync(path.join(skillsDir, name, 'SKILL.md')));
  return { expected, missing };
}

function manifestPath(skillsDir) {
  return path.join(skillsDir, SKILLS_MANIFEST_NAME);
}

function loadSkillsManifest(skillsDir) {
  const file = manifestPath(skillsDir);
  if (!fs.existsSync(file)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || parsed.managed_by !== MANIFEST_MANAGED_BY || typeof parsed.skills !== 'object' || Array.isArray(parsed.skills)) {
      return { invalid: true, reason: `${SKILLS_MANIFEST_NAME} is not a valid ${MANIFEST_MANAGED_BY} manifest.` };
    }
    return parsed;
  } catch (error) {
    return { invalid: true, reason: error instanceof Error ? error.message : String(error) };
  }
}

function writeSkillsManifest(skillsDir, manifest) {
  ensureDir(skillsDir);
  fs.writeFileSync(manifestPath(skillsDir), `${JSON.stringify(manifest, null, 2)}\n`);
}

function packageVersion() {
  try {
    return String(readJsonFile(path.join(KIT_ROOT, 'package.json'), {
      description: 'package.json',
      validate: validateJsonObject,
    }).version || '0.0.0');
  } catch {
    return '0.0.0';
  }
}

function copyManagedSkill(source, destination, name, { force = false, allowUnmanagedOverwrite = false, manifest = null, nextManifest } = {}) {
  if (!fs.existsSync(source)) return { status: 'missing-source', source, destination };
  const sourceHash = directoryDigest(source);
  const destinationExists = fs.existsSync(destination);
  const destinationHash = destinationExists ? directoryDigest(destination) : null;
  const manifestEntry = manifest?.skills?.[name] || null;
  const manifestOwnsDestination = Boolean(manifestEntry);

  function recordManaged() {
    nextManifest.skills[name] = { digest: sourceHash };
  }

  if (!destinationExists) {
    ensureDir(path.dirname(destination));
    fs.cpSync(source, destination, { recursive: true });
    recordManaged();
    return { status: 'created', source, destination };
  }
  if (sourceHash === destinationHash) {
    recordManaged();
    return { status: 'unchanged', source, destination };
  }
  if (!force) return { status: 'skipped-existing-different', source, destination };
  if (!manifestOwnsDestination && !allowUnmanagedOverwrite) {
    return {
      status: 'skipped-unmanaged-different',
      source,
      destination,
      reason: `${path.basename(destination)} differs and is not recorded as managed by ${MANIFEST_MANAGED_BY}; pass --allow-unmanaged-skill-overwrite only after review`,
    };
  }
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(source, destination, { recursive: true });
  recordManaged();
  return { status: manifestOwnsDestination ? 'overwritten-managed' : 'overwritten-unmanaged', source, destination };
}

function unmanagedSkillConflicts(selected, sourceRoot, skillsDir, currentManifest) {
  const out = [];
  for (const name of selected) {
    const source = path.join(sourceRoot, name);
    const destination = path.join(skillsDir, name);
    if (!fs.existsSync(source) || !fs.existsSync(destination)) continue;
    if (directoryDigest(source) === directoryDigest(destination)) continue;
    if (!currentManifest?.skills?.[name]) {
      out.push({
        status: 'skipped-unmanaged-different',
        source,
        destination,
        reason: `${name} differs and is not recorded as managed by ${MANIFEST_MANAGED_BY}; pass --allow-unmanaged-skill-overwrite only after review`,
      });
    }
  }
  return out;
}

export function installSkills(skillsDir, { force = false, skillSet = 'core', allowUnmanagedOverwrite = false } = {}) {
  const sourceRoot = path.join(KIT_ROOT, 'skills');
  ensureDir(skillsDir);
  const selected = Array.isArray(skillSet) ? skillSet : skillNamesForSet(skillSet);
  const currentManifest = loadSkillsManifest(skillsDir);
  if (currentManifest?.invalid) return [{ status: 'invalid-manifest', source: '', destination: manifestPath(skillsDir), reason: currentManifest.reason }];
  const nextManifest = currentManifest || { managed_by: MANIFEST_MANAGED_BY, version: packageVersion(), installed_at: nowIso(), skills: {} };
  nextManifest.managed_by = MANIFEST_MANAGED_BY;
  nextManifest.version = packageVersion() || String(nextManifest.version || '0.0.0');
  nextManifest.updated_at = nowIso();
  nextManifest.skills ||= {};
  const conflicts = force && !allowUnmanagedOverwrite ? unmanagedSkillConflicts(selected, sourceRoot, skillsDir, currentManifest) : [];
  if (conflicts.length) return conflicts;
  const results = selected.map((name) => copyManagedSkill(path.join(sourceRoot, name), path.join(skillsDir, name), name, {
    force,
    allowUnmanagedOverwrite,
    manifest: currentManifest,
    nextManifest,
  }));
  writeSkillsManifest(skillsDir, nextManifest);
  return results;
}
