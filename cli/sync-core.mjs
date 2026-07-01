import fs from 'node:fs';
import path from 'node:path';
import {
  BRIDGE_BLOCK,
  BRIDGE_END,
  BRIDGE_START,
  KIT_ROOT,
  ask,
  findGitRootInfo,
  listDirectories,
  listSkillDirectories,
  parseArgs,
  generatedProfileShape,
  readIfExists,
} from './shared.mjs';
import { applyPlan, preflightPlan, printApplyResult } from './install-actions.mjs';
import { LEGACY_SKILL_RENAMES, RETIRED_SKILL_REPLACEMENTS, canonicalSkillName } from './install-actions/skill-migrations.mjs';
import { gitHooksDir, HOOKS, isManagedHook } from './hook-utils.mjs';
import { printConfigErrors, printPlanSummary } from './install-flow/output.mjs';
import { readJsonFile, validateStringArray } from './json-file.mjs';

function usage(command = 'sync') {
  console.log(`jhste-skills ${command}
Usage:
  jhste-skills ${command} [--repo <path>] [--skills-dir <path>] [--yes] [--force]
  jhste-skills ${command} [--skills-only] [--skills-dir <path>] [--yes]
  jhste-skills ${command} [--skill-set core|vendor|all] [--skip-hooks] [--no-bridge] [--allow-profile-overwrite]
Notes:
  ${command} reconciles installed skills and already-managed repo outputs using the current local jhste-skills source.
  It does not self-update the jhste-skills source or run git pull automatically.
  Installed skill directories are refreshed by default when they differ from the current source.
  --skills-only refreshes installed skills without touching repo profile, bridge files, hooks, or deep-scan outputs.
  --force refreshes generated/managed profiles; modified profiles need --force --allow-profile-overwrite.
  Unmanaged skill directories require --allow-unmanaged-skill-overwrite.
`);
}

function parseSkillSet(value, errors) {
  if (value === undefined) return undefined;
  const normalized = String(value).toLowerCase();
  if (!['core', 'vendor', 'all'].includes(normalized)) {
    errors.push('--skill-set must be core, vendor, or all.');
    return undefined;
  }
  return normalized;
}

function readBooleanOption(args, key, errors) {
  if (!Object.prototype.hasOwnProperty.call(args, key)) return false;
  if (args[key] !== true) errors.push(`--${key} does not take a value.`);
  return args[key] === true;
}

function normalizeSyncOptions(argv, cwd) {
  const args = parseArgs(argv);
  if (args.help || args.h) return { help: true, errors: [] };
  const errors = [];
  const supported = new Set(['repo', 'skills-dir', 'yes', 'y', 'force', 'skill-set', 'skills-only', 'skip-hooks', 'no-bridge', 'allow-unmanaged-skill-overwrite', 'allow-profile-overwrite', 'help', 'h', '_']);
  for (const key of Object.keys(args)) {
    if (!supported.has(key)) errors.push(`unknown option --${key}.`);
  }
  if (args._.length > 0) errors.push(`unexpected positional argument: ${args._[0]}`);

  const force = readBooleanOption(args, 'force', errors);
  const yes = readBooleanOption(args, 'yes', errors) || readBooleanOption(args, 'y', errors);
  const skillsOnly = readBooleanOption(args, 'skills-only', errors);
  const skipHooks = readBooleanOption(args, 'skip-hooks', errors);
  const noBridge = readBooleanOption(args, 'no-bridge', errors);
  const allowUnmanagedSkillOverwrite = readBooleanOption(args, 'allow-unmanaged-skill-overwrite', errors);
  const allowProfileOverwrite = readBooleanOption(args, 'allow-profile-overwrite', errors);
  const repoInput = typeof args.repo === 'string' ? args.repo : undefined;
  const skillsDirInput = typeof args['skills-dir'] === 'string' ? args['skills-dir'] : undefined;
  const repoStart = path.resolve(repoInput || cwd);
  const skillsDir = path.resolve(skillsDirInput || path.join(process.env.HOME || cwd, '.jhste', 'skills'));
  const skillSet = parseSkillSet(args['skill-set'], errors);

  if (allowProfileOverwrite && !force) errors.push('--allow-profile-overwrite requires --force.');
  if (args.repo === true) errors.push('--repo requires a path value.');
  if (args['skills-dir'] === true) errors.push('--skills-dir requires a path value.');
  if (repoInput) {
    try {
      if (!fs.statSync(repoStart).isDirectory()) errors.push(`--repo must be a directory: ${repoInput}`);
    } catch {
      errors.push(`--repo path does not exist: ${repoInput}`);
    }
  }
  if (fs.existsSync(skillsDir) && !fs.statSync(skillsDir).isDirectory()) {
    errors.push(`--skills-dir must be a directory: ${skillsDir}`);
  }

  return {
    args,
    errors,
    force,
    allowUnmanagedSkillOverwrite,
    allowProfileOverwrite,
    help: false,
    noBridge,
    repoInfo: findGitRootInfo(repoStart),
    repoStart,
    skipHooks,
    skillsOnly,
    skillSet,
    skillsDir,
    yes,
  };
}

function sourceSkillNames() {
  return listSkillDirectories(path.join(KIT_ROOT, 'skills'));
}

function detectInstalledSkillNames(skillsDir) {
  const known = new Set(sourceSkillNames());
  const detected = new Set();
  function addKnown(name) {
    if (known.has(name)) detected.add(name);
  }
  for (const name of listDirectories(skillsDir)) {
    const canonicalName = canonicalSkillName(name);
    addKnown(canonicalName);
    if (Object.prototype.hasOwnProperty.call(LEGACY_SKILL_RENAMES, name)) addKnown(canonicalName);
    for (const replacementName of RETIRED_SKILL_REPLACEMENTS[name] || []) addKnown(replacementName);
  }
  return [...detected];
}

function skillNamesForSet(skillSet) {
  const names = sourceSkillNames();
  if (skillSet === 'all') return names;
  const vendored = new Set(readJsonFile(path.join(KIT_ROOT, 'vendor', 'matt-pocock', 'allowlist.json'), {
    description: 'vendor/matt-pocock/allowlist.json',
    validate: validateStringArray,
  }));
  if (skillSet === 'vendor') return names.filter((name) => vendored.has(name));
  return names.filter((name) => !vendored.has(name));
}

function readHookConfig(repoRoot, target) {
  const hookFile = path.join(gitHooksDir(repoRoot), target);
  if (!fs.existsSync(hookFile)) return null;
  const content = fs.readFileSync(hookFile, 'utf8');
  if (!isManagedHook(content)) return null;
  const modeMatch = content.match(/# mode=(advisory|blocking)\b/);
  const failOnMatch = content.match(/--fail-on (none|warning|error)\b/);
  return {
    target,
    mode: modeMatch?.[1] || 'advisory',
    failOn: failOnMatch?.[1] || (modeMatch?.[1] === 'blocking' ? 'error' : 'none'),
  };
}

function repoLooksManaged(repoRoot) {
  if (!repoRoot) return false;
  const profilePath = path.join(repoRoot, '.jhste', 'profile.yaml');
  if (fs.existsSync(profilePath)) {
    const profileText = fs.readFileSync(profilePath, 'utf8');
    if (generatedProfileShape(profileText)) return true;
  }
  for (const fileName of ['AGENTS.md', 'CLAUDE.md']) {
    const text = readIfExists(path.join(repoRoot, fileName));
    if (!text) continue;
    if (text.includes(BRIDGE_START) && text.includes(BRIDGE_END)) return true;
    if (text.includes(BRIDGE_BLOCK)) return true;
  }
  for (const hook of HOOKS) {
    if (readHookConfig(repoRoot, hook)) return true;
  }
  return false;
}

function detectSyncHooks(repoRoot, skipHooks) {
  if (skipHooks || !repoRoot) return [];
  const existing = Array.from(HOOKS)
    .map((target) => readHookConfig(repoRoot, target))
    .filter(Boolean);
  if (existing.length > 0) return existing;
  if (!repoLooksManaged(repoRoot)) return [];
  return [{ target: 'pre-commit', mode: 'advisory', failOn: 'none' }];
}

function buildSyncPlan(options, command) {
  const installedSkills = detectInstalledSkillNames(options.skillsDir);
  const skillNames = options.skillSet
    ? skillNamesForSet(options.skillSet)
    : (installedSkills.length > 0 ? installedSkills : skillNamesForSet('all'));
  const repoRoot = options.repoInfo.isGitRepo ? options.repoInfo.repoRoot : null;
  const managedRepo = !options.skillsOnly && repoLooksManaged(repoRoot);
  const hooks = options.skillsOnly ? [] : detectSyncHooks(repoRoot, options.skipHooks);

  const plan = {
    command,
    mode: 'sync',
    yes: options.yes,
    force: options.force,
    adoptKnownSkills: true,
    allowUnmanagedSkillOverwrite: options.allowUnmanagedSkillOverwrite,
    allowProfileOverwrite: options.allowProfileOverwrite,
    forceSkills: true,
    installMissing: false,
    overrides: options.skillsOnly ? ['--skills-only'] : [],
    skillSet: options.skillSet || (installedSkills.length > 0 ? 'detected' : 'all'),
    skillNames,
    installSkills: true,
    skillsDir: options.skillsDir,
    repoStart: options.repoStart,
    explicitRepo: Boolean(options.args.repo),
    repoInfo: options.repoInfo,
    repoRoot,
    connectRepo: managedRepo,
    repoSkippedReason: options.skillsOnly ? 'skills-only requested; not touching repo outputs' : (managedRepo ? null : 'not managed by jhste-skills yet'),
    writeProfile: managedRepo,
    writeBridge: managedRepo && !options.noBridge,
    hooks,
    deepScan: false,
    lineLimit: null,
  };
  plan.preflight = preflightPlan(plan);
  return plan;
}

export async function runSyncCommand(command, argv) {
  const options = normalizeSyncOptions(argv, process.cwd());
  if (options.help) {
    usage(command);
    return;
  }
  if (options.errors.length > 0) {
    printConfigErrors(command, options.errors);
    return;
  }
  const plan = buildSyncPlan(options, command);
  printPlanSummary(plan);
  if (!options.yes) {
    const answer = await ask('\nContinue? [Enter=yes / q=cancel] ');
    const normalized = String(answer).trim().toLowerCase();
    if (normalized === 'q' || normalized === 'n' || normalized === 'no') {
      console.log(`${command === 'update' ? 'Update' : 'Sync'} cancelled. No changes made.`);
      return;
    }
  } else {
    console.log('\n--yes was provided, so this will continue without confirmation.');
  }
  const result = applyPlan(plan);
  printApplyResult(plan, result);
  if (result.exitCode) process.exitCode = result.exitCode;
}

export { buildSyncPlan, detectInstalledSkillNames, detectSyncHooks, repoLooksManaged, usage };
