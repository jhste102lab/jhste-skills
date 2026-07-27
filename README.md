# jhste-skills

한국어 | [ENG](README.en.md)

GPT-5.6의 outcome-first, lean-prompt 지침에 맞춰 관리하는 개인용 엔지니어링 스킬 모음입니다. 각 스킬은 독립적으로 동작하며, 사용자 의도가 좁은 trigger와 맞으면 자동 선택될 수 있습니다.

## 스킬

- **`jhste-coding`** — 충분히 이해된 기능, 버그 수정, 리팩터링과 handoff의 정확한 재개 지점부터 이어지는 일반 구현을 작은 변경과 관련 검증으로 수행합니다.
- **`jhste-diagnosing-bugs`** — 원인이나 올바른 수정이 불확실한 어려운 버그와 성능 저하를 재현, 가설, 측정으로 진단합니다.
- **`jhste-grill`** — 중요한 결정 분기를 한 번에 한 질문씩 해소하면서 확정된 도메인 문맥과 ADR을 계속 갱신합니다.
- **`jhste-domain-modeling`** — 도메인 용어, 경계, 관계를 명확히 하고 확정된 glossary 항목과 필요한 ADR을 바로 기록합니다.
- **`jhste-to-spec`** — 이미 논의되거나 정의된 변경을 저장소 근거에 맞춘 검토 가능한 엔지니어링 명세로 정리합니다.
- **`jhste-to-tickets`** — 정의된 작업을 GitHub parent/sub-issue와 native dependency로 나눕니다.
- **`jhste-handoff`** — 특정 실행 도구와 무관하게 소유권, 단계 진행, 검증, blocker, 정확한 재개 지점을 보존하는 구현 handoff를 만들거나 갱신합니다.
- **`jhste-implementation-finalizer`** — 완료 주장이나 제출된 구현을 독립적으로 감사·검증하고 부족한 부분을 직접 고쳐 최종 완료하며, 이미 승인된 동일 PR 업데이트까지 수행합니다.
- **`jhste-pr-review`** — 명시적으로 요청된 PR을 실제 diff 기준으로 검토하고 신뢰도 높은 실행 가능한 지적만 게시합니다.
- **`jhste-review-followup`** — 기존 PR 피드백을 검증하고 정당한 수정만 기존 PR 브랜치에 반영합니다.

스킬은 서로를 의무적으로 호출하지 않습니다. 한 요청에 여러 의도가 있으면 필요한 스킬을 조합할 수 있습니다. handoff를 읽는다는 사실만으로 `jhste-handoff`나 `jhste-implementation-finalizer`가 선택되지는 않습니다. 정확한 재개 지점부터 알려진 구현을 계속하면 `jhste-coding`, 원인이 아직 불명확하면 `jhste-diagnosing-bugs`, 완료 주장에 대한 독립 감사와 최종 마무리를 요청하면 `jhste-implementation-finalizer`가 담당합니다.

## 동작 경계

- `jhste-coding`은 구현 경로가 충분히 명확한 코드 변경과 기존 handoff 또는 부분 구현의 일반적인 이어서 하기를 담당합니다.
- `jhste-diagnosing-bugs`는 재현 신호, 경쟁 가설, 계측, 측정이 필요한 문제를 담당하며, 명백한 오타나 이미 원인이 확인된 수정에는 과한 진단 절차를 강요하지 않습니다.
- `jhste-grill`은 사용자가 인터뷰나 의사결정 검증을 원할 때만 동작합니다. 쓰기 가능한 저장소에서는 분석 전용 또는 수정 금지 요청이 아닌 한 확정된 glossary와 ADR을 갱신합니다.
- `jhste-domain-modeling`은 도메인 언어와 개념 경계를 담당하며, 단순 변수명 변경이나 일반적인 아키텍처 설명을 가로채지 않습니다.
- `jhste-to-spec`은 확정된 동작, 계약, 검증, 범위를 정의합니다. 작업자 진행 상황이나 영구 재개 문서로 사용하지 않습니다.
- `jhste-to-tickets`는 GitHub issue graph를 초안 작성하거나 게시합니다. 로컬 handoff 상태를 여러 issue 본문에 중복하지 않습니다.
- `jhste-handoff`는 handoff 문서를 새로 만들거나 갱신하고, 재개 가능한 단계로 나누는 명시적 요청에서만 동작합니다. 기존 handoff를 읽고 구현을 계속하는 작업 자체는 담당하지 않습니다.
- `jhste-implementation-finalizer`는 완료 주장, 독립 검증, 최종 감사·수정 의도가 명시된 기존 구현을 담당합니다. 기존 handoff, 부분 구현, branch, diff, worktree, worker result가 있다는 사실만으로 선택되지 않습니다.
- `jhste-pr-review`는 검토 전용 요청에만 적용되며 브랜치를 수정하지 않습니다.
- `jhste-review-followup`은 이미 존재하는 PR 피드백이 범위를 정의할 때만 적용됩니다. 일반적인 작업자 결과 마무리 용도가 아닙니다.

이 패키지는 의무적인 TDD workflow, Wayfinder, 범용 delivery orchestrator, 별도 architecture-audit 스킬을 포함하지 않습니다. 현재 스킬과 사용 가능한 구현 수단만으로 조합할 수 있으며, 반복되는 실제 실패가 확인되기 전에는 라우팅 계층을 추가해 문맥과 유지보수 비용을 늘리지 않습니다.

## npm에서 사용자 전역 설치

이 패키지는 CLI를 제공하지 않습니다. 열 개 스킬과 Codex metadata를 배포합니다.

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

다른 agent가 다른 전역 skills 디렉터리를 사용하면 `skills/` 아래 열 개 디렉터리를 그 위치에 복사하세요. 프로젝트별 복사본은 필수가 아닙니다.

## 개발 및 검증

```sh
npm test
npm pack --dry-run
```

`npm test`는 패키지, metadata, 문서 일관성과 변경된 여덟 스킬의 정적 라우팅 시나리오 52개를 검사합니다. 이 fixture는 모델을 실제 호출하거나 자동 trigger 정확도를 측정하지 않습니다.

외부 출처와 라이선스 표기는 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)에 기록합니다. 새 package version을 포함한 변경이 `main`에 병합되거나 `v*.*.*` release tag가 push되면 GitHub Actions 검증 후 아직 게시되지 않은 버전을 npm trusted publishing으로 배포합니다.
