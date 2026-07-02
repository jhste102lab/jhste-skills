# jhste-skills

작은 개인용 코딩 규율 스킬입니다.

이 저장소는 하나의 스킬만 제공합니다.

- `jhste-coding`: 저장소 코드 수정 중 적용하는 가벼운 SOLID-first 코딩 규율

이 저장소는 workflow 스킬을 vendoring하지 않습니다. 더 넓은 계획, 이슈, PRD, 디버깅, 아키텍처, 리뷰 workflow에는 `mattpocock/skills`를 별도로 사용하세요.

## npm으로 설치

이 패키지는 CLI를 제공하지 않습니다. npm 패키지는 스킬 파일을 배포하기 위한 작은 번들입니다.

```sh
npm install -g jhste-skills
mkdir -p ~/.codex/skills
cp -R "$(npm root -g)/jhste-skills/skills/jhste-coding" ~/.codex/skills/
```

사용하는 에이전트의 skills 디렉터리가 다르다면 `skills/jhste-coding/`을 그 위치로 복사하세요.

## 저장소에서 설치

```sh
mkdir -p ~/.codex/skills
cp -R skills/jhste-coding ~/.codex/skills/
```

## SOLID-first 규율

`jhste-coding`은 작은 실제 코드 변경에 SOLID를 주된 렌즈로 적용합니다.

- **단일 책임:** 변경한 단위가 하나의 분명한 일을 하도록 유지합니다.
- **개방/폐쇄:** 실제 변형이 반복해서 같은 핵심 로직을 바꾸게 만들 때만 확장 지점을 둡니다.
- **리스코프 치환:** 반환 형태, null 가능성, 오류, 부수 효과 같은 호출자 기대를 보존합니다.
- **인터페이스 분리:** 필요한 만큼의 작은 계약에 의존합니다.
- **의존성 역전:** 명확해질 때 비즈니스 규칙과 구체적인 부수 효과를 분리합니다.

이 스킬은 코드 작성 중 쓰는 규율이며 더 넓은 프로세스 자동화나 리뷰 파이프라인이 아닙니다.
