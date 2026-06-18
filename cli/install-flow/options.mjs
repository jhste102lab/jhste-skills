import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from '../shared.mjs';

export const EXIT_CONFIG_FAILURE = 3;
export const DEFAULT_LINE_LIMIT = 300;
export const MODE_ALIASES = new Map([
  ['minimal', 'minimal'],
  ['min', 'minimal'],
  ['1', 'minimal'],
  ['normal', 'normal'],
  ['default', 'normal'],
  ['2', 'normal'],
  ['full', 'full'],
  ['3', 'full'],
  ['custom', 'custom'],
  ['c', 'custom'],
  ['4', 'custom'],
]);

const SKILL_SET_ALIASES = new Map([
  ['core', 'core'],
  ['core-only', 'core'],
  ['basic', 'core'],
  ['vendor', 'vendor'],
  ['vendor-only', 'vendor'],
  ['all', 'all'],
  ['full', 'all'],
]);
const BOOLEAN_OPTIONS = new Set(['yes', 'force', 'skip-hooks', 'no-bridge', 'skip-deep-scan', 'install-missing', 'no-line-limit']);
const VALUE_OPTIONS = new Set(['repo', 'skills-dir', 'hooks', 'hook', 'skill-set', 'mode', 'line-limit', 'line-limit-mode']);
const HELP_OPTIONS = new Set(['help', 'h']);
const COMMON_OPTIONS = new Set([...BOOLEAN_OPTIONS, ...VALUE_OPTIONS, ...HELP_OPTIONS]);
const HOOK_TARGETS = new Set(['pre-commit', 'pre-push', 'all']);
const HOOK_MODES = new Set(['advisory', 'blocking']);
const LINE_LIMIT_MODES = new Set(['advisory', 'blocking', 'off']);

function hasOption(args, key) {
  return Object.prototype.hasOwnProperty.call(args, key);
}

function readBooleanOption(args, key, errors) {
  if (!hasOption(args, key)) return false;
  if (args[key] !== true) errors.push(`--${key} does not take a value.`);
  return args[key] === true;
}

function readPathOption(args, key, errors) {
  if (!hasOption(args, key)) return undefined;
  const value = args[key];
  if (value === true || String(value).trim() === '') {
    errors.push(`--${key} requires a path value.`);
    return undefined;
  }
  return String(value);
}

function normalizeMode(value, errors, { command }) {
  if (value === undefined || value === true || String(value).trim() === '') return undefined;
  const normalized = MODE_ALIASES.get(String(value).toLowerCase());
  if (!normalized) {
    errors.push(`--mode must be ${command === 'connect' ? 'normal, full, or custom' : 'minimal, normal, full, or custom'}.`);
    return undefined;
  }
  if (command === 'connect' && normalized === 'minimal') {
    errors.push('connect does not support --mode minimal because connect always changes the current project.');
  }
  return normalized;
}

function normalizeSkillSet(value, errors) {
  const requested = value === undefined ? 'core' : String(value).toLowerCase();
  const skillSet = SKILL_SET_ALIASES.get(requested);
  if (!skillSet) errors.push('--skill-set must be core, vendor, or all.');
  return skillSet || 'core';
}

function normalizeHookMode(value, errors) {
  if (value === undefined) return undefined;
  if (value === true) return 'advisory';
  const requested = String(value || '').toLowerCase();
  const hookMode = requested === 'true' ? 'advisory' : requested;
  if (!HOOK_MODES.has(hookMode)) errors.push('--hooks must be advisory or blocking.');
  return HOOK_MODES.has(hookMode) ? hookMode : undefined;
}

function normalizeHookTargets(value, errors) {
  if (value === undefined) return undefined;
  const requested = value === true ? 'pre-commit' : String(value || '').toLowerCase();
  if (!HOOK_TARGETS.has(requested)) {
    errors.push('--hook must be pre-commit, pre-push, or all.');
    return undefined;
  }
  return requested === 'all' ? ['pre-commit', 'pre-push'] : [requested];
}

function normalizeLineLimit(value, errors) {
  if (value === undefined) return DEFAULT_LINE_LIMIT;
  if (value === true || String(value).trim() === '') {
    errors.push('--line-limit requires a positive number.');
    return DEFAULT_LINE_LIMIT;
  }
  const parsed = Number(String(value).trim());
  if (!Number.isInteger(parsed) || parsed < 50 || parsed > 5000) {
    errors.push('--line-limit must be an integer from 50 to 5000.');
    return DEFAULT_LINE_LIMIT;
  }
  return parsed;
}

function normalizeLineLimitMode(value, errors) {
  if (value === undefined) return undefined;
  if (value === true || String(value).trim() === '') return 'advisory';
  const normalized = String(value).toLowerCase();
  if (!LINE_LIMIT_MODES.has(normalized)) {
    errors.push('--line-limit-mode must be advisory, blocking, or off.');
    return undefined;
  }
  return normalized;
}

export function usage(command = 'install') {
  if (command === 'connect') {
    console.log(`jhste-skills connect
Usage:
  jhste-skills connect [--mode normal|full|custom] [--repo <path>] [--skills-dir <path>]
  jhste-skills connect --yes --mode normal|full [--install-missing] [--skip-hooks | --hooks advisory|blocking]
Notes:
  connect attaches an existing jhste-skills install to the current git repository.
  connect requires a git repository and never overwrites non-managed hooks.
  --mode minimal is intentionally invalid for connect.
`);
    return;
  }
  console.log(`jhste-skills install
Usage:
  jhste-skills install [--mode minimal|normal|full|custom] [--yes] [--repo <path>] [--skills-dir <path>]
  jhste-skills install --yes [--skill-set core|vendor|all] [--line-limit <lines>] [--line-limit-mode advisory|blocking|off]
  jhste-skills install --yes [--skip-hooks | --hooks advisory|blocking] [--hook pre-commit|pre-push|all]
Notes:
  Non-interactive installs require explicit --yes or -y.
  The default mode is normal.
  Full installs all safe managed features; blocking hooks require an explicit interactive or CLI choice.
  Line limit defaults to 300 lines when repo profile writing is enabled.
  --skip-hooks and --hooks are mutually exclusive.
`);
}

export function normalizeOptions(argv, { command, cwd, nonInteractive }) {
  const args = parseArgs(argv);
  if (args.help || args.h) return { help: true, errors: [] };
  const errors = [];
  for (const key of Object.keys(args)) {
    if (key !== '_' && !COMMON_OPTIONS.has(key)) errors.push(`unknown option --${key}.`);
  }
  if (args._.length > 0) errors.push(`unexpected positional argument: ${args._[0]}`);
  const yes = readBooleanOption(args, 'yes', errors);
  const force = readBooleanOption(args, 'force', errors);
  const skipHooks = readBooleanOption(args, 'skip-hooks', errors);
  const noBridge = readBooleanOption(args, 'no-bridge', errors);
  const skipDeepScan = readBooleanOption(args, 'skip-deep-scan', errors);
  const installMissing = readBooleanOption(args, 'install-missing', errors);
  const noLineLimit = readBooleanOption(args, 'no-line-limit', errors);
  const repoInput = readPathOption(args, 'repo', errors);
  const skillsDirInput = readPathOption(args, 'skills-dir', errors);
  const mode = normalizeMode(hasOption(args, 'mode') ? args.mode : undefined, errors, { command });
  const skillSet = normalizeSkillSet(hasOption(args, 'skill-set') ? args['skill-set'] : undefined, errors);
  const explicitSkillSet = hasOption(args, 'skill-set');
  const explicitHooks = hasOption(args, 'hooks');
  const explicitHookTargets = hasOption(args, 'hook');
  const hookMode = normalizeHookMode(explicitHooks ? args.hooks : undefined, errors);
  const hookTargets = normalizeHookTargets(explicitHookTargets ? args.hook : undefined, errors);
  const explicitLineLimit = hasOption(args, 'line-limit');
  const explicitLineLimitMode = hasOption(args, 'line-limit-mode');
  const lineLimit = normalizeLineLimit(explicitLineLimit ? args['line-limit'] : undefined, errors);
  const lineLimitMode = normalizeLineLimitMode(explicitLineLimitMode ? args['line-limit-mode'] : undefined, errors);

  if (skipHooks && explicitHooks) errors.push('--skip-hooks and --hooks are mutually exclusive.');
  if (skipHooks && explicitHookTargets) errors.push('--skip-hooks and --hook are mutually exclusive.');
  if (noLineLimit && explicitLineLimit) errors.push('--no-line-limit and --line-limit are mutually exclusive.');
  if (noLineLimit && explicitLineLimitMode && lineLimitMode !== 'off') errors.push('--no-line-limit conflicts with --line-limit-mode unless it is off.');
  if (skipHooks && lineLimitMode === 'blocking') errors.push('--line-limit-mode blocking requires managed hooks; do not combine it with --skip-hooks.');

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

  if (nonInteractive && !yes) errors.push(`non-interactive ${command} requires explicit --yes or -y; refusing to change files.`);
  if (yes && mode === 'custom') errors.push('--mode custom requires interactive answers; do not combine it with --yes.');
  if (nonInteractive && mode === 'custom') errors.push('--mode custom requires an interactive terminal.');

  return {
    args,
    command,
    errors,
    explicitHookTargets,
    explicitHooks,
    explicitMode: hasOption(args, 'mode'),
    explicitRepo: Boolean(repoInput),
    explicitLineLimit,
    explicitLineLimitMode,
    explicitSkillSet,
    force,
    hookMode,
    hookTargets,
    installMissing,
    lineLimit,
    lineLimitMode,
    mode,
    noBridge,
    noLineLimit,
    repoStart,
    skillSet,
    skillsDir,
    skipDeepScan,
    skipHooks,
    yes,
  };
}
