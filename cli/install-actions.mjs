import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  BRIDGE_BLOCK,
  BRIDGE_END,
  BRIDGE_START,
  copyDirSafe,
  DEFAULT_PROFILE,
  ensureDir,
  KIT_ROOT,
  listDirectories,
  MANAGED_BRIDGE_BLOCK,
  nowIso,
  readIfExists,
  relativeDisplay,
} from './shared.mjs';
import { installHookTarget, preflightHookTarget } from './hook-utils.mjs';

const EXIT_CONFIG_FAILURE = 3;

export function preflightPlan(plan) {
  return {
    skills: preflightSkills(plan),
    profile: preflightProfile(plan),
    bridges: preflightBridges(plan),
    hooks: preflightHooks(plan),
    deepScan: preflightDeepScan(plan),
  };
}

function vendoredSkillNames() {
  const allowlistPath = path.join(KIT_ROOT, 'vendor', 'matt-pocock', 'allowlist.json');
  const parsed = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
  if (!Array.isArray(parsed) || !parsed.every((name) => typeof name === 'string' && name.trim())) {
    throw new Error('vendor/matt-pocock/allowlist.json must be a JSON array of skill names.');
  }
  return new Set(parsed);
}

function skillNamesForSet(skillSet) {
  const sourceRoot = path.join(KIT_ROOT, 'skills');
  const all = listDirectories(sourceRoot);
  const vendored = vendoredSkillNames();
  if (skillSet === 'all') return all;
  if (skillSet === 'vendor') return all.filter((name) => vendored.has(name));
  return all.filter((name) => !vendored.has(name));
}

function installedSkillStatus(skillsDir, skillSet) {
  const expected = skillNamesForSet(skillSet);
  const missing = expected.filter((name) => !fs.existsSync(path.join(skillsDir, name, 'SKILL.md')));
  return { expected, missing };
}

function preflightSkills(plan) {
  const status = installedSkillStatus(plan.skillsDir, plan.skillSet);
  if (plan.installSkills) {
    return {
      enabled: true,
      skillSet: plan.skillSet,
      expected: status.expected.length,
      missing: status.missing,
      action: 'install-or-refresh',
    };
  }
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

export function bridgeTargetNames(plan) {
  if (!plan.writeBridge || !plan.repoRoot) return [];
  const names = ['AGENTS.md', 'CLAUDE.md'];
  const existing = names.filter((name) => fs.existsSync(path.join(plan.repoRoot, name)));
  return existing.length ? existing : ['AGENTS.md'];
}

function bridgeStatus(repoRoot, fileName) {
  const target = path.join(repoRoot, fileName);
  const existing = readIfExists(target);
  if (existing === null) return { fileName, path: target, status: 'will-create' };
  if (existing.includes(BRIDGE_START) && existing.includes(BRIDGE_END)) {
    return existing.includes(MANAGED_BRIDGE_BLOCK)
      ? { fileName, path: target, status: 'already-managed' }
      : { fileName, path: target, status: 'will-update-managed' };
  }
  if (existing.includes(BRIDGE_BLOCK)) return { fileName, path: target, status: 'will-migrate-legacy' };
  if (/^##\s+Agent skills\s*$/m.test(existing) || /jhste skills/i.test(existing)) {
    return { fileName, path: target, status: 'manual-review' };
  }
  return { fileName, path: target, status: 'will-append-managed' };
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

function renderProfile(lineLimit) {
  const base = DEFAULT_PROFILE.replace('<installed_at>', nowIso());
  const limit = lineLimit || { enabled: true, maxLines: 300, enforcement: 'advisory' };
  const fileSizeBlock = limit.enabled
    ? `  file_size_advisory:
    mode: advisory
    source_file_warning_lines: ${limit.maxLines}
    source_file_review_lines: ${limit.maxLines}`
    : `  file_size_advisory:
    mode: off`;
  return base.replace(/  file_size_advisory:\n(?:    .+\n){2,3}/, `${fileSizeBlock}\n`);
}

function writeProfile(repoRoot, { force = false, lineLimit = null } = {}) {
  const profilePath = path.join(repoRoot, '.jhste', 'profile.yaml');
  if (fs.existsSync(profilePath) && !force) {
    return { status: 'skipped-existing', path: profilePath };
  }
  const existed = fs.existsSync(profilePath);
  ensureDir(path.dirname(profilePath));
  fs.writeFileSync(profilePath, renderProfile(lineLimit));
  return { status: existed ? 'overwritten-managed' : 'created', path: profilePath };
}

function writeManagedBridge(repoRoot, fileName) {
  const target = path.join(repoRoot, fileName);
  const existing = readIfExists(target);
  if (existing === null) {
    fs.writeFileSync(target, `${MANAGED_BRIDGE_BLOCK}\n`);
    return { status: 'created', path: target };
  }
  if (existing.includes(BRIDGE_START) && existing.includes(BRIDGE_END)) {
    const pattern = new RegExp(`${escapeRegExp(BRIDGE_START)}[\\s\\S]*?${escapeRegExp(BRIDGE_END)}`);
    const updated = existing.replace(pattern, MANAGED_BRIDGE_BLOCK);
    if (updated === existing) return { status: 'unchanged', path: target };
    fs.writeFileSync(target, updated);
    return { status: 'updated-managed', path: target };
  }
  if (existing.includes(BRIDGE_BLOCK)) {
    fs.writeFileSync(target, existing.replace(BRIDGE_BLOCK, MANAGED_BRIDGE_BLOCK));
    return { status: 'migrated-legacy', path: target };
  }
  if (/^##\s+Agent skills\s*$/m.test(existing) || /jhste skills/i.test(existing)) {
    return { status: 'manual-review', path: target, snippet: MANAGED_BRIDGE_BLOCK };
  }
  const prefix = existing.endsWith('\n') ? existing : `${existing}\n`;
  fs.writeFileSync(target, `${prefix}\n${MANAGED_BRIDGE_BLOCK}\n`);
  return { status: 'appended-managed', path: target };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function installSkills(skillsDir, { force = false, skillSet = 'core' } = {}) {
  const sourceRoot = path.join(KIT_ROOT, 'skills');
  ensureDir(skillsDir);
  return skillNamesForSet(skillSet).map((name) => copyDirSafe(path.join(sourceRoot, name), path.join(skillsDir, name), { force }));
}

export function applyPlan(plan) {
  const result = {
    skillResults: [],
    profileResult: null,
    bridgeResults: [],
    hookResults: [],
    deepScanResult: null,
    exitCode: 0,
  };

  if (plan.installSkills || (plan.command === 'connect' && plan.installMissing && plan.preflight.skills.missing.length > 0)) {
    result.skillResults = installSkills(plan.skillsDir, { force: plan.force, skillSet: plan.skillSet });
  }

  if (plan.writeProfile && plan.repoRoot) {
    result.profileResult = writeProfile(plan.repoRoot, { force: plan.force, lineLimit: plan.lineLimit });
  }

  if (plan.writeBridge && plan.repoRoot) {
    result.bridgeResults = bridgeTargetNames(plan).map((name) => writeManagedBridge(plan.repoRoot, name));
  }

  if (plan.hooks.length && plan.repoRoot) {
    result.hookResults = plan.hooks.map((hook) => installHookTarget(plan.repoRoot, hook));
    if (result.hookResults.some((hook) => hook.mode === 'blocking' && ['failed', 'skipped-non-managed'].includes(hook.status))) {
      result.exitCode = EXIT_CONFIG_FAILURE;
    }
  }

  if (plan.deepScan && plan.repoRoot) {
    const scan = spawnSync(process.execPath, [path.join(KIT_ROOT, 'cli', 'deep-scan.mjs'), '--repo', plan.repoRoot], {
      stdio: 'inherit',
      timeout: 5 * 60 * 1000,
    });
    if (scan.error) {
      result.deepScanResult = { status: 'warning', reason: scan.error.message };
    } else if ((scan.status ?? 1) !== 0) {
      result.deepScanResult = { status: 'warning', exitCode: scan.status ?? 1 };
    } else {
      result.deepScanResult = { status: 'completed' };
    }
  }

  return result;
}

function summarizeStatuses(results) {
  return results.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
}

export function printApplyResult(plan, result) {
  console.log(`\n${plan.command === 'connect' ? '연결이' : '설치가'} 끝났습니다.`);
  if (result.skillResults.length) {
    const summary = summarizeStatuses(result.skillResults);
    console.log(`- Skills: ${Object.entries(summary).map(([k, v]) => `${k}=${v}`).join(', ') || 'none'}`);
  } else {
    console.log('- Skills: 변경 없음');
  }
  if (result.profileResult) {
    console.log(`- Profile: ${result.profileResult.status} (${relativeDisplay(plan.repoRoot, result.profileResult.path)})`);
  } else {
    console.log('- Profile: 변경 없음');
  }
  for (const bridge of result.bridgeResults) {
    console.log(`- Bridge: ${path.basename(bridge.path)} ${bridge.status}`);
    if (bridge.status === 'manual-review') {
      console.log('  Manual snippet:');
      console.log(bridge.snippet.split('\n').map((line) => `  ${line}`).join('\n'));
    }
  }
  for (const hook of result.hookResults) {
    const reason = hook.reason ? ` - ${hook.reason}` : '';
    const failOn = hook.failOn && hook.failOn !== 'none' ? `, fail-on=${hook.failOn}` : '';
    console.log(`- Hook ${hook.target}: ${hook.status}${hook.mode ? ` (${hook.mode}${failOn})` : ''}${reason}`);
  }
  if (result.deepScanResult) {
    if (result.deepScanResult.status === 'completed') {
      console.log('- Deep scan: completed');
    } else {
      console.log(`- Deep scan: warning${result.deepScanResult.reason ? ` (${result.deepScanResult.reason})` : result.deepScanResult.exitCode ? ` (exit ${result.deepScanResult.exitCode})` : ''}`);
    }
  }
  console.log('- CI/package.json/lockfile/source code: unchanged by installer');
  console.log('- Non-managed hooks: never overwritten');
  if (!plan.deepScan) {
    console.log('\n나중에 deep scan을 실행하려면:');
    console.log('  npx jhste-skills deep-scan');
  }
}
