# jhste-skills

한국어 | [ENG](README.en.md)

GPT-5.6의 outcome-first, lean-prompt 지침에 맞춰 관리하는 개인용 엔지니어링 스킬 모음입니다. 각 스킬은 독립적으로 동작하며, 필요한 경우 Codex가 사용자 의도에 맞춰 자동 호출할 수 있습니다.

## 스킬

- **`jhste-coding`** — 충분히 이해된 기능 구현, 버그 수정, 리팩터링을 작은 변경과 관련 검증으로 완료합니다.
- **`jhste-diagnosing-bugs`** — 원인이나 올바른 수정이 불명확한 어려운 버그와 성능 회귀를 재현·가설·측정으로 진단합니다.
- **`jhste-grill`** — 중요한 결정 가지를 한 질문씩 해결하면서 확정된 도메인 맥락과 ADR을 계속 갱신합니다.
- **`jhste-domain-modeling`** — 도메인 용어, 개념 경계, 관계를 명확히 하고 확정된 glossary와 조건을 충족하는 ADR을 즉시 기록합니다.
- **`jhste-to-spec`** — 이미 논의되거나 정의된 변경을 저장소 근거와 함께 검토 가능한 engineering spec으로 합성합니다.
- **`jhste-to-tickets`** — 명확해진 작업을 GitHub 부모/sub-issues와 native dependency로 분할합니다.
- **`jhste-pr-review`** — 사용자가 명시적으로 요청한 PR을 실제 diff 기준으로 리뷰하고 확신도 높은 actionable finding만 코멘트합니다.
- **`jhste-review-followup`** — 기존 PR 피드백을 검증하고 타당한 수정만 기존 PR 브랜치에 반영합니다.

스킬은 서로를 강제로 호출하지 않습니다. 하나의 요청이 여러 의도를 포함하면 함께 사용할 수 있습니다. 예를 들어 미결정 요구는 `jhste-grill`로 주요 결정 가지를 해결하면서 glossary와 ADR을 갱신하고, 별도의 용어 모델링은 `jhste-domain-modeling`으로 다룰 수 있습니다. 결정된 내용은 `jhste-to-spec`으로 합성한 뒤 `jhste-to-tickets`로 실행 이슈를 만들 수 있습니다. 어려운 진단이 끝나 수정 경로가 명확해지면 `jhste-coding`으로 이어집니다.

## 동작 경계

- `jhste-coding`은 코드 변경 경로가 충분히 이해된 구현과 수정에 사용합니다. 원인이 불명확하거나 간헐적이거나 성능 측정이 핵심인 문제는 `jhste-diagnosing-bugs`가 우선합니다.
- `jhste-diagnosing-bugs`는 재현 신호, 복수 가설, instrumentation 또는 측정이 필요한 root-cause 조사에 사용합니다. 명확한 오타, 직접적인 compile/lint 오류, 이미 입증된 수정에는 전체 진단 절차를 적용하지 않습니다.
- `jhste-grill`은 사용자가 인터뷰나 결정 검증을 원할 때 사용하며, 단순한 모호성만으로 긴 인터뷰를 시작하지 않습니다. 쓰기 가능한 저장소에서는 합의된 용어를 즉시 glossary에 반영하고, 되돌리기 어렵고 맥락 없이는 의외이며 실제 trade-off에서 나온 결정은 별도 확인 없이 ADR로 기록합니다. 목표·범위·주요 동작·중대한 실패·비가역적 trade-off에 영향을 주는 가지를 해결하되, 가역적인 취향과 안전하게 위임 가능한 구현 세부사항은 중단 조건 밖에 둡니다.
- `jhste-domain-modeling`은 쓰기 가능한 저장소에서 용어가 의미·경계·구체적 사례까지 합의되는 즉시 glossary를 갱신하고, 같은 세 가지 조건을 충족한 결정은 ADR로 자동 기록합니다. 분석 전용 요청이나 편집 금지 요청에서는 정확한 변경안만 제시합니다.
- `jhste-grill`과 `jhste-domain-modeling`의 로컬 문서 갱신은 해당 작업의 일부이지만 commit, push, PR, 이슈 게시 같은 외부 쓰기는 사용자가 해당 동작을 명시해야 합니다.
- `jhste-to-spec`은 기본적으로 대화 안에 초안을 작성하고, 확정되지 않은 사항을 open question으로 남깁니다. 사용자가 파일이나 이슈에 기록·게시하라고 요청한 경우에만 해당 artifact를 씁니다.
- `jhste-to-tickets`는 기본적으로 초안을 만듭니다. 사용자가 GitHub에 생성·게시하라고 명시한 경우에만 외부 쓰기를 수행하며, 저장소에 없는 workflow label을 추측해서 추가하지 않습니다.
- `jhste-pr-review`는 사용자가 PR 코드 리뷰를 명시적으로 요청한 경우에만 사용합니다. 해당 요청은 확신도 높은 인라인 코멘트를 `COMMENT` event로 게시하는 것까지 승인하며, approve나 request changes는 해당 동작을 정확히 명시해야 합니다.
- `jhste-review-followup`은 사용자가 기존 PR 리뷰 피드백 처리를 명시적으로 요청한 경우에만 사용합니다. 각 항목의 타당성을 검증하고, 타당한 root cause만 수정·검증한 뒤 기존 PR 브랜치를 업데이트합니다. 병합, 답글, thread resolve, 이슈 변경, 작업 흔적 정리는 수행하지 않습니다.

TDD를 강제하는 workflow, Wayfinder, 별도 architecture-audit 스킬은 포함하지 않습니다. module ownership, caller contract, 실제 variation, test seam 같은 설계 판단은 `jhste-coding`의 현재 변경 범위 안에서만 적용합니다. 반복되는 실사용 실패가 별도 orchestration이나 설계 스킬의 유지비를 정당화할 때 다시 분리할 수 있습니다.

## npm으로 사용자 전역 설치

이 패키지는 CLI를 제공하지 않습니다. npm 패키지는 여덟 스킬과 Codex 메타데이터를 배포하는 번들입니다.

```sh
npm install -g jhste-skills
mkdir -p "$HOME/.agents/skills"
cp -R "$(npm root -g)/jhste-skills/skills/." "$HOME/.agents/skills/"
```

npm 패키지를 업데이트한 뒤에는 복사 명령을 다시 실행해야 설치된 스킬도 갱신됩니다. Codex가 변경된 스킬을 표시하지 않으면 다시 시작하세요.

## 저장소에서 사용자 전역 설치

```sh
mkdir -p "$HOME/.agents/skills"
cp -R skills/. "$HOME/.agents/skills/"
```

다른 에이전트가 별도 전역 skills 디렉터리를 요구하면 `skills/` 아래의 여덟 디렉터리를 그 위치로 복사하세요. 이 패키지는 프로젝트별 스킬 복사본을 요구하지 않습니다.

## 개발 및 검증

```sh
npm test
npm pack --dry-run
```

`npm test`는 package·metadata·문서 일관성과 변경된 여섯 스킬의 36개 static routing scenario 계약을 검사합니다. 이 fixture는 모델을 호출하거나 실제 자동 trigger 정확도를 측정하지 않습니다.

외부 아이디어와 문구의 출처 및 라이선스는 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)에 기록합니다. 릴리스 태그 `v*.*.*`를 푸시하면 GitHub Actions가 테스트 후 npm trusted publishing으로 공개 배포합니다.
