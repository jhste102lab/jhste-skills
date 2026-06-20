#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  BRIDGE_END,
  BRIDGE_START,
  DEFAULT_PROFILE,
  ask,
  findGitRootInfo,
  parseArgs,
  readIfExists,
  relativeDisplay,
} from './shared.mjs';
import { gitHooksDir, HOOKS, isManagedHook } from './hook-utils.mjs';
import { MANIFEST_MANAGED_BY, SKILLS_MANIFEST_NAME } from './install-actions/skills.mjs';

const EXIT_CONFIG_FAILURE = 3;

function usage() {
  console.log(`jhste-skills uninstall

Usage:
  jhste-skills uninstall [--repo <path>] [--skills-dir <path>] [--yes]
  jhste-skills uninstall [--repo-only | --skills-only] [--keep-profile | --force-profile]

Notes:
  Removes only jhste-skills managed outputs.
  Managed hooks and marker-managed bridge blocks are removed when a git repo is available.
  Manifest-managed skill directories are removed from --skills-dir.
  .jhste/profile.yaml is removed only when it still looks generated; use --force-profile after review.
`);
}

function fail(message) {
  console.error(`jhste-skills uninstall: ${message}`);
  process.exit(EXIT_CONFIG_FAILURE);
}

function hasOption(args, key) {
  return Object.prototype.hasOwnProperty.call(args, key);
}

function readBoolean(args, key, errors) {
  if (!hasOption(args, key)) return false;
  if (args[key] !== true) errors.push(`--${key} does not take a value.`);
  return args[key] === true;
}

function readPath(args, key, errors) {
  if (!hasOption(args, key)) return undefined;
  const value = args[key];
  if (value === true || String(value).trim() === '') {
    errors.push(`--${key} requires a path value.`);
    return undefined;
  }
  return String(value);
}

function normalizeOptions(argv, cwd) {
  const args = parseArgs(argv);
  if (args.help || args.h) return { help: true, errors: [] };
  const errors = [];
  const supported = new Set(['repo', 'skills-dir', 'yes', 'y', 'repo-only', 'skills-only', 'keep-profile', 'force-profile', 'help', 'h', '_']);
  for (const key of Object.keys(args)) {
    if (!supported.has(key)) errors.push(`unknown option --${key}.`);
  }
  if (args._.length > 0) errors.push(`unexpected positional argument: ${args._[0]}`);

  const yes = readBoolean(args, 'yes', errors) || readBoolean(args, 'y', errors);
  const repoOnly = readBoolean(args, 'repo-only', errors);
  const skillsOnly = readBoolean(args, 'skills-only', errors);
  const keepProfile = readBoolean(args, 'keep-profile', errors);
  const forceProfile = readBoolean(args, 'force-profile', errors);
  const repoInput = readPath(args, 'repo', errors);
  const skillsDirInput = readPath(args, 'skills-dir', errors);

  if (repoOnly && skillsOnly) errors.push('--repo-only and --skills-only are mutually exclusive.');
  if (keepProfile && forceProfile) errors.push('--keep-profile and --force-profile are mutually exclusive.');

  const repoStart = path.resolve(repoInput || cwd);
  if (repoInput) {
    try {
      if (!fs.statSync(repoStart).isDirectory()) errors.push(`--repo must be a directory: ${repoInput}`);
    } catch {
      errors.push(`--repo path does not exist: ${repoInput}`);
    }
  }

  const skillsDir = path.resolve(skillsDirInput || path.join(os.homedir(), '.jhste', 'skills'));
  if (fs.existsSync(skillsDir) && !fs.statSync(skillsDir).isDirectory()) {
    errors.push(`--skills-dir must be a directory: ${skillsDirInput || skillsDir}`);
  }

  if (!yes && !process.stdin.isTTY) errors.push('non-interactive uninstall requires explicit --yes or -y; refusing to change files.');

  return {
    errors,
    forceProfile,
    help: false,
    keepProfile,
    repoInfo: findGitRootInfo(repoStart),
    repoOnly,
    skillsDir,
    skillsOnly,
    yes,
  };
}

function removeManagedHooks(repoRoot) {
  const results = [];
  let hooksDir;
  try {
    hooksDir = gitHooksDir(repoRoot);
  } catch {
    return [{ target: 'all', status: 'skipped', reason: 'not a git repository' }];
  }
  for (const hook of HOOKS) {
    const file = path.join(hooksDir, hook);
    if (!fs.existsSync(file)) {
      results.push({ target: hook, status: 'absent' });
      continue;
    }
    const existing = fs.readFileSync(file, 'utf8');
    if (!isManagedHook(existing)) {
      results.push({ target: hook, status: 'left-non-managed' });
      continue;
    }
    fs.rmSync(file);
    results.push({ target: hook, status: 'removed' });
  }
  return results;
}

function removeManagedBridgeBlock(text) {
  const start = text.indexOf(BRIDGE_START);
  const end = text.indexOf(BRIDGE_END, start === -1 ? 0 : start);
  if (start === -1 || end === -1) return null;
  const afterEnd = end + BRIDGE_END.length;
  let updated = `${text.slice(0, start)}${text.slice(afterEnd)}`;
  updated = updated.replace(/\n{3,}/g, '\n\n');
  return updated.trim() === '' ? '' : updated.replace(/[ \t]+\n/g, '\n').replace(/^\n+/, '').replace(/\n+$/, '\n');
}

function removeManagedBridge(repoRoot, fileName) {
  const file = path.join(repoRoot, fileName);
  const existing = readIfExists(file);
  if (existing === null) return { fileName, status: 'absent' };
  const updated = removeManagedBridgeBlock(existing);
  if (updated === null) return { fileName, status: 'left-unmanaged' };
  if (updated === '') {
    fs.rmSync(file);
    return { fileName, status: 'removed-empty-file' };
  }
  fs.writeFileSync(file, updated);
  return { fileName, status: 'removed-managed-block' };
}

function generatedProfileShape(text) {
  const normalize = (value) => value
    .replace(/^installed_at:.*$/m, 'installed_at: "<installed_at>"')
    .replace(/  file_size_advisory:\n(?:    .+\n){1,3}/, '  file_size_advisory:\n    <line-limit-block>\n')
    .trim();
  const template = DEFAULT_PROFILE
    .replace(/  file_size_advisory:\n(?:    .+\n){1,3}/, '  file_size_advisory:\n    <line-limit-block>\n')
    .trim();
  return normalize(text) === template;
}

function removeGeneratedProfile(repoRoot, { keepProfile, forceProfile }) {
  const file = path.join(repoRoot, '.jhste', 'profile.yaml');
  if (!fs.existsSync(file)) return { status: 'absent', path: file };
  if (keepProfile) return { status: 'kept', path: file };
  const existing = fs.readFileSync(file, 'utf8');
  if (!forceProfile && !generatedProfileShape(existing)) {
    return { status: 'left-modified', path: file, reason: 'profile does not match the generated shape; pass --force-profile after review' };
  }
  fs.rmSync(file);
  const dir = path.dirname(file);
  try {
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  } catch {
    // Empty-dir cleanup is best-effort only.
  }
  return { status: forceProfile ? 'removed-forced' : 'removed-generated', path: file };
}

function removeRepoOutputs(repoInfo, options) {
  if (!repoInfo.isGitRepo) return { skipped: true, reason: 'no git repository detected' };
  const repoRoot = repoInfo.repoRoot;
  return {
    repoRoot,
    hooks: removeManagedHooks(repoRoot),
    bridges: ['AGENTS.md', 'CLAUDE.md'].map((fileName) => removeManagedBridge(repoRoot, fileName)),
    profile: removeGeneratedProfile(repoRoot, options),
  };
}

function loadManifest(skillsDir) {
  const file = path.join(skillsDir, SKILLS_MANIFEST_NAME);
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

function removeManagedSkills(skillsDir) {
  const loaded = loadManifest(skillsDir);
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

function printSummary(options, repoResult, skillsResult) {
  console.log('\nUninstall completed.');
  if (repoResult) {
    if (repoResult.skipped) {
      console.log(`- Repo outputs: skipped (${repoResult.reason})`);
    } else {
      console.log(`- Repo: ${repoResult.repoRoot}`);
      for (const hook of repoResult.hooks) console.log(`  - Hook ${hook.target}: ${hook.status}${hook.reason ? ` - ${hook.reason}` : ''}`);
      for (const bridge of repoResult.bridges) console.log(`  - Bridge ${bridge.fileName}: ${bridge.status}`);
      console.log(`  - Profile: ${repoResult.profile.status} (${relativeDisplay(repoResult.repoRoot, repoResult.profile.path)})${repoResult.profile.reason ? ` - ${repoResult.profile.reason}` : ''}`);
    }
  }
  if (skillsResult) {
    if (skillsResult.status === 'removed-managed') {
      const removed = skillsResult.skills.filter((skill) => skill.status === 'removed').length;
      const absent = skillsResult.skills.filter((skill) => skill.status === 'absent').length;
      console.log(`- Skills: removed=${removed}${absent ? `, absent=${absent}` : ''}`);
    } else {
      console.log(`- Skills: ${skillsResult.status}${skillsResult.reason ? ` - ${skillsResult.reason}` : ''}`);
    }
  }
  console.log('- Non-managed hooks, bridge text, and skill directories: left untouched');
  if (options.keepProfile) console.log('- Profile was kept by request');
}

const options = normalizeOptions(process.argv.slice(2), process.cwd());
if (options.help) {
  usage();
  process.exit(0);
}
if (options.errors.length > 0) fail(options.errors.join('\n'));

const planned = [];
if (!options.skillsOnly) planned.push(options.repoInfo.isGitRepo ? `repo outputs in ${options.repoInfo.repoRoot}` : 'repo outputs (skipped: no git repo detected)');
if (!options.repoOnly) planned.push(`manifest-managed skills in ${options.skillsDir}`);
console.log(`jhste-skills uninstall will remove ${planned.join(' and ')}.`);
if (!options.yes) {
  const answer = await ask('\nContinue? [Enter=yes / q=cancel] ');
  const normalized = String(answer).trim().toLowerCase();
  if (normalized === 'q' || normalized === 'n' || normalized === 'no') {
    console.log('Uninstall cancelled. No changes made.');
    process.exit(0);
  }
} else {
  console.log('--yes was provided, so this will continue without confirmation.');
}

const repoResult = options.skillsOnly ? null : removeRepoOutputs(options.repoInfo, options);
const skillsResult = options.repoOnly ? null : removeManagedSkills(options.skillsDir);
printSummary(options, repoResult, skillsResult);
if (skillsResult?.status === 'invalid-manifest') process.exitCode = EXIT_CONFIG_FAILURE;
