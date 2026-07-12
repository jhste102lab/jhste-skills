# jhste-skills

한국어 | [ENG](README.en.md)

GPT-5.6의 outcome-first, lean-prompt 지침에 맞춰 관리하는 개인용 엔지니어링 스킬 모음입니다. 각 스킬은 독립적으로 동작하며, 필요한 경우 Codex가 사용자 의도에 맞춰 자동 호출할 수 있습니다.

## 스킬

- **`jhste-coding`** — 기능 구현, 버그 수정, 리팩터링을 작은 변경과 관련 검증으로 완료합니다.
- **`jhste-grill`** — 계획이나 설계를 한 번에 하나의 중요한 결정 질문으로 구체화합니다.
- **`jhste-to-tickets`** — 명확해진 작업을 GitHub 부모/sub-issues와 native dependency로 분할합니다.
- **`jhste-domain-modeling`** — 도메인 용어, 개념 경계, 관계를 명확히 하고 요청 시 glossary나 ADR에 반영합니다.

스킬은 서로를 강제로 호출하지 않습니다. 하나의 요청이 여러 의도를 포함하면 함께 사용할 수 있습니다. 예를 들어 설계 인터뷰 중 확정된 용어를 기록하려면 `jhste-grill`과 `jhste-domain-modeling`을 함께 지정할 수 있습니다.

## 동작 경계

- `jhste-coding`은 실제 코드 변경 요청에만 사용합니다.
- `jhste-grill`은 사용자가 인터뷰나 결정 검증을 원할 때 사용하며, 단순한 모호성만으로 긴 인터뷰를 시작하지 않습니다.
- `jhste-to-tickets`는 기본적으로 초안을 만듭니다. 사용자가 GitHub에 생성·게시하라고 명시한 경우에만 외부 쓰기를 수행합니다.
- `jhste-domain-modeling`은 기본적으로 분석하고 제안합니다. 사용자가 기록·반영을 요청한 경우에만 저장소 문서를 수정합니다.

TDD, 코드 리뷰, 디버깅 절차, Wayfinder, 아키텍처 감사 workflow는 포함하지 않습니다. 모델의 기본 능력과 저장소 자체의 CI·지침을 우선하고, 반복되는 실제 실패가 확인될 때만 새 스킬을 추가합니다.

## npm으로 사용자 전역 설치

이 패키지는 CLI를 제공하지 않습니다. npm 패키지는 네 스킬과 Codex 메타데이터를 배포하는 번들입니다.

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

다른 에이전트가 별도 전역 skills 디렉터리를 요구하면 `skills/` 아래의 네 디렉터리를 그 위치로 복사하세요. 이 패키지는 프로젝트별 스킬 복사본을 요구하지 않습니다.

## 개발 및 검증

```sh
npm test
npm pack --dry-run
```

릴리스 태그 `v*.*.*`를 푸시하면 GitHub Actions가 테스트 후 npm trusted publishing으로 공개 배포합니다.
