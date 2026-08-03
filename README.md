# jhste-skills

한국어 | [ENG](README.en.md)

GPT-5.6의 outcome-first, lean-prompt 지침에 맞춰 관리하는 개인용 엔지니어링 스킬 모음입니다. 각 스킬은 독립적으로 동작하며, 사용자 의도가 좁은 trigger와 맞으면 자동 선택될 수 있습니다.

## 스킬

- **[`jhste-coding`](skills/jhste-coding/SKILL.md)** — 충분히 이해된 기능, 버그 수정, 리팩터링과 handoff의 정확한 재개 지점부터 이어지는 일반 구현을 작은 변경과 관련 검증으로 수행합니다.
- **[`jhste-prototype`](skills/jhste-prototype/SKILL.md)** — production 구현 전에 하나의 중요한 설계 질문을 가장 작은 폐기 가능한 실행 증거로 검증합니다.
- **[`jhste-subagent-orchestration`](skills/jhste-subagent-orchestration/SKILL.md)** — 명시적 서브에이전트 요청이나 구조적 이익이 분명한 작업에서, 결정권을 가진 헤드 아래 bounded investigation, implementation, acceptance 워커를 조정합니다.
- **[`jhste-diagnosing-bugs`](skills/jhste-diagnosing-bugs/SKILL.md)** — 원인이나 올바른 수정이 불확실한 어려운 버그와 성능 저하를 재현, 가설, 측정으로 진단합니다.
- **[`jhste-grill`](skills/jhste-grill/SKILL.md)** — 중요한 결정 분기를 한 번에 한 질문씩 해소하면서 확정된 도메인 문맥과 ADR을 계속 갱신합니다.
- **[`jhste-domain-modeling`](skills/jhste-domain-modeling/SKILL.md)** — 도메인 용어, 경계, 관계를 명확히 하고 확정된 glossary 항목과 필요한 ADR을 바로 기록합니다.
- **[`jhste-to-spec`](skills/jhste-to-spec/SKILL.md)** — 이미 논의되거나 정의된 변경을 저장소 근거에 맞춘 검토 가능한 엔지니어링 명세로 정리합니다.
- **[`jhste-to-tickets`](skills/jhste-to-tickets/SKILL.md)** — 정의된 작업을 GitHub parent/sub-issue와 native dependency로 나눕니다.
- **[`jhste-handoff`](skills/jhste-handoff/SKILL.md)** — 특정 실행 도구와 무관하게 소유권, 단계 진행, 검증, blocker, 정확한 재개 지점을 보존하는 구현 handoff를 만들거나 갱신합니다.
- **[`jhste-implementation-finalizer`](skills/jhste-implementation-finalizer/SKILL.md)** — 완료 주장이나 제출된 구현을 독립적으로 감사·검증하고 부족한 부분을 직접 고쳐 최종 완료하며, 이미 승인된 동일 PR 업데이트까지 수행합니다.
- **[`jhste-pr-review`](skills/jhste-pr-review/SKILL.md)** — 명시적으로 요청된 PR을 실제 diff 기준으로 검토하고 신뢰도 높은 실행 가능한 지적만 게시합니다.
- **[`jhste-review-followup`](skills/jhste-review-followup/SKILL.md)** — 기존 PR 피드백을 검증하고 정당한 수정만 기존 PR 브랜치에 반영합니다.

대부분의 스킬은 서로를 의무적으로 호출하지 않습니다. `jhste-subagent-orchestration`은 실제 워커 실행 수단이 있고 명시적 위임 요청이나 구체적인 구조적 이익이 있을 때 기존 task skill을 bounded assignment에 조합하지만, 그 스킬의 계약을 복제하거나 권한을 확장하지 않습니다. 구현 경로가 충분히 명확하면 `jhste-coding`, 무엇을 만들지에 대한 중요한 설계 불확실성이 실행 가능한 증거를 필요로 할 때만 `jhste-prototype`, 이미 존재하는 동작의 원인이 불명확하면 `jhste-diagnosing-bugs`, 사용자 소유 정책 결정이 남아 있으면 `jhste-grill`이 담당합니다. 프로토타입에서 방향이 선택되면 `jhste-coding`으로 production 구현하고, 명세가 필요할 때만 `jhste-to-spec`으로 기록합니다.

## 동작 경계

- `jhste-coding`은 구현 경로가 충분히 명확한 코드 변경과 기존 handoff 또는 부분 구현의 일반적인 이어서 하기를 담당합니다. production 전 실행 실험으로 중요한 설계 가정을 검증하는 작업은 `jhste-prototype`에 속합니다.
- `jhste-prototype`은 state model, business rule, data shape, API surface, interaction flow, UI structure에 관한 하나의 구체적 질문을 폐기 가능한 실행 증거로 답합니다. 일반 구현, 기존 장애 원인 진단, 정적 mockup, 열린 아이디어 탐색, production-ready 전달을 가로채지 않습니다.
- `jhste-subagent-orchestration`은 서브에이전트, 위임, multi-worker 실행, 별도-agent acceptance가 명시적으로 요청되면 선택됩니다. 암묵적으로는 assignment가 decision-complete하고 독립 검증 가능하며, 중요한 판단이 헤드에 남는 경우에만 사용합니다. 일반적인 선형 코딩·진단·프로토타이핑·handoff 작성·finalization·PR review 또는 Kubernetes 같은 도메인 의미의 orchestration은 가로채지 않습니다. 워커 수와 실제 권한·격리는 하네스가 관리합니다.
- `jhste-diagnosing-bugs`는 이미 관찰된 실패에 재현 신호, 경쟁 가설, 계측, 측정이 필요할 때 담당합니다. 아직 만들지 않은 설계를 시험하는 작업은 `jhste-prototype`입니다.
- `jhste-grill`은 사용자가 인터뷰나 의사결정 검증을 원할 때만 동작합니다. 사용자 소유 결정이 먼저 필요하면 프로토타입으로 추측하지 않고 인터뷰하며, 결정된 가정의 representability나 ergonomics가 실행 증거를 필요로 하면 `jhste-prototype`으로 넘깁니다.
- `jhste-domain-modeling`은 도메인 언어와 개념 경계를 담당하며, 단순 변수명 변경이나 일반적인 아키텍처 설명을 가로채지 않습니다.
- `jhste-to-spec`은 확정된 동작, 계약, 검증, 범위를 정의합니다. 해결되지 않은 설계 가정을 실행해 보는 대신 명세에 추측을 고정하지 않습니다.
- `jhste-to-tickets`는 GitHub issue graph를 초안 작성하거나 게시합니다. 로컬 handoff 상태를 여러 issue 본문에 중복하지 않습니다.
- `jhste-handoff`는 handoff 문서를 새로 만들거나 갱신하고, 재개 가능한 단계로 나누는 명시적 요청에서만 동작합니다. 기존 handoff를 읽고 구현을 계속하는 작업 자체는 담당하지 않습니다.
- `jhste-implementation-finalizer`는 완료 주장, 독립 검증, 최종 감사·수정 의도가 명시된 production 구현을 담당합니다. 폐기 가능한 프로토타입을 production 코드로 승격하거나 읽기 전용 acceptance를 수행하는 수단이 아니며, 선택된 방향은 `jhste-coding`으로 다시 구현합니다.
- `jhste-pr-review`는 검토 전용 요청에만 적용되며 브랜치를 수정하지 않습니다.
- `jhste-review-followup`은 이미 존재하는 PR 피드백이 범위를 정의할 때만 적용됩니다. 일반적인 작업자 결과 마무리 용도가 아닙니다.

이 패키지는 의무적인 TDD workflow, Wayfinder, 별도 architecture-audit 스킬을 포함하지 않습니다. 오케스트레이션은 실제 워커 조정에만 좁게 적용되며 일반적인 단일-agent delivery workflow를 대체하지 않습니다.

## npm에서 사용자 전역 설치

이 패키지는 CLI를 제공하지 않습니다. 열두 개 스킬과 Codex metadata를 배포합니다.

```sh
npm install -g jhste-skills
mkdir -p "$HOME/.agents/skills"
cp -R "$(npm root -g)/jhste-skills/skills/." "$HOME/.agents/skills/"
```

npm 패키지를 업데이트한 뒤 copy 명령을 다시 실행하세요. 갱신된 스킬이 보이지 않으면 Codex를 재시작하세요.

## 저장소에서 사용자 전역 설치

```sh
mkdir -p "$HOME/.agents/skills"
cp -R skills/. "$HOME/.agents/skills/"
```

다른 agent가 다른 전역 skills 디렉터리를 사용하면 `skills/` 아래 열두 개 디렉터리를 그 위치에 복사하세요. 프로젝트별 복사본은 필수가 아닙니다.

## 개발 및 검증

```sh
npm test
npm pack --dry-run
```

`npm test`는 패키지, metadata, 문서 일관성과 열 개 스킬을 다루는 정적 라우팅 시나리오 88개를 검사합니다. 이 fixture는 모델을 실제 호출하거나 자동 trigger 정확도를 측정하지 않습니다.

외부 출처와 라이선스 표기는 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)에 기록합니다. 새 package version을 포함한 변경이 `main`에 병합되거나 `v*.*.*` release tag가 push되면 GitHub Actions 검증 후 아직 게시되지 않은 버전을 npm trusted publishing으로 배포합니다.
