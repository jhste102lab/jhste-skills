# jhste-skills

한국어 | [ENG](README.en.md)

모델과 실행 도구에 종속되지 않도록 설계한 개인용 엔지니어링 스킬 모음입니다. 스킬은 모델이나 reasoning 수준을 정하지 않습니다. 사용자가 선택한 하네스 설정을 존중하면서, 필요한 일을 올바르게 나누고 불필요한 질문 없이 검증 가능한 결과까지 진행합니다.

기본 `SKILL.md`에는 작업 계약과 중요한 경계만 두고, 드물게 필요한 형식·복구·변형 절차는 `references/`에서 필요할 때만 읽습니다.

## 무엇을 만들지 정하기

- **[`jhste-grill`](skills/jhste-grill/SKILL.md)** — 지금 답할 수 있는 중요한 결정을 묶어 묻고, 확정된 용어와 필요한 ADR을 진행 중에 기록합니다.
- **[`jhste-to-questionnaire`](skills/jhste-to-questionnaire/SKILL.md)** — 현재 사용자가 답할 수 없는 사실이나 결정을 실제 지식 소유자에게 받을 질문지로 정리합니다.
- **[`jhste-domain-modeling`](skills/jhste-domain-modeling/SKILL.md)** — 프로젝트 고유 용어, 개념 경계, 관계를 명확히 하고 해당 glossary와 필요한 ADR을 갱신합니다.
- **[`jhste-to-spec`](skills/jhste-to-spec/SKILL.md)** — 이미 논의되거나 정의된 변경을 추가 인터뷰 없이 검토 가능한 행동 명세로 정리합니다.

## 직접 만들고 고치기

- **[`jhste-prototype`](skills/jhste-prototype/SKILL.md)** — production 구현 전 하나의 설계 질문을 가장 작은 실행 가능한 실험으로 검증합니다.
- **[`jhste-coding`](skills/jhste-coding/SKILL.md)** — 명확한 기능, 알려진 수정, 리팩터링, 정확한 재개 단계, 진행 중인 merge/rebase conflict를 처리하고 자신의 결과를 검증합니다.
- **[`jhste-diagnosing-bugs`](skills/jhste-diagnosing-bugs/SKILL.md)** — 원인이 불명확한 기존 장애와 성능 저하를 증상별 증거와 측정으로 진단합니다.

## 일을 나누고 이어가기

- **[`jhste-subagent-orchestration`](skills/jhste-subagent-orchestration/SKILL.md)** — 분리 이익이 있는 작업을 워커에 맡기되, head가 결정·소유권·통합·최종 검증을 책임집니다.
- **[`jhste-to-tickets`](skills/jhste-to-tickets/SKILL.md)** — 정의된 작업을 하나의 유용한 GitHub issue 또는 실제 dependency가 있는 issue graph로 나눕니다.
- **[`jhste-handoff`](skills/jhste-handoff/SKILL.md)** — 다음 실행자에게 검증된 상태, authoritative reference, 소유권, 버린 접근과 정확한 다음 작업을 전달합니다.

## 기존 코드 결과 재검증

- **[`jhste-code-result-double-check`](skills/jhste-code-result-double-check/SKILL.md)** — 완료됐다고 하거나 제출된 코드 결과를 요구사항·작업 소유 diff·현재 코드·검증 증거와 독립적으로 대조하고, 범위 내 누락과 오류를 고친 뒤 최종 상태를 검증합니다.

## 핵심 원칙

- 저장소, 문서, 도구에서 찾을 수 있는 사실은 사용자나 외부 이해관계자에게 묻지 않고 직접 조사합니다.
- 사용자는 제품 정책, 호환성, 보안·데이터 정책, 외부 쓰기처럼 사용자만 결정하거나 허가할 수 있는 문제에만 개입합니다. 서로 독립적인 질문은 묶습니다.
- 필요한 지식이 현재 사용자가 아닌 다른 사람에게 있으면 `jhste-to-questionnaire`로 실제 소유자에게 받을 질문만 정리합니다.
- 모델, provider, reasoning 또는 effort, worker 수, 동시성, scheduling, 실제 격리는 사용자와 하네스가 관리합니다. 스킬은 이를 선택하거나 덮어쓰지 않습니다.
- 서브에이전트는 반복 읽기와 조정 비용보다 분리 이익이 클 때만 사용합니다. 독립 판단이 필요하지 않은 보충 증거나 작은 수정에는 기존 워커를 재사용할 수 있습니다.
- 요청 결과를 실패와 가장 직접적으로 구분하는 저장소 고유 신호를 선택합니다. 관련 위험·통합 범위·관찰된 실패가 요구할 때만 검증을 확장하고, 실행하지 않은 검증을 성공했다고 말하지 않습니다.
- `jhste-grill`과 `jhste-domain-modeling` 요청은 확정된 local glossary와 필요한 ADR 갱신을 포함합니다. commit, push, issue, PR, release 같은 외부 쓰기는 요청 범위에서만 수행합니다.

## 주요 경계

명확한 변경을 구현하고 자신의 결과를 검증하는 작업은 `jhste-coding`, 이미 존재하는 결과를 독립적으로 다시 확인하는 작업은 `jhste-code-result-double-check`가 담당합니다. 일반 구현 요청 뒤에 double-check를 자동 연쇄 실행하지 않습니다. branch, handoff, PR, worker 결과가 있다는 사실만으로 선택하지 않고 요청의 주목적을 봅니다.

기존 증상의 원인이 불명확하면 `jhste-diagnosing-bugs`, 아직 만들지 않은 설계 질문을 실행 증거로 판단해야 하면 `jhste-prototype`이 담당합니다. 사용자 소유 결정은 `jhste-grill`, 다른 지식 소유자에게 받아야 하는 사실·결정은 `jhste-to-questionnaire`, 용어와 개념 모델 자체의 변경은 `jhste-domain-modeling`이 담당합니다.

PR을 읽고 지적만 하는 작업이나 기존 리뷰 의견의 타당성만 확인하는 작업은 하네스 또는 일반 GitHub 도구로 처리합니다. 이미 타당성이 확인된 리뷰 지적의 명확한 수정은 `jhste-coding`, 원인이 불명확한 문제는 `jhste-diagnosing-bugs`가 담당합니다. double-check는 삭제된 리뷰 workflow를 대신 흡수하지 않으며, 댓글 게시·commit·push·merge 권한을 자동으로 상속하지 않습니다.

`jhste-subagent-orchestration`은 다른 스킬의 계약을 확장하지 않고 bounded outcome으로 조합합니다. acceptance worker는 수정 기능이 있는 스킬을 사용해도 읽기 전용이며, 수정은 권한이 있는 구현 assignment로 처리합니다. 구현이 완료됐거나 double-check가 실행된다는 이유만으로 별도 워커를 추가하지 않습니다.

`jhste-to-spec`은 요구사항 계약, `jhste-to-tickets`는 실행 issue 경계와 dependency, `jhste-handoff`는 다음 실행자가 이어갈 현재 상태를 기록합니다. 서로의 내용을 중복 저장하지 않고 authoritative artifact를 참조합니다.

이 패키지는 의무적인 TDD workflow, Wayfinder, 별도 architecture-audit 스킬을 포함하지 않습니다.

## npm에서 사용자 전역 설치

이 패키지는 CLI나 설치 폴더 자동 동기화 hook을 제공하지 않습니다. 스킬 디렉터리와 Codex용 metadata를 배포합니다. 새로 복사 설치할 때는 다음을 실행합니다.

```sh
npm install -g jhste-skills@latest
mkdir -p "$HOME/.agents/skills"
cp -R "$(npm root -g)/jhste-skills/skills/." "$HOME/.agents/skills/"
```

기존 설치는 파일을 덮어쓰기만 하지 말고 아래 갱신 절차를 따르세요. 사용하는 에이전트가 다른 skills 디렉터리를 읽으면 대상 경로를 조정하세요.

## 저장소에서 사용자 전역 설치

새로 설치할 때 저장소 루트에서 실행합니다.

```sh
mkdir -p "$HOME/.agents/skills"
cp -R skills/. "$HOME/.agents/skills/"
```

## 기존 설치 갱신

`npm update -g jhste-skills`는 npm 패키지를 갱신하지만 에이전트의 skills 디렉터리에 복사한 파일까지 갱신하지는 않습니다. 0.15.0에서는 `jhste-pr-review`, `jhste-review-followup`을 삭제하고 `jhste-implementation-finalizer`를 `jhste-code-result-double-check`로 전환합니다. 다시 복사하기만 하면 이전 디렉터리가 남아 계속 선택될 수 있습니다.

먼저 실제 사용 중인 모든 설치 경로와 복사·symlink·별도 installer 관리 여부, 로컬 수정본을 확인하세요. 표준 복사 설치는 npm을 갱신한 다음 아래 블록을 실행합니다. 이 패키지가 제공하는 현재 이름과 폐기된 이름의 디렉터리만 Skill 탐색 경로 밖의 고유 백업 폴더로 이동하므로, 로컬 수정본과 다른 스킬을 보존합니다. 백업의 필요한 사용자 변경은 비교 후 선별적으로 재적용하고, 폐기된 Skill 디렉터리를 다시 복원하지 마세요.

```sh
npm install -g jhste-skills@latest
```

<!-- BEGIN COPY UPGRADE -->
```sh
(
  set -eu
  src="$(npm root -g)/jhste-skills/skills"
  dst="$HOME/.agents/skills"
  test -f "$src/jhste-code-result-double-check/SKILL.md"
  mkdir -p "$dst"
  test "$(cd "$src" && pwd -P)" != "$(cd "$dst" && pwd -P)"
  backup="$(mktemp -d "$HOME/jhste-skills-backup.XXXXXX")"
  for source in "$src"/*; do
    name="${source##*/}"
    if [ -e "$dst/$name" ] || [ -L "$dst/$name" ]; then
      mv "$dst/$name" "$backup/$name"
    fi
  done
  for name in jhste-pr-review jhste-review-followup jhste-implementation-finalizer; do
    if [ -e "$dst/$name" ] || [ -L "$dst/$name" ]; then
      mv "$dst/$name" "$backup/$name"
    fi
  done
  cp -R "$src/." "$dst/"
  printf 'Backup: %s\n' "$backup"
)
```
<!-- END COPY UPGRADE -->

저장소 복사본에서 갱신할 때는 `src`를 해당 `skills/`의 절대 경로로 바꾸세요. symlink나 installer 관리 설치는 복사 절차를 무작정 실행하지 말고 해당 설치 방식으로 갱신하세요. 전체 skills 디렉터리나 모든 `jhste-*` 경로를 지우지 마세요. 오래된 설치와 사용자 정의 디렉터리는 소유권 확인이 먼저입니다.

하네스에 맞게 에이전트를 새로고침하거나 재시작한 뒤 새 Skill이 발견되고, 모든 활성 탐색 경로에서 이전 세 이름이 사라졌으며, 다른 스킬이 유지됐는지 확인하세요. npm 버전 확인만으로 에이전트가 새 파일을 읽었다고 판단하지 않습니다.

## 유지보수

[MAINTENANCE.md](MAINTENANCE.md)는 안전·권한·소유권·산출물 인터페이스·완료 조건을 남기고, 최신 모델의 실제 결과를 개선하지 않는 지침을 먼저 제거하는 원칙을 설명합니다.

## 개발 및 검증

설치된 npm 패키지가 아니라 저장소 checkout에서 실행합니다.

```sh
npm test
npm pack --dry-run
```

패키지 구성, metadata, Markdown 링크, 정적 routing 계약, 릴리스 노트 추출과 복사 설치 갱신의 회귀를 검사합니다. 정적 fixture는 모델을 호출하거나 자동 선택 정확도를 측정하지 않으며, 후속 Skill이 호출되지 않았다는 사실도 입증하지 않습니다. 별도로 실행할 실제 모델 sentinel은 [MAINTENANCE.md](MAINTENANCE.md)에 정리합니다.

외부 출처와 라이선스는 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)에 기록합니다. PR은 읽기 전용 검증을 실행합니다. 새 버전이 담긴 `package.json`이 `main`에 병합되거나 버전이 일치하는 `v*.*.*` 태그가 push되면, 배포 workflow가 검증·npm trusted publishing·정확한 registry 버전 확인을 수행한 뒤 [CHANGELOG.md](CHANGELOG.md)의 해당 버전 내용으로 GitHub 릴리스 노트를 만듭니다. 재실행 시 기존 릴리스는 덮어쓰지 않습니다.
