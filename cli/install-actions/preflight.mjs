import fs from 'node:fs';
import path from 'node:path';
import { preflightHookTarget } from '../hook-utils.mjs';
import { bridgeStatus, bridgeTargetNames } from './bridge-writer.mjs';
import { installedSkillStatus, selectedSkillNames } from './skills.mjs';

function preflightSkills(plan) {
  const status = installedSkillStatus(plan.skillsDir, selectedSkillNames(plan));
  if (plan.installSkills) return { enabled: true, skillSet: plan.skillSet, expected: status.expected.length, missing: status.missing, action: 'install-or-refresh' };
  if (plan.command === 'connect') {
    return {
      enabled: false,
      skillSet: plan.skillSet,
      expected: status.expected.length,
      missing: status.missing,
      action: status.missing.length ? (plan.installMissing ? 'install-missing' : 'require-existing') : 'reuse-existing',
    };
  }
  return { enabled: false, skillSet: plan.skillSet, expected: status.expected.length, missing: status.missing, action: 'none' };
}

function preflightProfile(plan) {
  if (!plan.writeProfile || !plan.repoRoot) return { enabled: false, status: 'skipped' };
  const profilePath = path.join(plan.repoRoot, '.jhste', 'profile.yaml');
  if (!fs.existsSync(profilePath)) return { enabled: true, status: 'will-create', path: profilePath };
  return { enabled: true, status: plan.force ? 'will-overwrite-managed' : 'will-keep-existing', path: profilePath };
}

function preflightBridges(plan) {
  if (!plan.writeBridge || !plan.repoRoot) return [];
  return bridgeTargetNames(plan).map((name) => bridgeStatus(plan.repoRoot, name));
}

function preflightHooks(plan) {
  if (!plan.connectRepo || !plan.repoRoot || plan.hooks.length === 0) return [];
  return plan.hooks.map((hook) => ({ ...hook, ...preflightHookTarget(plan.repoRoot, hook.target) }));
}

function preflightDeepScan(plan) {
  if (!plan.deepScan) return { enabled: false, status: 'skipped' };
  if (!plan.repoRoot) return { enabled: false, status: 'skipped-no-repo' };
  return {
    enabled: true,
    status: 'will-run',
    report: path.join(plan.repoRoot, '.jhste', 'deep-scan-report.md'),
    recommendedProfile: path.join(plan.repoRoot, '.jhste', 'profile.recommended.yaml'),
  };
}

export function preflightPlan(plan) {
  return {
    skills: preflightSkills(plan),
    profile: preflightProfile(plan),
    bridges: preflightBridges(plan),
    hooks: preflightHooks(plan),
    deepScan: preflightDeepScan(plan),
  };
}
