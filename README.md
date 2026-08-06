# jhste-skills

한국어 | [ENG](README.en.md)

모델과 실행 도구에 종속되지 않도록 설계한 개인용 엔지니어링 스킬 모음입니다. 스킬은 어떤 모델이나 reasoning 수준을 사용할지 정하지 않습니다. 사용자가 선택한 하네스 설정을 존중하면서, 필요한 일을 올바르게 나누고 불필요한 질문 없이 결과까지 진행하는 데 집중합니다.

## 무엇을 만들지 정하기

- **[`jhste-grill`](skills/jhste-grill/SKILL.md)** — 지금 답할 수 있는 중요한 결정을 한 번에 묻고, 확정된 용어와 ADR을 진행 중에 바로 기록합니다.
- **[`jhste-domain-modeling`](skills/jhste-domain-modeling/SKILL.md)** — 프로젝트 고유 용어, 개념 경계, 관계를 명확히 하고 해당 glossary와 필요한 ADR을 갱신합니다.
- **[`jhste-to-spec`](skills/jhste-to-spec/SKILL.md)** — 이미 논의되거나 정의된 변경을 추가 인터뷰 없이 검토 가능한 행동 명세로 정리합니다.

## 직접 만들고 고치기

- **[`jhste-prototype`](skills/jhste-prototype/SKILL.md)** — production 구현 전에 하나의 중요한 설계 질문을 가장 작은 실행 가능한 실험으로 검증합니다.
- **[`jhste-coding`](skills/jhste-coding/SKILL.md)** — 충분히 이해된 기능, 버그 수정, 리팩터링과 handoff의 정확한 재개 지점부터 이어지는 구현을 작은 변경과 관련 검증으로 수행합니다.
- **[`jhste-diagnosing-bugs`](skills/jhste-diagnosing-bugs/SKILL.md)** — 원인이나 올바른 수정이 불확실한 장애와 성능 저하를 재현 신호, 가설, runtime 증거, 측정으로 진단합니다.

## 일을 나누고 이어가기

- **[`jhste-subagent-orchestration`](skills/jhste-subagent-orchestration/SKILL.md)** — 실제 워커 기능이 있고 위임이 유리할 때, 결정권을 가진 헤드 아래 조사·구현·독립 검토 작업을 필요한 만큼만 조정합니다.
- **[`jhste-to-tickets`](skills/jhste-to-tickets/SKILL.md)** — 정의된 작업을 가장 작은 유용한 GitHub issue 또는 실제 dependency가 있는 issue graph로 나눕니다.
- **[`jhste-handoff`](skills/jhste-handoff/SKILL.md)** — 다른 세션·에이전트·하네스로 넘기는 단일 portable handoff 또는 장기간 유지할 durable handoff를 만듭니다.

## 검토하고 마무리하기

- **[`jhste-implementation-finalizer`](skills/jhste-implementation-finalizer/SKILL.md)** — 완료 주장이나 제출된 구현을 독립적으로 감사·검증하고 부족한 부분을 직접 고쳐 최종 완료합니다.
- **[`jhste-pr-review`](skills/jhste-pr-review/SKILL.md)** — 명시적으로 요청된 PR을 실제 diff 기준으로 검토하고 신뢰도 높은 실행 가능한 지적만 게시합니다.
- **[`jhste-review-followup`](skills/jhste-review-followup/SKILL.md)** — 기존 PR 피드백을 검증하고 정당한 수정만 기존 PR 브랜치에 반영합니다.

## 핵심 원칙

- 저장소, 문서, 도구에서 찾을 수 있는 사실은 사용자에게 묻지 않고 직접 조사합니다.
- 사용자는 제품 정책, 호환성, 보안·데이터 정책, 외부 쓰기처럼 사용자만 결정하거나 허가할 수 있는 문제에만 개입합니다. 서로 독립적인 질문은 한 번에 묶습니다.
- 모델, provider, reasoning 또는 effort, worker 수, 동시성, 실제 격리는 사용자와 하네스가 관리합니다. 스킬은 이를 선택하거나 덮어쓰지 않습니다.
- 서브에이전트는 반복 읽기와 조정 비용보다 분리 이익이 클 때만 사용합니다. 같은 범위의 보충 증거나 작은 수정은 기존 워커를 재사용할 수 있고, 독립 판단이 필요할 때만 새 워커를 사용합니다.
- 테스트를 의식적으로 늘리지 않습니다. 변경이나 진단 결과를 판별하는 가장 좁고 정직한 검증을 수행하며, 모든 작업에 TDD를 강제하지 않습니다.
- `jhste-grill`과 `jhste-domain-modeling` 요청은 확정된 local glossary와 qualifying ADR 갱신을 포함합니다. commit, push, issue, PR, release 같은 외부 쓰기는 요청에 명시된 범위에서만 수행합니다.

## 주요 경계

구현 방향이 충분히 명확하면 `jhste-coding`, 아직 만들지 않은 설계 질문을 실행 증거로 판단해야 하면 `jhste-prototype`, 이미 존재하는 실패의 원인이 불명확하면 `jhste-diagnosing-bugs`가 담당합니다. 사용자 소유 결정은 `jhste-grill`, 용어와 개념 모델 자체의 변경은 `jhste-domain-modeling`이 담당합니다.

`jhste-subagent-orchestration`은 다른 스킬의 계약을 복제하지 않고 작업을 bounded assignment로 조합합니다. 단일 선형 작업을 억지로 여러 단계로 나누지 않으며, 구현 완료만을 이유로 별도 acceptance 워커를 추가하지 않습니다.

`jhste-to-spec`은 요구사항 계약, `jhste-to-tickets`는 실행 issue graph, `jhste-handoff`는 다른 실행자가 이어갈 현재 상태를 기록합니다. 서로의 내용을 중복 저장하지 않고 authoritative artifact를 참조합니다.

이 패키지는 의무적인 TDD workflow, Wayfinder, 별도 architecture-audit 스킬을 포함하지 않습니다.

## npm에서 사용자 전역 설치

이 패키지는 CLI를 제공하지 않습니다. 열두 개 스킬과 Codex용 metadata를 함께 배포합니다.

```sh
npm install -g jhste-skills
mkdir -p "$HOME/.agents/skills"
cp -R "$(npm root -g)/jhste-skills/skills/." "$HOME/.agents/skills/"
```

npm 패키지를 업데이트한 뒤 copy 명령을 다시 실행하세요. 사용하는 에이전트가 다른 전역 skills 디렉터리를 기대한다면 `skills/` 아래 열두 개 디렉터리를 그 위치에 복사하세요.

## 저장소에서 사용자 전역 설치

```sh
mkdir -p "$HOME/.agents/skills"
cp -R skills/. "$HOME/.agents/skills/"
```

## 개발 및 검증

```sh
npm test
npm pack --dry-run
```

`npm test`는 패키지, metadata, 문서 일관성과 정적 라우팅 계약 90개를 검사합니다. 이 fixture는 모델을 실제 호출하거나 자동 trigger 정확도를 측정하지 않습니다.

외부 출처와 라이선스 표기는 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)에 기록합니다. 새 package version을 포함한 변경이 `main`에 병합되거나 `v*.*.*` release tag가 push되면 GitHub Actions 검증 후 아직 게시되지 않은 버전을 npm trusted publishing으로 배포합니다.
