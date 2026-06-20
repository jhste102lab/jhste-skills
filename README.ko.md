# jhste-skills

Languages: [English](README.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md)

AI 코딩 에이전트가 설정한 코딩 기준을 일관되게 따르도록 만드는 설치형 작업 규칙 세트입니다.

`jhste-skills`는 Codex, Claude Code 같은 AI 코딩 에이전트에게 공통된 엔지니어링 작업 루프를 제공합니다. 코드를 바꾸기 전에 전제를 확인하고, 레포의 기존 지침을 우선시하고, API/database/automation 경계를 지키고, 한 모듈이 하나의 명확한 책임을 갖는지 확인하는 SRP(Single Responsibility Principle) 관점으로 변경 책임을 점검하고, 변경 파일 guard를 실행하고, 완료를 선언하기 전에 red-team code review를 거치도록 돕습니다.

이 도구는 프로젝트를 장악하지 않습니다. 레포 안의 `AGENTS.md`, `CLAUDE.md`, docs가 항상 우선입니다. 기본 설정은 advisory 모드이며, marker-managed 방식으로 동작하고, 부담 없이 시도할 수 있도록 설계되어 있습니다.

스킬은 필요한 상황에서 에이전트가 자동으로 사용하도록 설계되어 있습니다. 예를 들어 API 코드를 수정하면 API/database boundary 스킬을, 완료 직전에는 red-team review 스킬을 사용하도록 안내합니다. 사용자가 직접 특정 스킬을 호출할 수도 있습니다. 예: `jhste-engineering-judgment를 사용해서 이 변경 전제를 검토해줘`, `jhste-red-team-review로 이 diff를 리뷰해줘`.

## 왜 설치해야 하나요?

AI 코딩 에이전트는 빠르지만, 반복적으로 비슷한 방식으로 실패합니다.

- 불명확한 요구사항이나 틀린 전제를 조용히 받아들입니다.
- 도와주려다가 작업 범위를 과하게 넓힙니다.
- UI, route/controller, service, database, side effect 책임을 한곳에 섞어 “한 모듈, 한 책임” 원칙(SRP)을 깨뜨립니다.
- 실패를 숨기거나 위험한 로그를 남깁니다.
- 변경된 코드를 충분히 확인하기 전에 “완료”라고 말합니다.
- 머신이나 레포를 바꿀 때마다 레포별 규칙을 잊어버립니다.

`jhste-skills`는 이런 실패를 줄이기 위한 반복 가능한 작업 루프를 에이전트에게 제공합니다.

```text
non-trivial code change 전:
  목표, 전제, ownership seam, data contract, failure path, SRP 책임 확인

수정 중:
  repo-local instructions를 권위로 취급

코드 변경 후:
  가능한 경우 빠른 changed-file guard 실행

“완료”라고 말하기 전:
  read-only red-team code review 실행

warning이 나오면:
  bounded fix를 시도하고, 다시 확인한 뒤, 무한 루프에 빠지지 않고 멈춤
```

기대하는 결과는 더 작은 diff, 더 명확한 SRP 경계, 더 안전한 API/database 코드, 더 적은 silent assumption, 더 솔직한 완료 보고입니다.

## 누가 설치하면 좋나요?

다음에 해당한다면 `jhste-skills`를 설치할 가치가 있습니다.

- Codex, Claude Code 또는 다른 coding agent를 여러 레포에서 사용합니다.
- non-trivial code change 전에 에이전트가 전제를 확인하길 원합니다.
- 기존 repo docs가 계속 권위로 남길 원합니다.
- 커밋 전 또는 완료 선언 전에 가벼운 advisory check를 두고 싶습니다.
- SRP, API/database boundary, safe logging, input validation, side effect, automation reliability를 중요하게 봅니다.
- 머신과 레포를 옮겨도 같은 AI 작업 습관을 빠르게 복원하고 싶습니다.

반대로, prompt 파일 하나만 원하거나, 설치 즉시 strict CI enforcement를 원하거나, `.jhste/` 파일과 bridge block 생성을 원하지 않거나, 이 도구가 자동으로 코드를 refactor하길 기대한다면 맞지 않을 수 있습니다.

## 빠른 시작

```bash
npx jhste-skills install
```

또는 npm으로 CLI를 전역 설치해서 어느 레포에서든 사용할 수 있습니다.

```bash
npm install -g jhste-skills
jhste-skills install
```

한 번만 실행해보고 싶다면 `npx`를 쓰면 되고, 평소에 계속 사용할 CLI로 두고 싶다면 `npm install -g`를 쓰면 됩니다.

기본 설치는 Normal mode를 사용합니다.

- bundled skills 전체를 설치합니다: jhste core skills + vendored workflow skills.
- `.jhste/profile.yaml`이 없으면 생성합니다.
- project guidance가 켜져 있으면 `AGENTS.md` 또는 `CLAUDE.md`에 marker-managed bridge block을 추가하거나 갱신합니다.
- 안전할 때 advisory pre-commit hook을 설치합니다.
- CI, target `package.json`, lockfile, source code는 수정하지 않습니다.

다른 레포에 연결하려면:

```bash
cd /path/to/another-repo
jhste-skills connect
```

jhste core guardrail skills만 설치하려면:

```bash
npx jhste-skills install --skill-set core
```

변경 파일 guard를 수동으로 실행하려면:

```bash
jhste-skills guard --scope changed --format text --fail-on error
```

선택적으로 repo-wide advisory scan을 실행하려면:

```bash
jhste-skills deep-scan
```

managed output을 제거하려면:

```bash
jhste-skills uninstall --yes --repo /path/to/repo
```

`uninstall`은 managed hook, marker-managed bridge block, manifest-managed skill directory를 제거합니다. non-managed file은 건드리지 않습니다. `.jhste/profile.yaml`은 generated shape 그대로일 때만 제거하며, 수정된 profile을 제거하려면 내용을 검토한 뒤 `--force-profile`을 명시해야 합니다.

## 설치 모드

```text
Minimal  - jhste core skills만 설치; project file이나 hook은 만들지 않음
Normal   - 권장 기본값; all bundled skills + project profile/bridge + advisory pre-commit hook
Full     - all bundled skills + profile/bridge + advisory pre-commit/pre-push hooks + deep scan
Custom   - 효과 중심 질문을 통해 설치 범위를 직접 선택
```

`Full`도 safety contract를 지킵니다. non-managed hook, source file, CI, `package.json`, lockfile을 덮어쓰지 않고, strict mode를 켜지 않습니다. Interactive Full mode에서는 자동 check 동작만 묻습니다: warning only, commit-time block, commit/push-time block. `--yes`는 `--hooks blocking`을 명시하지 않는 한 warning-only를 사용합니다.

## Safety contract

`jhste-skills`는 safe-by-default를 목표로 합니다.

- repo-local `AGENTS.md`, `CLAUDE.md`, docs가 항상 권위입니다.
- 사용자의 명시적 지시는 작업 scope를 정하지만, 확인된 safety/privacy/data-loss/repo-architecture constraint를 조용히 무시하지 않습니다.
- 기본 설치는 CI를 수정하지 않습니다.
- 기본 설치는 target `package.json`이나 lockfile을 수정하지 않습니다.
- 기본 설치는 source code를 자동 refactor하지 않습니다.
- managed hook은 기본적으로 advisory입니다.
- strict mode는 명시적 opt-in이 필요합니다.
- bridge block은 `<!-- jhste-skills:start -->` / `<!-- jhste-skills:end -->` marker를 사용합니다.
- guard output은 review evidence이지 그 자체로 proof가 아닙니다.
- guard runtime/config failure는 rule violation과 별도로 보고해야 합니다.
- install/update/uninstall flow는 non-managed hook, bridge text, skill directory를 건드리지 않습니다.

## Core jhste skills

아래는 jhste가 작성한 guardrail skills입니다. 기본 bundled skill set의 일부로 설치되며, `--skill-set core`를 사용하면 이 core skills만 설치할 수 있습니다.

| Skill | 언제 쓰나 | 무엇을 줄여주나 |
|---|---|---|
| [`setup`](skills/setup/SKILL.md)<br>설치, 연결, 업데이트가 기존 프로젝트 지침을 덮어쓰지 않도록 하는 안전 설치 스킬 | kit를 설치하거나 레포에 연결할 때 | unsafe overwrite, unmanaged hook conflict, repo instruction replacement |
| [`jhste-engineering-judgment`](skills/jhste-engineering-judgment/SKILL.md)<br>코드 변경 전 목표, 전제, scope, seam, failure path를 검증하는 pre-change 판단 스킬 | non-trivial code change 전 | blind agreement, scope creep, unverified assumption, unclear seam |
| [`jhste-code-quality`](skills/jhste-code-quality/SKILL.md)<br>입력 검증, 관측 가능한 실패 처리, secret-safe logging을 점검하는 코드 품질 스킬 | application code 작성/리뷰 시 | unvalidated input, silent failure, secret logging, oversized file |
| [`jhste-architecture-review`](skills/jhste-architecture-review/SKILL.md)<br>모듈 경계, side effect 위치, SRP 위반 가능성을 검토하는 아키텍처 리뷰 스킬 | module boundary나 app structure 변경 시 | pass-through abstraction, mixed responsibility, side-effect leakage |
| [`jhste-db-api-boundary`](skills/jhste-db-api-boundary/SKILL.md)<br>API route, service, repository, SQL 사이의 책임 경계와 데이터 계약을 점검하는 boundary 스킬 | API, controller, service, repository, SQL, persistence code를 만질 때 | fat route, unsafe SQL, missing auth/data scoping, leaky DTO |
| [`jhste-crawler-automation`](skills/jhste-crawler-automation/SKILL.md)<br>crawler, scraper, worker, scheduler의 producer/consumer seam과 side effect를 점검하는 자동화 스킬 | crawler, scraper, worker, scheduler, browser automation을 만질 때 | fragile automation, unclear producer/consumer boundary, hidden side effect |
| [`jhste-red-team-review`](skills/jhste-red-team-review/SKILL.md)<br>완료 선언 전 변경 코드를 공격적으로 재검토하는 read-only red-team code review 스킬 | non-trivial code work 완료 선언 전 | premature “done”, 놓치기 쉬운 null/auth/env/write/API/performance risk |

## Bundled workflow skills

Normal install은 Matt Pocock의 [`mattpocock/skills`](https://github.com/mattpocock/skills)에서 vendoring한 workflow skills 14개도 함께 설치합니다. 이 스킬들은 debugging, planning, architecture, issue workflow, prototyping, handoff 작업에 유용합니다. 설치하고 싶지 않다면 `--skill-set core`를 사용하세요.

| Skill | 언제 쓰나 |
|---|---|
| [`diagnose`](skills/diagnose/SKILL.md)<br>재현, 축소, 가설, 계측, 수정, 회귀 확인을 강제하는 진단 루프 스킬 | hard bug 또는 performance regression을 체계적으로 진단할 때 |
| [`diagnosing-bugs`](skills/diagnosing-bugs/SKILL.md)<br>빠른 pass/fail feedback loop를 중심으로 원인을 좁혀가는 debugging 스킬 | reproduce → minimise → hypothesise → instrument → fix 루프가 필요할 때 |
| [`grill-me`](skills/grill-me/SKILL.md)<br>계획이나 설계의 빈틈이 사라질 때까지 집요하게 질문하는 스킬 | agent가 계획이나 설계를 명확해질 때까지 질문하게 하고 싶을 때 |
| [`grill-with-docs`](skills/grill-with-docs/SKILL.md)<br>질문 과정에서 도메인 용어와 의사결정을 문서화하는 설계 검증 스킬 | 질문 과정에서 project vocabulary와 docs/ADR까지 함께 정리하고 싶을 때 |
| [`grilling`](skills/grilling/SKILL.md)<br>구현 전에 계획과 설계를 압박 질문으로 검증하는 일반 grilling 스킬 | 일반적인 plan/design stress-test 질문 루프가 필요할 때 |
| [`domain-modeling`](skills/domain-modeling/SKILL.md)<br>프로젝트의 용어, 도메인 모델, architectural decision을 선명하게 만드는 스킬 | domain term, ubiquitous language, architectural decision을 다듬을 때 |
| [`codebase-design`](skills/codebase-design/SKILL.md)<br>deep module, 작은 interface, 명확한 seam을 설계하기 위한 코드베이스 설계 스킬 | 더 나은 module interface, seam, testability vocabulary가 필요할 때 |
| [`improve-codebase-architecture`](skills/improve-codebase-architecture/SKILL.md)<br>얕은 모듈과 결합도를 찾아 더 깊은 모듈로 개선할 기회를 찾는 아키텍처 스킬 | deepening opportunity를 찾고 architectural friction을 줄이고 싶을 때 |
| [`prototype`](skills/prototype/SKILL.md)<br>본 구현 전에 throwaway prototype으로 로직이나 UI 방향을 검증하는 스킬 | approach를 확정하기 전에 throwaway logic/UI prototype을 만들고 싶을 때 |
| [`to-prd`](skills/to-prd/SKILL.md)<br>대화 내용을 제품 요구사항 문서로 구조화하는 PRD 작성 스킬 | 대화 context를 PRD로 정리하고 싶을 때 |
| [`to-issues`](skills/to-issues/SKILL.md)<br>계획을 독립적으로 작업 가능한 vertical-slice issue로 나누는 스킬 | plan을 독립적으로 처리 가능한 implementation issue로 나누고 싶을 때 |
| [`triage`](skills/triage/SKILL.md)<br>issue를 역할과 상태 기반 workflow로 분류하고 다음 행동을 정하는 triage 스킬 | issue를 structured triage workflow로 처리하고 싶을 때 |
| [`handoff`](skills/handoff/SKILL.md)<br>다음 agent나 다음 세션이 이어받을 수 있도록 맥락을 압축하는 handoff 스킬 | 다른 agent나 session이 이어받을 수 있도록 context를 압축할 때 |
| [`write-a-skill`](skills/write-a-skill/SKILL.md)<br>새로운 agent skill을 올바른 구조와 progressive disclosure 방식으로 작성하는 스킬 | agent skill을 새로 만들거나 다듬고 싶을 때 |

## Attribution: Matt Pocock skills

이 레포는 위에 나열된 14개 skills를 Matt Pocock의 [`mattpocock/skills`](https://github.com/mattpocock/skills)에서 vendoring합니다.

해당 skills는 upstream MIT License에 따라 vendoring되어 있습니다. 이 레포는 필요한 copyright/license notice를 보존하고, 가져온 source를 기록합니다.

- Upstream: [`mattpocock/skills`](https://github.com/mattpocock/skills)
- License: MIT
- Attribution: [`vendor/matt-pocock/NOTICE.md`](vendor/matt-pocock/NOTICE.md)
- Upstream license copy: [`vendor/matt-pocock/LICENSE`](vendor/matt-pocock/LICENSE)
- Allowlist: [`vendor/matt-pocock/allowlist.json`](vendor/matt-pocock/allowlist.json)
- Source lock: [`vendor/matt-pocock/source-lock.json`](vendor/matt-pocock/source-lock.json)

별도 검토 없이 allowlist 밖의 vendored skill을 추가하지 마세요. Vendored copy를 업데이트할 때는 source lock을 갱신하고 diff를 검토해야 합니다.

## CLI commands

```bash
jhste-skills install
jhste-skills connect
jhste-skills guard
jhste-skills deep-scan
jhste-skills tune
jhste-skills baseline
jhste-skills sync
jhste-skills update
jhste-skills hooks
jhste-skills uninstall
```

자세한 command behavior는 [`docs/CLI.md`](docs/CLI.md)를 참고하세요.

## 권장 rollout

1. 기본 설치를 실행하고 advisory workflow를 먼저 dogfood합니다.
2. 처음에는 advisory hook을 유지합니다. commit-time check를 원하지 않으면 `--skip-hooks`를 사용하고, blocking mode는 noise와 false positive를 충분히 확인한 뒤 켭니다.
3. 기본 300-line advisory limit을 먼저 사용합니다. warning-level hook enforcement를 팀이 받아들일 준비가 되었을 때만 `--line-limit-mode blocking`을 사용합니다.
4. 코드 변경 중에는 `guard --scope changed --format text --fail-on error`를 수동으로 실행합니다.
5. non-trivial code change 전에는 `jhste-engineering-judgment`로 scope, seam, failure path, data contract, assumption, 각 changed class/module/function의 main responsibility를 확인합니다.
6. non-trivial code work 완료 선언 전에는 `jhste-red-team-review`를 사용합니다. docs-only, comment-only, formatting-only, trivial rename-only 변경은 건너뜁니다.
7. fix + re-review는 최대 두 번까지만 반복하고, 무한 review loop 대신 남은 risk를 보고합니다.
8. 기존 debt를 검토한 뒤에만 baseline을 생성합니다. Baseline은 known-issues ledger로 취급하고, scanner failure를 숨기는 용도가 아니라 new debt를 막는 ratchet 용도로 사용합니다.

## Repository layout

```text
skills/                 AI-readable skill guidance
rules/                  skills와 scan에서 사용하는 stable rule metadata
packs/                  core, web, API, database, crawler rule bundle
adapters/               Codex, Claude, generic adapter notes
cli/                    install, uninstall, deep-scan, guard, hooks, tune, baseline commands
vendor/matt-pocock/     Matt Pocock allowlist, source lock, license, attribution
examples/profile.yaml   default advisory profile example
```

## Verification

```bash
npm test
npm run public-safety:check
npm run vendor:check
npm run docs:check
```

Release acceptance notes는 [`docs/ACCEPTANCE_CHECK.md`](docs/ACCEPTANCE_CHECK.md)를 참고하세요.

## 철학

`jhste-skills`는 agent에게 더 많은 권한을 주기 위한 도구가 아닙니다. 빠른 agent가 더 신뢰할 수 있게 일하도록 만드는 도구입니다.

- 무조건 동의하지 않습니다.
- local project authority를 덮어쓰지 않습니다.
- 변경 범위를 작게 유지합니다.
- SRP 관점에서 responsibility boundary를 이름 붙입니다.
- failure를 observable하게 만듭니다.
- automated guard output을 proof가 아니라 evidence로 취급합니다.
- non-trivial work를 완료라고 말하기 전에 red-team code review를 수행합니다.

빠른 agent에는 guardrail이 필요합니다. `jhste-skills`는 agent에게 repo-respecting engineering workflow를 제공합니다.
