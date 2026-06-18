import { nowIso } from '../shared.mjs';
import { FINDING_METADATA } from './registry.mjs';

export const EXIT_VIOLATION = 1;
export const EXIT_GUARD_FAILURE = 2;
export const SEVERITIES = ['info', 'warning', 'error'];

export function summarize(violations, failures = []) {
  const active = violations.filter((item) => item.baseline_status !== 'matched');
  const summary = { error: 0, warning: 0, info: 0, suppressed: violations.length - active.length, failures: failures.length };
  for (const item of active) summary[item.severity] = (summary[item.severity] || 0) + 1;
  return summary;
}

export function guardResult(violations, failures = [], meta = {}) {
  return {
    schema_version: 1,
    generated_at: nowIso(),
    summary: summarize(violations, failures),
    meta,
    violations,
    failures,
  };
}

export function severityMeets(severity, threshold) {
  if (threshold === 'none') return false;
  const severityIndex = SEVERITIES.indexOf(severity);
  const thresholdIndex = SEVERITIES.indexOf(threshold);
  return severityIndex >= thresholdIndex;
}

export function exitCodeFor(result, failOn, baselineMode) {
  if (result.failures.length > 0) return EXIT_GUARD_FAILURE;
  if (baselineMode === 'update') return 0;
  const active = result.violations.filter((item) => item.baseline_status !== 'matched');
  if (baselineMode === 'ratchet' && active.length > 0) return EXIT_VIOLATION;
  if (active.some((item) => severityMeets(item.severity, failOn))) return EXIT_VIOLATION;
  return 0;
}

function guidanceForFinding(item) {
  const family = item.rule_family || FINDING_METADATA[item.rule_id]?.family || item.rule_id;
  if (family === 'file_size_advisory') {
    return {
      means: '파일이 설정된 줄 수 기준을 넘었습니다. 버그 증명은 아니지만 리뷰, 충돌 해결, 테스트 경계가 어려워질 가능성이 큽니다.',
      next: '한 번에 한 책임만 남기도록 helper/adapter/scanner family/test fixture 등 자연스러운 경계로 분리하세요.',
    };
  }
  if (family === 'responsibility_budget') {
    return {
      means: '한 파일이 화면, 상태, IO, 검증, 저장, 응답 포맷 같은 여러 책임을 함께 가질 가능성이 있습니다.',
      next: 'loader/service/repository/view처럼 책임 이름이 분명한 작은 모듈로 이동할 수 있는지 확인하세요.',
    };
  }
  if (family === 'external_input_validation') {
    return {
      means: '파일, 요청 body, 외부 API, env 같은 외부 입력을 shape 검증 없이 신뢰하는 후보입니다.',
      next: 'schema.safeParse, validator, assert/parseEnv 같은 검증 경계를 추가하거나 이미 검증된 경로라면 코드에 명확히 드러내세요.',
    };
  }
  if (family === 'no_secret_logging') {
    return {
      means: '로그에 token/password/session 같은 민감 키워드가 포함될 수 있는 후보입니다.',
      next: '실제 비밀 값이 출력되지 않는지 확인하고, 필요하면 값은 redaction 후 로깅하세요.',
    };
  }
  if (family === 'build_runtime_env_safety') {
    return {
      means: '환경 변수를 직접 읽어 런타임/빌드 환경 차이에서 undefined나 잘못된 설정이 발생할 수 있습니다.',
      next: '시작 시점 env schema 검증, 기본값, requiredEnv helper를 통해 실패 위치를 명확히 하세요.',
    };
  }
  if (family === 'write_safety_idempotency') {
    return {
      means: '쓰기 작업이 반복/재시도될 때 중복 기록이나 부분 성공을 만들 수 있는 후보입니다.',
      next: 'transaction, upsert, idempotency key, dedupe, batch 처리 중 어떤 안전장치가 맞는지 확인하세요.',
    };
  }
  if (family === 'api_contract_compatibility') {
    return {
      means: 'API 경계에서 요청/응답 shape가 명확하지 않거나 저장소 모양이 그대로 노출될 수 있습니다.',
      next: '입력 schema와 public DTO mapping을 추가해 caller가 의존할 계약을 고정하세요.',
    };
  }
  if (family === 'authz_data_isolation') {
    return {
      means: '인증/권한/tenant-owner scope가 코드상 분명하지 않아 다른 사용자 데이터 접근 위험 후보입니다.',
      next: 'requireUser/permission 확인과 userId/orgId/tenantId 같은 소유자 필터가 같은 흐름에 보이도록 하세요.',
    };
  }
  if (family === 'performance_duplicate_fetch') {
    return {
      means: '같은 경로에서 중복 fetch/cache 미사용으로 느린 렌더링이나 불필요한 네트워크 호출이 생길 수 있습니다.',
      next: '공유 loader/query hook/cache key로 합칠 수 있는지 확인하세요.',
    };
  }
  if (item.confidence === 'low') {
    return {
      means: '낮은 신뢰도의 정적 휴리스틱 후보입니다. 실제 버그라는 뜻은 아닙니다.',
      next: '문제가 아니면 검증/안전장치가 코드에 더 잘 보이게 하거나, 실제 위험이면 작은 수정으로 경계를 추가하세요.',
    };
  }
  return null;
}

export function printResult(result, format) {
  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  const { summary } = result;
  console.log(`jhste guard: errors=${summary.error} warnings=${summary.warning} info=${summary.info} suppressed=${summary.suppressed} failures=${summary.failures}`);
  if (result.failures.length) {
    console.log('\nGuard failures:');
    for (const failure of result.failures) console.log(`- [${failure.code}] ${failure.message}${failure.details?.length ? ` (${failure.details.join('; ')})` : ''}`);
  }
  const active = result.violations.filter((item) => item.baseline_status !== 'matched');
  const visible = active.slice(0, 80);
  if (visible.length) {
    console.log('\nViolations:');
    for (const item of visible) {
      const confidence = item.confidence ? ` [${item.confidence}-confidence]` : '';
      const family = item.rule_family && item.rule_family !== item.rule_id ? ` (${item.rule_family})` : '';
      const related = item.related_key ? ` [related: ${item.related_key}]` : '';
      console.log(`- [${item.severity}]${confidence} ${item.rule_id}${family} ${item.path}:${item.line}${related} — ${item.message}`);
      const guidance = guidanceForFinding(item);
      if (guidance) {
        console.log(`  의미: ${guidance.means}`);
        console.log(`  대처: ${guidance.next}`);
      }
    }
    if (active.length > visible.length) console.log(`- ... ${active.length - visible.length} more omitted from text output`);
  }
  const matched = result.violations.filter((item) => item.baseline_status === 'matched');
  if (matched.length) {
    console.log('\nExisting baseline issues encountered (remediation queue; not a pass):');
    for (const item of matched.slice(0, 40)) {
      const family = item.rule_family && item.rule_family !== item.rule_id ? ` (${item.rule_family})` : '';
      const reason = item.baseline_reason ? ` — ${item.baseline_reason}` : '';
      console.log(`- [${item.severity}] ${item.rule_id}${family} ${item.path}:${item.line}${reason}`);
    }
    if (matched.length > 40) console.log(`- ... ${matched.length - 40} more baseline issues encountered in this scan scope`);
  }
}
