# jhste-skills

한국어 | [ENG](README.en.md)

모델과 실행 도구에 종속되지 않도록 설계한 개인용 엔지니어링 스킬 모음입니다. 스킬은 모델이나 reasoning 수준을 정하지 않습니다. 사용자가 선택한 하네스 설정을 존중하면서, 필요한 일을 올바르게 나누고 불필요한 질문 없이 검증 가능한 결과까지 진행합니다.

기본 `SKILL.md`에는 작업 계약과 중요한 경계만 두고, 드물게 필요한 형식·복구·변형 절차는 `references/`에서 필요할 때만 읽습니다.

## 무엇을 만들지 정하기

- **[`jhste-grill`](skills/jhste-grill/SKILL.md)** — 지금 답할 수 있는 중요한 결정을 한 번에 묻고, 확정된 용어와 ADR을 진행 중에 바로 기록합니다.
- **[`jhste-to-questionnaire`](skills/jhste-to-questionnaire/SKILL.md)** — 현재 사용자가 답할 수 없는 사실이나 결정을 실제 지식 소유자에게 받을 수 있도록 최소한의 질문지로 정리합니다.
- **[`jhste-domain-modeling`](skills/jhste-domain-modeling/SKILL.md)** — 프로젝트 고유 용어, 개념 경계, 관계를 명확히 하고 해당 glossary와 필요한 ADR을 갱신합니다.
- **[`jhste-to-spec`](skills/jhste-to-spec/SKILL.md)** — 이미 논의되거나 정의된 변경을 추가 인터뷰 없이 검토 가능한 행동 명세로 정리합니다.

## 직접 만들고 고치기

- **[`jhste-prototype`](skills/jhste-prototype/SKILL.md)** — production 구현 전에 하나의 설계 질문을 가장 작은 실행 가능한 실험으로 검증하고, 필요한 logic 또는 UI 지침만 추가로 읽습니다.
- **[`jhste-coding`](skills/jhste-coding/SKILL.md)** — 충분히 이해된 기능, 알려진 수정, 리팩터링, 정확한 재개 지점, 진행 중인 merge/rebase conflict를 저장소 계약에 맞게 처리합니다.
- **[`jhste-diagnosing-bugs`](skills/jhste-diagnosing-bugs/SKILL.md)** — 원인이 불명확한 장애와 성능 저하를 증상별 신호, 경쟁 설명, runtime 증거, 측정으로 진단하며 노출되는 진단 자료의 secret을 가립니다.

## 일을 나누고 이어가기

- **[`jhste-subagent-orchestration`](skills/jhste-subagent-orchestration/SKILL.md)** — 직접 수행, 단일 소유, 병렬 소유, 동적 wave 가운데 작업에 맞는 가장 가벼운 구조로 워커를 조정합니다.
- **[`jhste-to-tickets`](skills/jhste-to-tickets/SKILL.md)** — 정의된 작업을 하나의 유용한 GitHub issue 또는 실제 dependency가 있는 issue graph로 나눕니다.
- **[`jhste-handoff`](skills/jhste-handoff/SKILL.md)** — 다른 실행자로 넘기는 portable handoff 또는 여러 소유자가 유지하는 durable handoff를 만듭니다.

## 검토하고 마무리하기

- **[`jhste-implementation-finalizer`](skills/jhste-implementation-finalizer/SKILL.md)** — 완료 주장을 요구사항·diff·실제 증거와 대조하고, 범위 내 누락을 고쳐 최종 상태를 검증합니다.
- **[`jhste-pr-review`](skills/jhste-pr-review/SKILL.md)** — PR에서 결함 후보를 넓게 찾은 뒤 실제 근거가 있는 중요한 지적만 게시합니다.
- **[`jhste-review-followup`](skills/jhste-review-followup/SKILL.md)** — 기존 PR 피드백을 검증하고 정당한 수정만 기존 PR 브랜치에 반영합니다.

## 핵심 원칙

- 저장소, 문서, 도구에서 찾을 수 있는 사실은 사용자나 외부 이해관계자에게 묻지 않고 직접 조사합니다.
- 사용자는 제품 정책, 호환성, 보안·데이터 정책, 외부 쓰기처럼 사용자만 결정하거나 허가할 수 있는 문제에만 개입합니다. 서로 독립적인 질문은 한 번에 묶습니다.
- 필요한 지식이나 결정이 현재 사용자가 아니라 고객, 보안·법무·컴플라이언스, 운영 담당자 등 다른 사람에게 있으면 `jhste-to-questionnaire`로 실제 소유자에게 받을 질문만 정리합니다.
- 모델, provider, reasoning 또는 effort, worker 수, 동시성, scheduling, 실제 격리는 사용자와 하네스가 관리합니다. 스킬은 이를 선택하거나 덮어쓰지 않습니다.
- 서브에이전트는 반복 읽기와 조정 비용보다 분리 이익이 클 때만 사용합니다. 독립 판단이 필요하지 않은 보충 증거나 작은 수정에는 기존 워커를 재사용할 수 있습니다.
- 테스트 수를 늘리는 대신 요청 결과를 실패와 가장 직접적으로 구분하는 저장소 고유 신호를 선택합니다. 위험이나 통합 범위가 요구할 때만 검증을 확장합니다.
- `jhste-grill`과 `jhste-domain-modeling` 요청은 확정된 local glossary와 qualifying ADR 갱신을 포함합니다. commit, push, issue, PR, release 같은 외부 쓰기는 요청 범위에서만 수행합니다.

## 주요 경계

구현 방향이 명확하면 `jhste-coding`, 아직 만들지 않은 설계 질문을 실행 증거로 판단해야 하면 `jhste-prototype`, 이미 존재하는 실패의 원인이 불명확하면 `jhste-diagnosing-bugs`가 담당합니다. 사용자 소유 결정은 `jhste-grill`, 현재 사용자가 답할 수 없고 다른 지식 소유자에게 받아와야 하는 사실·결정은 `jhste-to-questionnaire`, 용어와 개념 모델 자체의 변경은 `jhste-domain-modeling`이 담당합니다.

`jhste-subagent-orchestration`은 다른 스킬의 계약을 복제하지 않고 bounded outcome으로 조합합니다. 단일 선형 작업을 억지로 여러 단계로 나누지 않으며, 구현 완료만을 이유로 별도 acceptance 워커를 추가하지 않습니다.

`jhste-to-spec`은 요구사항 계약, `jhste-to-tickets`는 실행 issue 경계와 dependency, `jhste-handoff`는 다음 실행자가 이어갈 현재 상태를 기록합니다. 서로의 내용을 중복 저장하지 않고 authoritative artifact를 참조합니다.

이 패키지는 의무적인 TDD workflow, Wayfinder, 별도 architecture-audit 스킬을 포함하지 않습니다.

## npm에서 사용자 전역 설치

이 패키지는 CLI를 제공하지 않습니다. 열세 개 스킬과 Codex용 metadata를 함께 배포합니다.

```sh
npm install -g jhste-skills
mkdir -p "$HOME/.agents/skills"
cp -R "$(npm root -g)/jhste-skills/skills/." "$HOME/.agents/skills/"
```

npm 패키지를 업데이트한 뒤 copy 명령을 다시 실행하세요. 사용하는 에이전트가 다른 전역 skills 디렉터리를 기대한다면 `skills/` 아래 열세 개 디렉터리를 그 위치에 복사하세요.

## 저장소에서 사용자 전역 설치

```sh
mkdir -p "$HOME/.agents/skills"
cp -R skills/. "$HOME/.agents/skills/"
```

## 유지보수

[MAINTENANCE.md](MAINTENANCE.md)는 새 모델·하네스 세대에서 먼저 지워 보고, 실제 반복 실패가 확인될 때만 최소 지시를 복구하는 원칙을 설명합니다. 안전·권한·소유권·산출물 인터페이스·완료 조건은 유지하고, 저장소에서 쉽게 다시 찾을 수 있는 사실을 문서에 중복 저장하지 않으며, 실제 행동을 바꾸지 않는 지시는 제거합니다.

## 개발 및 검증

```sh
npm test
npm pack --dry-run
```

`npm test`는 패키지, metadata, 문서·reference 링크 일관성과 정적 라우팅 계약 100개를 검사합니다. 이 fixture는 모델을 실제 호출하거나 자동 trigger 정확도를 측정하지 않습니다.

외부 출처와 라이선스 표기는 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)에 기록합니다. 새 package version을 포함한 변경이 `main`에 병합되거나 `v*.*.*` release tag가 push되면 GitHub Actions 검증 후 아직 게시되지 않은 버전을 npm trusted publishing으로 배포합니다.
