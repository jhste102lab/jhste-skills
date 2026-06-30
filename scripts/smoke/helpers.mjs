import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { parseJsonText, validateJsonObject } from '../../cli/json-file.mjs';

export function fail(message) {
  console.error(`smoke-test failed: ${message}`);
  process.exit(1);
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    fail(`${command} ${args.join(' ')} exited ${result.status}`);
  }
  return result;
}

export function runAny(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', ...options });
}

export function parseJsonOutput(text, description) {
  try {
    return parseJsonText(text, { description, validate: validateJsonObject });
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
  return null;
}

export function hashFile(file) {
  return fs.existsSync(file) ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null;
}

export function packageVersion(root) {
  return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
}

export function skillDirs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function readManagedSkillsManifest(skillsDir) {
  const manifestPath = path.join(skillsDir, '.jhste-skills-manifest.json');
  const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) fail('skills manifest is not an object');
  if (parsed.managed_by !== 'jhste-skills') fail('skills manifest managed_by is invalid');
  if (!parsed.skills || typeof parsed.skills !== 'object' || Array.isArray(parsed.skills)) fail('skills manifest skills map is invalid');
  return parsed;
}

export function assertLegacySkillRenameMigration({ root, repo, skillsDir, manifest, legacyName, canonicalName, digest }) {
  const legacyDir = path.join(skillsDir, legacyName);
  fs.mkdirSync(legacyDir, { recursive: true });
  fs.writeFileSync(path.join(legacyDir, 'SKILL.md'), '# stale legacy old-name skill copy\n');
  manifest.skills[legacyName] = { digest };
  fs.writeFileSync(path.join(skillsDir, '.jhste-skills-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  run(process.execPath, [path.join(root, 'cli/update.mjs'), '--yes', '--repo', repo, '--skills-dir', skillsDir], { cwd: repo });

  if (fs.existsSync(legacyDir)) fail(`update did not remove legacy ${legacyName} skill directory`);
  const canonicalSkillPath = path.join(skillsDir, canonicalName, 'SKILL.md');
  if (fs.readFileSync(canonicalSkillPath, 'utf8') !== fs.readFileSync(path.join(root, 'skills', canonicalName, 'SKILL.md'), 'utf8')) {
    fail(`update did not keep canonical ${canonicalName} skill content after legacy migration`);
  }
  const migratedManifest = readManagedSkillsManifest(skillsDir);
  if (migratedManifest.skills?.[legacyName]) fail(`update left legacy ${legacyName} entry in manifest after migration`);
  if (!migratedManifest.skills?.[canonicalName]?.digest) fail(`update did not keep canonical ${canonicalName} entry in manifest after migration`);
  return migratedManifest;
}

export function assertManagedDeletedSkillRemoval({ root, repo, skillsDir, manifest, deletedName, digest }) {
  const deletedDir = path.join(skillsDir, deletedName);
  fs.mkdirSync(deletedDir, { recursive: true });
  fs.writeFileSync(path.join(deletedDir, 'SKILL.md'), '# stale deleted skill copy\n');
  manifest.skills[deletedName] = { digest };
  fs.writeFileSync(path.join(skillsDir, '.jhste-skills-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  run(process.execPath, [path.join(root, 'cli/update.mjs'), '--yes', '--repo', repo, '--skills-dir', skillsDir], { cwd: repo });

  if (fs.existsSync(deletedDir)) fail(`update did not remove deleted managed ${deletedName} skill directory`);
  const updatedManifest = readManagedSkillsManifest(skillsDir);
  if (updatedManifest.skills?.[deletedName]) fail(`update left deleted ${deletedName} entry in manifest`);
  return updatedManifest;
}

export function assertNoInstallSideEffects({ repo, skillsDir, agentsBefore, label }) {
  if (fs.existsSync(path.join(repo, '.jhste'))) fail(`${label} created .jhste`);
  if (fs.existsSync(skillsDir)) fail(`${label} touched skills directory`);
  if (fs.readFileSync(path.join(repo, 'AGENTS.md'), 'utf8') !== agentsBefore) fail(`${label} modified AGENTS.md`);
  if (fs.existsSync(path.join(repo, '.git', 'hooks', 'pre-commit'))) fail(`${label} created pre-commit hook`);
}
