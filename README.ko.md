# jhste-skills

Languages: [English](README.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md)

AI 코딩 에이전트가 설정한 코딩 기준을 일관되게 따르도록 만드는 설치형 작업 규칙 세트입니다.

`jhste-skills`는 Codex, Claude Code 같은 AI 코딩 에이전트에게 공통된 엔지니어링 작업 루프를 제공합니다. 코드를 바꾸기 전에 전제를 확인하고, 레포의 기존 지침을 우선시하고, API/database/automation 경계를 지키고, SOLID-informed coding discipline과 design review lens를 적용하고, 변경 파일 guard를 실행하고, 완료를 선언하기 전에 red-team code review를 거치도록 돕습니다. guard finding은 자동 SOLID 증명이 아니라 review candidate이며, 완료 보고는 current proof, 실행하지 않은 check, residual risk를 분리해야 합니다.

## 여기서 SOLID가 의미하는 것

여기서 SOLID는 concrete maintenance/failure risk를 찾는 설계 리뷰 렌즈이며, 자동 준수 체크리스트나 추상화 트리거가 아닙니다.

- **S — Single Responsibility:** 변경된 함수, 모듈, 클래스는 하나의 주 역할과 하나의 주 변경 이유를 가져야 합니다.
- **O — Open/Closed:** 새 variant, provider, policy를 추가할 때 핵심 분기문을 계속 고쳐야 한다면 실제 extension boundary가 필요한지 검토합니다.
- **L — Liskov Substitution:** 구현체는 반환 형태, null 가능성, 에러, side effect, 문서화된 동작에 대한 caller 기대를 약화시키면 안 됩니다.
- **I — Interface Segregation:** caller가 작은 안정적 일부만 필요한데 거대한 config, interface, props 객체에 의존하지 않게 합니다.
- **D — Dependency Inversion:** high-level policy가 DB, API, browser, filesystem, email, payment, queue 같은 구체 side effect에 강하게 묶이지 않도록 하고, 필요한 경우 의도적이고 보이는 boundary로 둡니다.

이 도구는 프로젝트를 장악하지 않습니다. 레포 안의 `AGENTS.md`, `CLAUDE.md`, docs가 항상 우선입니다. 기본 설정은 advisory 모드이며, marker-managed 방식으로 동작하고, 부담 없이 시도할 수 있도록 설계되어 있습니다.

스킬은 필요한 상황에서 에이전트가 자동으로 사용하도록 설계되어 있습니다. 예를 들어 API 코드를 수정하면 API/database boundary 스킬을, 완료 직전에는 red-team review 스킬을 사용하도록 안내합니다. 사용자가 직접 특정 스킬을 호출할 수도 있습니다. 예: `jhste-engineering-groundwork를 사용해서 이 변경 전제를 검토해줘`, `jhste-red-team-review로 이 diff를 리뷰해줘`.

## 왜 설치해야 하나요?

AI 코딩 에이전트는 빠르지만, 반복적으로 비슷한 방식으로 실패합니다.

- 불명확한 요구사항이나 틀린 전제를 조용히 받아들입니다.
- 도와주려다가 작업 범위를 과하게 넓힙니다.
- UI, route/controller, service, database, side effect 책임을 한곳에 섞거나, 실제 boundary 없는 추상화를 SOLID 명목으로 추가합니다.
- raw search result를 그대로 edit set으로 보고 broad cleanup/search-replace를 수행합니다.
- 실패를 숨기거나 위험한 로그를 남깁니다.
- 변경된 코드를 충분히 확인하기 전에 “완료”라고 말합니다.
- 머신이나 레포를 바꿀 때마다 레포별 규칙을 잊어버립니다.

`jhste-skills`는 이런 실패를 줄이기 위한 반복 가능한 작업 루프를 에이전트에게 제공합니다.

```text
non-trivial code change 전:
  목표, 전제, ownership boundary, data contract, failure path, final behavior predicate, SOLID-informed review lens 확인
  고정 체크리스트를 채우기보다 변경된 실행 경로에서 실제로 중요한 실패 모드를 맥락에 맞게 확인

수정 중:
  repo-local instructions를 권위로 취급

코드 변경 후:
  가능한 경우 빠른 changed-file guard 실행

“완료”라고 말하기 전:
  read-only red-team code review를 실행하고 가능한 경우 actual consumer-path proof 확인

warning이 나오면:
  bounded fix를 시도하고, 다시 확인한 뒤, 무한 루프에 빠지지 않고 멈춤
```

기대하는 결과는 더 작은 diff, 더 명확한 SOLID-informed boundary, 더 안전한 API/database 코드, 더 적은 silent assumption, 더 안전한 cleanup/search-replace 동작, 그리고 변경된 public behavior의 현재 증거에 기반한 더 솔직한 완료 보고입니다.

## 누가 설치하면 좋나요?

다음에 해당한다면 `jhste-skills`를 설치할 가치가 있습니다.

- Codex, Claude Code 또는 다른 coding agent를 여러 레포에서 사용합니다.
- non-trivial code change 전에 에이전트가 전제를 확인하길 원합니다.
- 기존 repo docs가 계속 권위로 남길 원합니다.
- 커밋 전 또는 완료 선언 전에 가벼운 advisory check를 두고 싶습니다.
- SOLID-informed coding discipline, API/database boundary, safe logging, input validation, cleanup safety, side effect, automation reliability를 중요하게 봅니다.
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
- `.jhste/profile.yaml`이 없으면 생성합니다. `--force`는 generated/managed profile만 refresh하며, modified profile overwrite는 `--force --allow-profile-overwrite`가 필요합니다.
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

이 저장소를 최신으로 당긴 뒤 프로젝트 bridge, profile, hook, scan output은 건드리지 않고 설치된 skill 파일만 새로고침하려면:

```bash
jhste-skills update --yes --skills-only
```

선택적으로 repo-wide advisory scan을 실행하려면:

```bash
jhste-skills deep-scan
```

managed output을 제거하려면:

```bash
jhste-skills uninstall --yes --repo /path/to/repo
```

`uninstall`은 managed hook, marker-managed bridge block, manifest-managed skill directory를 제거합니다. non-managed file은 건드리지 않습니다. `.jhste/profile.yaml`은 current 또는 legacy generated shape일 때만 제거하며, 수정된 profile을 제거하려면 내용을 검토한 뒤 `--force-profile`을 명시해야 합니다.

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
- 완료 전 리뷰는 가능한 경우 actual consumer-path proof를 선호하고 current proof, skipped check, not-run check, residual risk를 분리해야 합니다.
- cleanup/search-replace 작업은 쓰기 전에 editable path와 protected evidence/history-like path를 분리해야 합니다.
- guard runtime/config failure는 rule violation과 별도로 보고해야 합니다.
- install/update/uninstall flow는 non-managed hook, bridge text, skill directory를 건드리지 않습니다.

## Core jhste skills

아래는 jhste가 작성한 guardrail skills입니다. 기본 bundled skill set의 일부로 설치되며, `--skill-set core`를 사용하면 이 core skills만 설치할 수 있습니다.

| Skill | 언제 쓰나 | 무엇을 줄여주나 |
|---|---|---|
| [`setup`](skills/setup/SKILL.md)<br>설치, 연결, 업데이트가 기존 프로젝트 지침을 덮어쓰지 않도록 하는 안전 설치 스킬 | kit를 설치하거나 레포에 연결할 때 | unsafe overwrite, unmanaged hook conflict, repo instruction replacement |
| [`jhste-engineering-groundwork`](skills/jhste-engineering-groundwork/SKILL.md)<br>코드 변경 전 목표, 전제, scope, boundary, failure path, final behavior predicate를 검증하는 pre-change groundwork 스킬 | non-trivial code change 전 | blind agreement, scope creep, unverified assumption, unclear boundary |
| [`jhste-code-quality`](skills/jhste-code-quality/SKILL.md)<br>입력 검증, 관측 가능한 실패 처리, secret-safe logging, oversized-file review 스킬 | external input, failure handling, logging, env/config, cleanup/search-replace, code-quality review path를 만질 때 | unvalidated input, silent failure, secret logging, unsafe broad cleanup, oversized file |
| [`jhste-architecture-review`](skills/jhste-architecture-review/SKILL.md)<br>모듈 경계, side effect 위치, SOLID-informed design risk를 검토하는 아키텍처 리뷰 스킬 | module boundary, app structure, side-effect placement, responsibility split 변경 시 | pass-through abstraction, mixed responsibility, side-effect leakage |
| [`jhste-db-api-boundary`](skills/jhste-db-api-boundary/SKILL.md)<br>API route, service, repository, SQL 사이의 책임 경계와 데이터 계약을 점검하는 boundary 스킬 | API, controller, service, repository, SQL, persistence code를 만질 때 | fat route, unsafe SQL, missing auth/data scoping, leaky DTO |
| [`jhste-crawler-automation`](skills/jhste-crawler-automation/SKILL.md)<br>crawler, scraper, worker, scheduler의 producer/consumer boundary와 side effect를 점검하는 자동화 스킬 | crawler, scraper, worker, scheduler, browser automation을 만질 때 | fragile automation, unclear producer/consumer boundary, hidden side effect |
| [`jhste-red-team-review`](skills/jhste-red-team-review/SKILL.md)<br>완료 선언 전 변경 코드를 공격적으로 재검토하는 read-only red-team code review 스킬 | non-trivial code work 완료 선언 전 | premature “done”, missing consumer-path proof, 놓치기 쉬운 null/auth/env/write/API/performance risk |
| [`jhste-long-running-work-loop`](skills/jhste-long-running-work-loop/SKILL.md)<br>세션, 대기 상태, durable decision 사이의 작업 상태를 보존하는 좁은 orchestration 스킬 | 상태 손실이 잘못된 작업, 중복 작업, unsafe resume, 재개 어려움으로 이어질 수 있을 때: 여러 세션 작업, 반복 리뷰, 당일 또는 다일 외부 대기 상태, 여러 repo 영향, PRD→issue→구현→리뷰 흐름, durable decision | lost context, stale scratchpad, unclear approval boundary, unsafe resume point |

## Bundled workflow skills

Normal install은 Matt Pocock의 [`mattpocock/skills`](https://github.com/mattpocock/skills)에서 vendoring한 workflow skills 13개도 함께 설치합니다. 이 스킬들은 debugging, planning, architecture, issue workflow, prototyping, handoff 작업에 유용합니다. 설치하고 싶지 않다면 `--skill-set core`를 사용하세요.

| Skill | 언제 쓰나 |
|---|---|
| [`diagnosing-bugs`](skills/diagnosing-bugs/SKILL.md)<br>빠른 pass/fail feedback loop를 중심으로 원인을 좁혀가는 debugging 스킬 | reproduce → minimise → hypothesise → instrument → fix 루프가 필요할 때 |
| [`grill-me`](skills/grill-me/SKILL.md)<br>사용자 자신의 계획/추론을 공격적으로 질문하는 direct grilling 스킬 | grilled, challenged, pressure-tested, aggressive questioning을 원할 때 |
| [`grill-with-docs`](skills/grill-with-docs/SKILL.md)<br>grilling 결과를 CONTEXT.md나 ADR에 기록하는 스킬 | stress-test와 documentation, ADR, glossary, CONTEXT update를 함께 원할 때 |
| [`grilling`](skills/grilling/SKILL.md)<br>docs write 없이 계획/설계를 pressure-test하는 read-only grilling 스킬 | challenge, pressure-test, red-team, grill, gap finding을 원할 때 |
| [`domain-modeling`](skills/domain-modeling/SKILL.md)<br>프로젝트의 용어, 도메인 모델, architectural decision을 선명하게 만드는 스킬 | domain term, ubiquitous language, architectural decision을 다듬을 때 |
| [`codebase-design`](skills/codebase-design/SKILL.md)<br>deep module, 작은 interface, 명확한 boundary를 설계하기 위한 코드베이스 설계 스킬 | 더 나은 module interface, boundary, testability vocabulary가 필요할 때 |
| [`improve-codebase-architecture`](skills/improve-codebase-architecture/SKILL.md)<br>얕은 모듈과 결합도를 찾아 더 깊은 모듈로 개선할 기회를 찾는 아키텍처 스킬 | deepening opportunity를 찾고 architectural friction을 줄이고 싶을 때 |
| [`prototype`](skills/prototype/SKILL.md)<br>logic/state model이나 UI direction을 throwaway local code로 검증하는 스킬 | prototype, mock up, try designs, sanity-check, “let me play with it” 요청 시 |
| [`to-prd`](skills/to-prd/SKILL.md)<br>PRD draft를 작성하고 프로젝트 PRD workflow에 맞게 준비하는 스킬 | PRD가 필요할 때; tracker publish는 직접 요청이나 repo approval이 있을 때 |
| [`to-issues`](skills/to-issues/SKILL.md)<br>계획을 issue-ready vertical slice로 나누는 스킬 | implementation ticket/work breakdown이 필요할 때; tracker creation은 직접 요청이나 repo approval이 있을 때 |
| [`triage`](skills/triage/SKILL.md)<br>issue를 분류하고 다음 행동을 계획하는 triage 스킬 | issue classification, next-action planning, repo-approved triage write가 필요할 때 |
| [`handoff`](skills/handoff/SKILL.md)<br>다음 agent나 session이 이어받을 수 있도록 context를 압축하는 handoff 스킬 | handoff, session summary, continuation brief, next-agent context 요청 시 |
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
5. non-trivial code change 전에는 `jhste-engineering-groundwork`로 scope, boundary, failure path, data contract, assumption, changed class/module/function의 SOLID-informed review lens를 확인합니다.
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
- SOLID-informed coding discipline을 clean-code review lens로 사용해 responsibility를 이름 붙이고, maintenance/failure risk가 있는 extension boundary, caller contract, interface 크기, concrete dependency 방향을 검토합니다.
- failure를 observable하게 만듭니다.
- automated guard output을 proof가 아니라 evidence로 취급합니다.
- non-trivial work를 완료라고 말하기 전에 red-team code review를 수행합니다.

빠른 agent에는 guardrail이 필요합니다. `jhste-skills`는 agent에게 repo-respecting engineering workflow를 제공합니다.
