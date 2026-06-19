import { ask, relativeDisplay } from '../shared.mjs';
import { EXIT_CONFIG_FAILURE } from './options.mjs';

function describeSkillSet(skillSet) {
  if (skillSet === 'detected') return 'Currently installed skills';
  if (skillSet === 'all') return 'Core features + all optional features';
  if (skillSet === 'vendor') return 'Optional features only (advanced option)';
  return 'Core features';
}

function describeHookMode(mode) {
  return mode === 'blocking' ? 'Block on detected issues' : 'Show warnings only';
}

export function printPlanSummary(plan) {
  const heading = {
    connect: 'Connection plan',
    install: 'Install plan',
    sync: 'Sync plan',
    update: 'Update plan',
  }[plan.command] || 'Plan';
  console.log(`\n${heading}:`);
  console.log(`- Command: ${plan.command}`);
  console.log(`- Mode: ${plan.mode}`);
  if (plan.overrides.length) console.log(`- Applied overrides: ${plan.overrides.join(', ')}`);
  console.log(`- Feature set: ${describeSkillSet(plan.skillSet)}`);
  console.log(`- Skills directory: ${plan.skillsDir}`);
  if (plan.preflight.skills.enabled) {
    console.log(`- Skills: ${plan.preflight.skills.expected} to install or update`);
  } else if (plan.command === 'connect') {
    if (plan.preflight.skills.action === 'install-missing') {
      console.log(`- Skills: install missing after checking existing copies (${plan.preflight.skills.expected} required, missing=${plan.preflight.skills.missing.length})`);
    } else {
      console.log(`- Skills: use existing installation (${plan.preflight.skills.expected} required, missing=${plan.preflight.skills.missing.length})`);
    }
  } else {
    console.log('- Skills: not installing');
  }

  if (plan.connectRepo) {
    console.log(`- Current project: ${plan.repoRoot}`);
    console.log(`- Config file: ${plan.preflight.profile.status}`);
    if (plan.writeBridge) {
      for (const bridge of plan.preflight.bridges) {
        console.log(`- AI bridge: ${bridge.fileName} ${bridge.status}`);
      }
    } else {
      console.log('- AI bridge: not adding');
    }
  } else {
    console.log(`- Current project: ${plan.repoSkippedReason || 'not connecting'}`);
  }

  printLineLimitSummary(plan);
  printHookSummary(plan);
  if (plan.preflight.deepScan.enabled) {
    console.log('- Deep scan: run now (may take a few minutes, does not modify source code)');
    console.log(`  - Report: ${relativeDisplay(plan.repoRoot, plan.preflight.deepScan.report)}`);
    console.log(`  - Recommended settings: ${relativeDisplay(plan.repoRoot, plan.preflight.deepScan.recommendedProfile)}`);
  } else {
    console.log('- Deep scan: not running');
  }
  console.log('- Left untouched: CI, package.json, lockfile, source code, non-managed hooks');
  if (plan.force) {
    console.log('- Note: --force refreshes only jhste-managed outputs and does not overwrite user-owned hooks, source, or CI files');
  }
}

function printLineLimitSummary(plan) {
  if (!plan.writeProfile || !plan.lineLimit) return;
  if (plan.lineLimit.enabled) {
    const behavior = plan.lineLimit.enforcement === 'blocking' ? 'block commits' : 'show warnings only';
    console.log(`- Line limit: ${behavior} above ${plan.lineLimit.maxLines} lines`);
  } else {
    console.log('- Line limit: not used');
  }
}

function printHookSummary(plan) {
  if (plan.hooks.length) {
    console.log('- Automatic checks:');
    for (const hook of plan.preflight.hooks) {
      const failOn = hook.failOn && hook.failOn !== 'none' ? `, fail-on=${hook.failOn}` : '';
      console.log(`  - ${hook.target}: ${describeHookMode(hook.mode)}${failOn} (${hook.status})`);
    }
  } else {
    console.log('- Automatic checks: not installing');
  }
}

export async function confirmPlan(plan) {
  if (plan.yes) {
    console.log('\n--yes was provided, so this will continue without confirmation.');
    return 'yes';
  }
  const answer = await ask('\nContinue? [Enter=yes / c=customize / q=cancel] ');
  const normalized = String(answer).trim().toLowerCase();
  if (normalized === 'q' || normalized === 'n' || normalized === 'no') return 'cancel';
  if (normalized === 'c') return 'custom';
  return 'yes';
}

export function printConfigErrors(command, errors) {
  for (const error of errors) console.error(`jhste-skills ${command}: ${error}`);
  process.exitCode = EXIT_CONFIG_FAILURE;
}
