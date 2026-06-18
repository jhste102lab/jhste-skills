import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ask,
  findGitRootInfo,
  parseArgs,
  relativeDisplay,
} from './shared.mjs';
import { preflightPlan } from './install-actions.mjs';
export { applyPlan, printApplyResult } from './install-actions.mjs';
export const EXIT_CONFIG_FAILURE = 3;
const MODE_ALIASES = new Map([
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
const DEFAULT_LINE_LIMIT = 300;
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

  if (nonInteractive && !yes) {
    errors.push(`non-interactive ${command} requires explicit --yes or -y; refusing to change files.`);
  }
  if (yes && mode === 'custom') {
    errors.push('--mode custom requires interactive answers; do not combine it with --yes.');
  }
  if (nonInteractive && mode === 'custom') {
    errors.push('--mode custom requires an interactive terminal.');
  }

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

function presetPlan(command, mode) {
  if (command === 'connect') {
    if (mode === 'full') {
      return {
        mode,
        installSkills: false,
        skillSet: 'all',
        connectRepo: true,
        writeProfile: true,
        writeBridge: true,
        hooks: hookActions(['pre-commit', 'pre-push'], 'advisory'),
        deepScan: true,
        lineLimit: defaultLineLimit(),
      };
    }
    return {
      mode,
      installSkills: false,
      skillSet: 'core',
      connectRepo: true,
      writeProfile: true,
      writeBridge: true,
      hooks: hookActions(['pre-commit'], 'advisory'),
      deepScan: false,
      lineLimit: defaultLineLimit(),
    };
  }

  if (mode === 'minimal') {
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
  if (mode === 'full') {
    return {
      mode,
      installSkills: true,
      skillSet: 'all',
      connectRepo: true,
      writeProfile: true,
      writeBridge: true,
      hooks: hookActions(['pre-commit', 'pre-push'], 'advisory'),
      deepScan: true,
      lineLimit: defaultLineLimit(),
    };
  }
  return {
    mode,
    installSkills: true,
    skillSet: 'core',
    connectRepo: true,
    writeProfile: true,
    writeBridge: true,
    hooks: hookActions(['pre-commit'], 'advisory'),
    deepScan: false,
    lineLimit: defaultLineLimit(),
  };
}

function defaultLineLimit() {
  return { enabled: true, maxLines: DEFAULT_LINE_LIMIT, enforcement: 'advisory' };
}

function disabledLineLimit() {
  return { enabled: false, maxLines: DEFAULT_LINE_LIMIT, enforcement: 'off' };
}

function hookActions(targets, mode, failOn) {
  return targets.map((target) => ({
    target,
    mode,
    failOn: failOn || (mode === 'blocking' ? 'error' : 'none'),
  }));
}

function targetList(plan, fallback = ['pre-commit']) {
  const existing = [...new Set((plan.hooks || []).map((hook) => hook.target))];
  return existing.length ? existing : fallback;
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

function applyLineLimitToHooks(plan, options) {
  if (!plan.lineLimit?.enabled || plan.lineLimit.enforcement !== 'blocking') return;
  if (options.skipHooks) return;
  const targets = targetList(plan);
  plan.hooks = hookActions(targets, 'blocking', 'warning');
}

function applyLineLimitOptions(plan, options) {
  if (options.noLineLimit || options.lineLimitMode === 'off') {
    plan.lineLimit = { enabled: false, maxLines: options.lineLimit, enforcement: 'off' };
    plan.overrides?.push(options.noLineLimit ? '--no-line-limit' : '--line-limit-mode off');
    return;
  }
  if (!plan.lineLimit) plan.lineLimit = defaultLineLimit();
  if (options.explicitLineLimit) {
    plan.lineLimit.maxLines = options.lineLimit;
    plan.overrides?.push(`--line-limit ${options.lineLimit}`);
  }
  if (options.lineLimitMode) {
    plan.lineLimit.enforcement = options.lineLimitMode;
    plan.overrides?.push(`--line-limit-mode ${options.lineLimitMode}`);
  }
  if (options.explicitLineLimit || options.explicitLineLimitMode) applyLineLimitToHooks(plan, options);
}

function parseLineLimitAnswer(value) {
  const normalized = String(value).trim();
  if (!normalized) return DEFAULT_LINE_LIMIT;
  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed >= 50 && parsed <= 5000 ? parsed : null;
}

async function askLineLimitPolicy(plan, options) {
  if (!plan.connectRepo || !plan.writeProfile) return;
  applyLineLimitOptions(plan, options);
  if (options.yes || options.noLineLimit || options.explicitLineLimit || options.explicitLineLimitMode) return;
  const answer = await ask(`파일 길이 제한을 설정할까요?
큰 파일은 리뷰/수정/테스트 경계가 흐려지기 쉽습니다.

1) ${DEFAULT_LINE_LIMIT}줄 기준으로 경고만 표시
2) ${DEFAULT_LINE_LIMIT}줄 기준으로 커밋 차단
3) 사용하지 않기
4) 줄 수 직접 입력

선택 [Enter=1]: `);
  const choice = String(answer).trim();
  if (choice === '3') {
    plan.lineLimit = disabledLineLimit();
    return;
  }
  let enforcement = choice === '2' ? 'blocking' : 'advisory';
  let maxLines = DEFAULT_LINE_LIMIT;
  if (choice === '4') {
    const limitAnswer = await ask(`라인 수 제한 [Enter=${DEFAULT_LINE_LIMIT}]: `);
    const parsed = parseLineLimitAnswer(limitAnswer);
    if (parsed === null) {
      console.log(`${DEFAULT_LINE_LIMIT}~5000 사이 정수가 아니어서 기본값 ${DEFAULT_LINE_LIMIT}줄을 사용합니다.`);
    } else {
      maxLines = parsed;
    }
    const blockAnswer = await ask('이 제한을 넘으면 커밋을 막을까요? [y=막기 / Enter=경고만] ');
    if (String(blockAnswer).trim().toLowerCase() === 'y') enforcement = 'blocking';
  }
  plan.lineLimit = { enabled: true, maxLines, enforcement };
  applyLineLimitToHooks(plan, options);
}

export async function chooseMode(options) {
  if (options.mode) return options.mode;
  if (options.yes) return 'normal';
  while (true) {
    const answer = await ask(`설치 방식을 선택하세요.

1) Minimal - 가장 가볍게 설치합니다
2) Normal  - 추천 설정으로 설치합니다
3) Full    - 안전하게 가능한 모든 기능을 설치합니다
4) Custom  - 직접 선택합니다

선택 [Enter=Normal / q=취소]: `);
    const normalized = String(answer).trim().toLowerCase();
    if (!normalized) return 'normal';
    if (normalized === 'q' || normalized === 'quit' || normalized === 'n' || normalized === 'no') return 'cancel';
    const selected = MODE_ALIASES.get(normalized);
    if (selected) return selected;
    console.log('알 수 없는 선택입니다. 1, 2, 3, 4 또는 q를 입력하세요.');
  }
}

async function customInstallPlan(command) {
  const plan = {
    mode: 'custom',
    installSkills: command === 'install',
    skillSet: 'core',
    connectRepo: true,
    writeProfile: true,
    writeBridge: true,
    hooks: hookActions(['pre-commit'], 'advisory'),
    deepScan: false,
    lineLimit: defaultLineLimit(),
  };

  if (command === 'install') {
    const scope = await ask(`어디에 적용할까요?

1) 이 컴퓨터와 현재 프로젝트
2) 이 컴퓨터만
3) 현재 프로젝트만

선택 [Enter=1]: `);
    const normalizedScope = String(scope).trim();
    if (normalizedScope === '2') {
      plan.installSkills = true;
      plan.connectRepo = false;
      plan.writeProfile = false;
      plan.writeBridge = false;
      plan.hooks = [];
      plan.deepScan = false;
      plan.lineLimit = disabledLineLimit();
    } else if (normalizedScope === '3') {
      plan.installSkills = false;
      plan.connectRepo = true;
    }

    if (plan.installSkills) {
      const featureRange = await ask(`설치할 기능 범위를 선택하세요.

1) 기본 기능
2) 기본 기능 + 추가 기능 전체

선택 [Enter=1]: `);
      if (String(featureRange).trim() === '2') plan.skillSet = 'all';
    }
  } else {
    plan.installSkills = false;
    plan.connectRepo = true;
    const featureRange = await ask(`현재 프로젝트에서 사용할 기능 범위를 선택하세요.

1) 기본 기능
2) 기본 기능 + 추가 기능 전체

선택 [Enter=1]: `);
    if (String(featureRange).trim() === '2') plan.skillSet = 'all';
  }

  if (plan.connectRepo) {
    const guidance = await ask(`현재 프로젝트에 설정을 남길까요?

1) 설정 파일과 AI 안내문을 추가
2) 설정 파일만 추가
3) 아무것도 추가하지 않음

선택 [Enter=1]: `);
    if (String(guidance).trim() === '2') {
      plan.writeProfile = true;
      plan.writeBridge = false;
    } else if (String(guidance).trim() === '3') {
      plan.writeProfile = false;
      plan.writeBridge = false;
    }

    const checks = await ask(`커밋할 때 자동 검사를 실행할까요?

1) 알림만 보여주기
2) 실행하지 않기
3) 명확히 위험한 문제가 감지되면 커밋을 막기

선택 [Enter=1]: `);
    if (String(checks).trim() === '2') plan.hooks = [];
    if (String(checks).trim() === '3') plan.hooks = hookActions(['pre-commit'], 'blocking');

    const scan = await ask(`현재 프로젝트를 정밀 점검할까요?
몇 분 걸릴 수 있고, 코드는 수정하지 않습니다.

1) 나중에
2) 지금 실행

선택 [Enter=1]: `);
    if (String(scan).trim() === '2') plan.deepScan = true;
  }

  return plan;
}

async function askFullEnforcement(plan, options) {
  if (options.yes || options.explicitHooks || options.explicitHookTargets || options.skipHooks) return;
  if (plan.mode !== 'full' || !plan.connectRepo || plan.hooks.length === 0) return;
  const answer = await ask(`Full 모드는 기존 파일을 보존하면서 안전하게 가능한 모든 기능을 설치합니다.
자동 검사 결과를 어떻게 처리할까요?

1) 알림만 보여주기 - 문제를 보여주지만 커밋/푸시는 막지 않음
2) 커밋할 때 막기 - 명확한 오류가 있으면 커밋을 막음
3) 커밋과 푸시할 때 막기 - 더 엄격하게 막음

선택 [Enter=1]: `);
  const normalized = String(answer).trim();
  if (normalized === '2') {
    plan.hooks = [
      ...hookActions(['pre-commit'], 'blocking'),
      ...hookActions(['pre-push'], 'advisory'),
    ];
  } else if (normalized === '3') {
    plan.hooks = hookActions(['pre-commit', 'pre-push'], 'blocking');
  }
}

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

  plan.command = options.command;
  plan.force = options.force;
  plan.installMissing = options.installMissing;
  plan.overrides = overrides;
  plan.skillsDir = options.skillsDir;
  plan.repoStart = options.repoStart;
  plan.explicitRepo = options.explicitRepo;
  plan.yes = options.yes;

  const repoInfo = findGitRootInfo(options.repoStart);
  plan.repoInfo = repoInfo;
  plan.repoRoot = repoInfo.repoRoot;

  if (options.command === 'connect' && !repoInfo.isGitRepo) {
    return { errors: [`connect requires a git repository: ${options.repoStart}`] };
  }

  if (plan.connectRepo && !repoInfo.isGitRepo) {
    if (options.explicitRepo) {
      return { errors: [`--repo must point inside a git repository for ${plan.mode} mode: ${options.repoStart}`] };
    }
    plan.repoSkippedReason = '현재 프로젝트를 찾지 못해 프로젝트 연결을 건너뜀';
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
  await askFullEnforcement(plan, options);
  await askLineLimitPolicy(plan, options);

  plan.preflight = preflightPlan(plan);
  return { plan };
}

function describeSkillSet(skillSet) {
  if (skillSet === 'all') return '기본 기능 + 추가 기능 전체';
  if (skillSet === 'vendor') return '추가 기능만 (고급 옵션)';
  return '기본 기능';
}

function describeHookMode(mode) {
  return mode === 'blocking' ? '문제 발견 시 차단' : '알림만 보여주기';
}

export function printPlanSummary(plan) {
  console.log('\n설치 계획:');
  console.log(`- 명령: ${plan.command}`);
  console.log(`- 설치 방식: ${plan.mode}`);
  if (plan.overrides.length) console.log(`- 적용된 옵션 변경: ${plan.overrides.join(', ')}`);
  console.log(`- 기능 범위: ${describeSkillSet(plan.skillSet)}`);
  console.log(`- Skills directory: ${plan.skillsDir}`);
  if (plan.preflight.skills.enabled) {
    console.log(`- Skills: ${plan.preflight.skills.expected}개 설치/갱신 예정`);
  } else if (plan.command === 'connect') {
    if (plan.preflight.skills.action === 'install-missing') {
      console.log(`- Skills: 기존 설치 확인 후 누락분 설치 (${plan.preflight.skills.expected}개 필요, missing=${plan.preflight.skills.missing.length})`);
    } else {
      console.log(`- Skills: 기존 설치 사용 (${plan.preflight.skills.expected}개 필요, missing=${plan.preflight.skills.missing.length})`);
    }
  } else {
    console.log('- Skills: 설치하지 않음');
  }

  if (plan.connectRepo) {
    console.log(`- 현재 프로젝트: ${plan.repoRoot}`);
    console.log(`- 설정 파일: ${plan.preflight.profile.status}`);
    if (plan.writeBridge) {
      for (const bridge of plan.preflight.bridges) {
        console.log(`- AI 안내문: ${bridge.fileName} ${bridge.status}`);
      }
    } else {
      console.log('- AI 안내문: 추가하지 않음');
    }
  } else {
    console.log(`- 현재 프로젝트: ${plan.repoSkippedReason || '연결하지 않음'}`);
  }

  if (plan.writeProfile && plan.lineLimit) {
    if (plan.lineLimit.enabled) {
      const behavior = plan.lineLimit.enforcement === 'blocking' ? '커밋 차단' : '경고만 표시';
      console.log(`- 라인 수 제한: ${plan.lineLimit.maxLines}줄 초과 시 ${behavior}`);
    } else {
      console.log('- 라인 수 제한: 사용하지 않음');
    }
  }

  if (plan.hooks.length) {
    console.log('- 자동 검사:');
    for (const hook of plan.preflight.hooks) {
      const failOn = hook.failOn && hook.failOn !== 'none' ? `, fail-on=${hook.failOn}` : '';
      console.log(`  - ${hook.target}: ${describeHookMode(hook.mode)}${failOn} (${hook.status})`);
    }
  } else {
    console.log('- 자동 검사: 설치하지 않음');
  }

  if (plan.preflight.deepScan.enabled) {
    console.log('- 정밀 점검: 지금 실행 (몇 분 걸릴 수 있음, source code 수정 없음)');
    console.log(`  - 결과: ${relativeDisplay(plan.repoRoot, plan.preflight.deepScan.report)}`);
    console.log(`  - 추천 설정: ${relativeDisplay(plan.repoRoot, plan.preflight.deepScan.recommendedProfile)}`);
  } else {
    console.log('- 정밀 점검: 실행하지 않음');
  }
  console.log('- 건드리지 않음: CI, package.json, lockfile, source code, non-managed hook');
  if (plan.force) {
    console.log('- 주의: --force는 jhste managed 출력물만 갱신하며 사용자 소유 hook/source/CI는 덮어쓰지 않음');
  }
}

export async function confirmPlan(plan) {
  if (plan.yes) {
    console.log('\n--yes가 지정되어 확인 없이 진행합니다.');
    return 'yes';
  }
  const answer = await ask('\n진행할까요? [Enter=진행 / c=Custom으로 수정 / q=취소] ');
  const normalized = String(answer).trim().toLowerCase();
  if (normalized === 'q' || normalized === 'n' || normalized === 'no') return 'cancel';
  if (normalized === 'c') return 'custom';
  return 'yes';
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
  const answer = await ask(`\n필요한 skills ${missing.length}개가 없습니다. 지금 추가 설치할까요? [y=설치 / Enter=취소] `);
  if (String(answer).trim().toLowerCase() === 'y') {
    plan.installMissing = true;
    plan.preflight.skills.action = 'install-missing';
    return { ok: true };
  }
  return {
    ok: false,
    errors: [
      `connect requires ${plan.skillSet} skills but ${missing.length} are missing.`,
      '먼저 `jhste-skills install`을 실행하거나 `--install-missing`을 사용하세요.',
    ],
  };
}

export function printConfigErrors(command, errors) {
  for (const error of errors) console.error(`jhste-skills ${command}: ${error}`);
  process.exitCode = EXIT_CONFIG_FAILURE;
}
