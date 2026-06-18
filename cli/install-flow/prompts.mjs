import { ask } from '../shared.mjs';
import { DEFAULT_LINE_LIMIT, MODE_ALIASES } from './options.mjs';
import {
  applyLineLimitToHooks,
  defaultLineLimit,
  disabledLineLimit,
  hookActions,
} from './plan-helpers.mjs';

function parseLineLimitAnswer(value) {
  const normalized = String(value).trim();
  if (!normalized) return DEFAULT_LINE_LIMIT;
  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed >= 50 && parsed <= 5000 ? parsed : null;
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

export async function askLineLimitPolicy(plan, options) {
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

export async function customInstallPlan(command) {
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
  await askCustomScope(plan, command);
  if (plan.connectRepo) await askCustomProjectSettings(plan);
  return plan;
}

async function askCustomScope(plan, command) {
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
    return;
  }

  plan.installSkills = false;
  plan.connectRepo = true;
  const featureRange = await ask(`현재 프로젝트에서 사용할 기능 범위를 선택하세요.

1) 기본 기능
2) 기본 기능 + 추가 기능 전체

선택 [Enter=1]: `);
  if (String(featureRange).trim() === '2') plan.skillSet = 'all';
}

async function askCustomProjectSettings(plan) {
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

export async function askFullEnforcement(plan, options) {
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
