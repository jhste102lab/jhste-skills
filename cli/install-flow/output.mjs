import { ask, relativeDisplay } from '../shared.mjs';
import { EXIT_CONFIG_FAILURE } from './options.mjs';

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

  printLineLimitSummary(plan);
  printHookSummary(plan);
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

function printLineLimitSummary(plan) {
  if (!plan.writeProfile || !plan.lineLimit) return;
  if (plan.lineLimit.enabled) {
    const behavior = plan.lineLimit.enforcement === 'blocking' ? '커밋 차단' : '경고만 표시';
    console.log(`- 라인 수 제한: ${plan.lineLimit.maxLines}줄 초과 시 ${behavior}`);
  } else {
    console.log('- 라인 수 제한: 사용하지 않음');
  }
}

function printHookSummary(plan) {
  if (plan.hooks.length) {
    console.log('- 자동 검사:');
    for (const hook of plan.preflight.hooks) {
      const failOn = hook.failOn && hook.failOn !== 'none' ? `, fail-on=${hook.failOn}` : '';
      console.log(`  - ${hook.target}: ${describeHookMode(hook.mode)}${failOn} (${hook.status})`);
    }
  } else {
    console.log('- 자동 검사: 설치하지 않음');
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

export function printConfigErrors(command, errors) {
  for (const error of errors) console.error(`jhste-skills ${command}: ${error}`);
  process.exitCode = EXIT_CONFIG_FAILURE;
}
