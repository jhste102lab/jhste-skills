import { ask, findGitRootInfo } from '../shared.mjs';
import { preflightPlan } from '../install-actions.mjs';
import {
  defaultLineLimit,
  disabledLineLimit,
  hookActions,
  targetList,
} from './plan-helpers.mjs';
import {
  askFullEnforcement,
  askLineLimitPolicy,
  chooseMode,
  customInstallPlan,
} from './prompts.mjs';

function installMinimalPlan(mode) {
  return {
    mode,
    installSkills: true,
    skillSet: 'core',
    connectRepo: false,
    writeProfile: false,
    writeBridge: false,
    hooks: [],
    deepScan: false,
    lineLimit: disabledLineLimit(),
  };
}

function connectedPlan(mode, { installSkills, hookTargets, deepScan }) {
  return {
    mode,
    installSkills,
    skillSet: 'all',
    connectRepo: true,
    writeProfile: true,
    writeBridge: true,
    hooks: hookActions(hookTargets, 'advisory'),
    deepScan,
    lineLimit: defaultLineLimit(),
  };
}

function installDefaultPlan(mode) {
  return connectedPlan(mode, { installSkills: true, hookTargets: ['pre-commit'], deepScan: false });
}

function installFullPlan(mode) {
  return connectedPlan(mode, { installSkills: true, hookTargets: ['pre-commit', 'pre-push'], deepScan: true });
}

function connectDefaultPlan(mode) {
  return connectedPlan(mode, { installSkills: false, hookTargets: ['pre-commit'], deepScan: false });
}

function connectFullPlan(mode) {
  return connectedPlan(mode, { installSkills: false, hookTargets: ['pre-commit', 'pre-push'], deepScan: true });
}

const INSTALL_MODE_PRESETS = Object.freeze({
  minimal: installMinimalPlan,
  full: installFullPlan,
});

const CONNECT_MODE_PRESETS = Object.freeze({
  full: connectFullPlan,
});

function presetPlan(command, mode) {
  const presets = command === 'connect' ? CONNECT_MODE_PRESETS : INSTALL_MODE_PRESETS;
  const fallback = command === 'connect' ? connectDefaultPlan : installDefaultPlan;
  return (presets[mode] || fallback)(mode);
}

function applyOptionOverrides(plan, options) {
  const overrides = [];
  if (options.explicitSkillSet) {
    plan.skillSet = options.skillSet;
    overrides.push(`--skill-set ${options.skillSet}`);
  }
  if (options.noBridge) {
    plan.writeBridge = false;
    overrides.push('--no-bridge');
  }
  if (options.skipDeepScan) {
    plan.deepScan = false;
    overrides.push('--skip-deep-scan');
  }
  if (options.skipHooks) {
    plan.hooks = [];
    overrides.push('--skip-hooks');
  } else if (options.explicitHooks || options.explicitHookTargets) {
    plan.connectRepo = true;
    const targets = options.hookTargets || targetList(plan);
    const mode = options.hookMode || (plan.hooks[0]?.mode || 'advisory');
    plan.hooks = hookActions(targets, mode);
    if (options.explicitHooks) overrides.push(`--hooks ${mode}`);
    if (options.explicitHookTargets) overrides.push(`--hook ${targets.length === 2 ? 'all' : targets[0]}`);
  }
  return overrides;
}

function attachCommonPlanState(plan, options, overrides) {
  plan.command = options.command;
  plan.force = options.force;
  plan.allowUnmanagedSkillOverwrite = options.allowUnmanagedSkillOverwrite;
  plan.allowProfileOverwrite = options.allowProfileOverwrite;
  plan.installMissing = options.installMissing;
  plan.overrides = overrides;
  plan.skillsDir = options.skillsDir;
  plan.repoStart = options.repoStart;
  plan.explicitRepo = options.explicitRepo;
  plan.yes = options.yes;
  const repoInfo = findGitRootInfo(options.repoStart);
  plan.repoInfo = repoInfo;
  plan.repoRoot = repoInfo.repoRoot;
  return repoInfo;
}

function validateRepoAttachment(plan, options, repoInfo) {
  if (options.command === 'connect' && !repoInfo.isGitRepo) {
    return { errors: [`connect requires a git repository: ${options.repoStart}`] };
  }
  if (plan.connectRepo && !repoInfo.isGitRepo) {
    if (options.explicitRepo) {
      return { errors: [`--repo must point inside a git repository for ${plan.mode} mode: ${options.repoStart}`] };
    }
    plan.repoSkippedReason = 'No current project detected, so project connection was skipped';
    plan.connectRepo = false;
    plan.writeProfile = false;
    plan.writeBridge = false;
    plan.hooks = [];
    plan.deepScan = false;
  }
  if (!plan.connectRepo) {
    plan.writeProfile = false;
    plan.writeBridge = false;
    plan.hooks = [];
    plan.deepScan = false;
  }
  return null;
}

export { chooseMode };

export async function resolvePlan(options) {
  const selectedMode = await chooseMode(options);
  if (selectedMode === 'cancel') return { cancelled: true };
  if (options.command === 'connect' && selectedMode === 'minimal') {
    return { errors: ['connect does not support minimal mode. Use install --mode minimal for computer-only setup.'] };
  }

  const plan = selectedMode === 'custom'
    ? await customInstallPlan(options.command)
    : presetPlan(options.command, selectedMode);
  const overrides = applyOptionOverrides(plan, options);
  const repoInfo = attachCommonPlanState(plan, options, overrides);
  const repoError = validateRepoAttachment(plan, options, repoInfo);
  if (repoError) return repoError;

  await askFullEnforcement(plan, options);
  await askLineLimitPolicy(plan, options);
  plan.preflight = preflightPlan(plan);
  return { plan };
}

export async function maybeInstallMissingForConnect(plan) {
  const missing = plan.preflight.skills.missing;
  if (plan.command !== 'connect' || missing.length === 0 || plan.installMissing) return { ok: true };
  if (plan.yes) {
    return {
      ok: false,
      errors: [
        `connect requires ${plan.skillSet} skills but ${missing.length} are missing.`,
        'Run `jhste-skills install` first or pass --install-missing to install missing skills explicitly.',
      ],
    };
  }
  const answer = await ask(`\n${missing.length} required skills are missing. Install them now? [y=install / Enter=cancel] `);
  if (String(answer).trim().toLowerCase() === 'y') {
    plan.installMissing = true;
    plan.preflight.skills.action = 'install-missing';
    return { ok: true };
  }
  return {
    ok: false,
    errors: [
      `connect requires ${plan.skillSet} skills but ${missing.length} are missing.`,
      'Run `jhste-skills install` first or use `--install-missing`.',
    ],
  };
}
