import fs from 'node:fs';
import path from 'node:path';
import { directoryDigest, ensureDir, KIT_ROOT, listSharedResourceNames, listSkillDirectories, nowIso } from '../shared.mjs';
import { readJsonFile, validateJsonObject, validateStringArray } from '../json-file.mjs';

export const SKILLS_MANIFEST_NAME = '.jhste-skills-manifest.json';
export const MANIFEST_MANAGED_BY = 'jhste-skills';
export const LEGACY_SKILL_RENAMES = Object.freeze({
  diagnose: 'diagnosing-bugs',
  'jhste-engineering-judgment': 'jhste-engineering-groundwork',
});

export const DELETED_MANAGED_SKILLS = Object.freeze(['write-a-skill']);

export function canonicalSkillName(name) {
  return LEGACY_SKILL_RENAMES[name] || name;
}

function vendoredSkillNames() {
  const allowlistPath = path.join(KIT_ROOT, 'vendor', 'matt-pocock', 'allowlist.json');
  return new Set(readJsonFile(allowlistPath, {
    description: 'vendor/matt-pocock/allowlist.json',
    validate: validateStringArray,
  }));
}

export function skillNamesForSet(skillSet) {
  const sourceRoot = path.join(KIT_ROOT, 'skills');
  const all = listSkillDirectories(sourceRoot).filter((name) => !Object.prototype.hasOwnProperty.call(LEGACY_SKILL_RENAMES, name));
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

// Single source for manifest-based removal, shared by `uninstall` and `global`.
// Removes every manifest-managed directory (skills and shared companion resources
// such as `_shared`), then the manifest, then best-effort empty-dir cleanup.
export function loadInstalledManifest(skillsDir) {
  const file = manifestPath(skillsDir);
  if (!fs.existsSync(file)) return { manifest: null, path: file };
  try {
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!manifest || typeof manifest !== 'object' || manifest.managed_by !== MANIFEST_MANAGED_BY || typeof manifest.skills !== 'object' || Array.isArray(manifest.skills)) {
      return { invalid: true, path: file, reason: `${SKILLS_MANIFEST_NAME} is not a valid ${MANIFEST_MANAGED_BY} manifest.` };
    }
    return { manifest, path: file };
  } catch (error) {
    return { invalid: true, path: file, reason: error instanceof Error ? error.message : String(error) };
  }
}

export function removeManagedSkills(skillsDir) {
  const loaded = loadInstalledManifest(skillsDir);
  if (loaded.invalid) return { status: 'invalid-manifest', path: loaded.path, reason: loaded.reason, skills: [] };
  if (!loaded.manifest) return { status: 'no-manifest', path: loaded.path, skills: [] };
  const skills = [];
  for (const name of Object.keys(loaded.manifest.skills || {}).sort()) {
    const dir = path.join(skillsDir, name);
    if (!fs.existsSync(dir)) {
      skills.push({ name, status: 'absent' });
      continue;
    }
    fs.rmSync(dir, { recursive: true, force: true });
    skills.push({ name, status: 'removed' });
  }
  fs.rmSync(loaded.path, { force: true });
  try {
    if (fs.existsSync(skillsDir) && fs.readdirSync(skillsDir).length === 0) fs.rmdirSync(skillsDir);
    const parent = path.dirname(skillsDir);
    if (fs.existsSync(parent) && fs.readdirSync(parent).length === 0) fs.rmdirSync(parent);
  } catch {
    // Empty-dir cleanup is best-effort only.
  }
  return { status: 'removed-managed', path: loaded.path, skills };
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

function canAdoptKnownSkill({ manifest = null, adoptKnownSkills = false } = {}) {
  return Boolean(adoptKnownSkills && manifest && !manifest.invalid);
}

function canMigrateLegacySkill({ currentManifest, legacyName, allowUnmanagedOverwrite = false, adoptKnownSkills = false }) {
  if (allowUnmanagedOverwrite) return true;
  if (currentManifest?.skills?.[legacyName]) return true;
  return canAdoptKnownSkill({ manifest: currentManifest, adoptKnownSkills });
}

function removeLegacySkillDirectories(skillsDir, selected, currentManifest, nextManifest, { allowUnmanagedOverwrite = false, adoptKnownSkills = false } = {}) {
  const selectedSet = new Set(selected.map((name) => canonicalSkillName(name)));
  const results = [];
  for (const [legacyName, canonicalName] of Object.entries(LEGACY_SKILL_RENAMES)) {
    delete nextManifest.skills[legacyName];
    if (!selectedSet.has(canonicalName)) continue;
    const legacyPath = path.join(skillsDir, legacyName);
    if (!fs.existsSync(legacyPath)) continue;
    if (!canMigrateLegacySkill({ currentManifest, legacyName, allowUnmanagedOverwrite, adoptKnownSkills })) continue;
    fs.rmSync(legacyPath, { recursive: true, force: true });
    results.push({ status: 'removed-legacy-renamed-skill', source: legacyPath, destination: path.join(skillsDir, canonicalName), legacyName, canonicalName });
  }
  return results;
}

function removeDeletedManagedSkillDirectories(skillsDir, currentManifest, nextManifest) {
  const results = [];
  for (const deletedName of DELETED_MANAGED_SKILLS) {
    const wasManaged = Boolean(currentManifest?.skills?.[deletedName]);
    delete nextManifest.skills[deletedName];
    const deletedPath = path.join(skillsDir, deletedName);
    if (!wasManaged || !fs.existsSync(deletedPath)) continue;
    fs.rmSync(deletedPath, { recursive: true, force: true });
    results.push({ status: 'removed-deleted-managed-skill', source: deletedPath, destination: '', deletedName });
  }
  return results;
}

function copyManagedSkill(source, destination, name, {
  force = false,
  allowUnmanagedOverwrite = false,
  adoptKnownSkills = false,
  manifest = null,
  nextManifest,
} = {}) {
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
  const adoptKnownSkill = !manifestOwnsDestination && canAdoptKnownSkill({ manifest, adoptKnownSkills });
  if (!manifestOwnsDestination && !allowUnmanagedOverwrite && !adoptKnownSkill) {
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
  if (manifestOwnsDestination) return { status: 'overwritten-managed', source, destination };
  if (adoptKnownSkill) return { status: 'adopted-managed', source, destination };
  return { status: 'overwritten-unmanaged', source, destination };
}

function unmanagedSkillConflicts(selected, sourceRoot, skillsDir, currentManifest, { adoptKnownSkills = false } = {}) {
  const canAdopt = canAdoptKnownSkill({ manifest: currentManifest, adoptKnownSkills });
  const out = [];
  for (const name of selected) {
    const source = path.join(sourceRoot, name);
    const destination = path.join(skillsDir, name);
    if (fs.existsSync(source) && fs.existsSync(destination) && directoryDigest(source) !== directoryDigest(destination) && !currentManifest?.skills?.[name] && !canAdopt) {
      out.push({
        status: 'skipped-unmanaged-different',
        source,
        destination,
        reason: `${name} differs and is not recorded as managed by ${MANIFEST_MANAGED_BY}; pass --allow-unmanaged-skill-overwrite only after review`,
      });
    }
  }
  for (const [legacyName, canonicalName] of Object.entries(LEGACY_SKILL_RENAMES)) {
    if (!selected.includes(canonicalName)) continue;
    const legacyPath = path.join(skillsDir, legacyName);
    if (!fs.existsSync(legacyPath)) continue;
    if (canMigrateLegacySkill({ currentManifest, legacyName, adoptKnownSkills })) continue;
    out.push({
      status: 'skipped-unmanaged-different',
      source: legacyPath,
      destination: path.join(skillsDir, canonicalName),
      reason: `${legacyName} is an older skill name that is not recorded as managed by ${MANIFEST_MANAGED_BY}; pass --allow-unmanaged-skill-overwrite only after review`,
    });
  }
  return out;
}

export function installSkills(skillsDir, {
  force = false,
  skillSet = 'core',
  allowUnmanagedOverwrite = false,
  adoptKnownSkills = false,
} = {}) {
  const sourceRoot = path.join(KIT_ROOT, 'skills');
  ensureDir(skillsDir);
  const selected = (Array.isArray(skillSet) ? skillSet : skillNamesForSet(skillSet)).map((name) => canonicalSkillName(name));
  const shared = selected.length ? listSharedResourceNames(sourceRoot) : [];
  const currentManifest = loadSkillsManifest(skillsDir);
  if (currentManifest?.invalid) return [{ status: 'invalid-manifest', source: '', destination: manifestPath(skillsDir), reason: currentManifest.reason }];
  const nextManifest = currentManifest || { managed_by: MANIFEST_MANAGED_BY, version: packageVersion(), installed_at: nowIso(), skills: {} };
  nextManifest.managed_by = MANIFEST_MANAGED_BY;
  nextManifest.version = packageVersion() || String(nextManifest.version || '0.0.0');
  nextManifest.updated_at = nowIso();
  nextManifest.skills ||= {};
  const conflicts = force && !allowUnmanagedOverwrite
    ? unmanagedSkillConflicts([...selected, ...shared], sourceRoot, skillsDir, currentManifest, { adoptKnownSkills })
    : [];
  if (conflicts.length) return conflicts;
  const legacyResults = removeLegacySkillDirectories(skillsDir, selected, currentManifest, nextManifest, {
    allowUnmanagedOverwrite,
    adoptKnownSkills,
  });
  const deletedResults = removeDeletedManagedSkillDirectories(skillsDir, currentManifest, nextManifest);
  const results = selected.map((name) => copyManagedSkill(path.join(sourceRoot, name), path.join(skillsDir, name), name, {
    force,
    allowUnmanagedOverwrite,
    adoptKnownSkills,
    manifest: currentManifest,
    nextManifest,
  }));
  // Copy shared companion resources (e.g. `_shared/` doctrine) alongside skills so
  // installed `../_shared/...` references never dangle. These are not skills and are
  // excluded from skill enumeration/status, but reuse managed-copy semantics.
  const sharedResults = shared.length
    ? shared.map((name) => copyManagedSkill(path.join(sourceRoot, name), path.join(skillsDir, name), name, {
        force,
        allowUnmanagedOverwrite,
        adoptKnownSkills,
        manifest: currentManifest,
        nextManifest,
      }))
    : [];
  writeSkillsManifest(skillsDir, nextManifest);
  return [...legacyResults, ...deletedResults, ...results, ...sharedResults];
}
