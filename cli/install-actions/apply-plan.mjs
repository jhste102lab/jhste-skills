import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { KIT_ROOT } from '../shared.mjs';
import { installHookTarget } from '../hook-utils.mjs';
import { bridgeTargetNames, writeManagedBridge } from './bridge-writer.mjs';
import { writeProfile } from './profile-writer.mjs';
import { installSkills } from './skills.mjs';

const EXIT_CONFIG_FAILURE = 3;

export function applyPlan(plan) {
  const result = { skillResults: [], profileResult: null, bridgeResults: [], hookResults: [], deepScanResult: null, exitCode: 0 };

  if (plan.installSkills || (plan.command === 'connect' && plan.installMissing && plan.preflight.skills.missing.length > 0)) {
    result.skillResults = installSkills(plan.skillsDir, {
      force: plan.forceSkills ?? plan.force,
      allowUnmanagedOverwrite: plan.allowUnmanagedSkillOverwrite,
      skillSet: plan.skillNames ?? plan.skillSet,
    });
    if (result.skillResults.some((item) => ['skipped-unmanaged-different', 'invalid-manifest'].includes(item.status))) {
      result.exitCode = EXIT_CONFIG_FAILURE;
      return result;
    }
  }

  if (plan.writeProfile && plan.repoRoot) result.profileResult = writeProfile(plan.repoRoot, { force: plan.force, lineLimit: plan.lineLimit });
  if (plan.writeBridge && plan.repoRoot) result.bridgeResults = bridgeTargetNames(plan).map((name) => writeManagedBridge(plan.repoRoot, name));
  if (plan.hooks.length && plan.repoRoot) {
    result.hookResults = plan.hooks.map((hook) => installHookTarget(plan.repoRoot, hook));
    if (result.hookResults.some((hook) => hook.mode === 'blocking' && ['failed', 'skipped-non-managed'].includes(hook.status))) result.exitCode = EXIT_CONFIG_FAILURE;
  }
  if (plan.deepScan && plan.repoRoot) {
    const scan = spawnSync(process.execPath, [path.join(KIT_ROOT, 'cli', 'deep-scan.mjs'), '--repo', plan.repoRoot], { stdio: 'inherit', timeout: 5 * 60 * 1000 });
    if (scan.error) result.deepScanResult = { status: 'warning', reason: scan.error.message };
    else if ((scan.status ?? 1) !== 0) result.deepScanResult = { status: 'warning', exitCode: scan.status ?? 1 };
    else result.deepScanResult = { status: 'completed' };
  }
  return result;
}
