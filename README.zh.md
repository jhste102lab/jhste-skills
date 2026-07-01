# jhste-skills

Languages: [English](README.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md)

> 本文档为翻译版本。权威来源以 [README.md](README.md) 为准；个人化拓扑改版后，翻译可能滞后。

一套可安装的工作规则工具包，帮助 AI 编程代理稳定遵循你设定的工程标准。

`jhste-skills` 为 Codex、Claude Code 等 AI 编程代理提供一套共享的工程工作流。它帮助代理在修改代码前验证前提，优先遵循仓库本地说明，保持 API/database/automation 边界清晰，应用 SOLID-informed coding discipline 和 design review lens，运行 changed-file guard，并在声明完成前执行 red-team code review。guard finding 是 review candidate，不是自动 SOLID 证明。

## 这里的 SOLID 是什么意思

这里的 SOLID 是设计 review lens，不是自动合规检查表。

- **S — Single Responsibility:** 被修改的 function、module、class 应该有一个主要职责和一个主要变更理由。
- **O — Open/Closed:** 如果每次新增 variant、provider、policy 都要反复修改 core branching，就要检查是否需要真实的 extension boundary。
- **L — Liskov Substitution:** implementation 不应削弱 caller 对 return shape、nullability、error、side effect 或已文档化行为的期待。
- **I — Interface Segregation:** caller 只需要小而稳定的一部分时，不应依赖过大的 config、interface 或 props object。
- **D — Dependency Inversion:** high-level policy 不应强绑定到 DB、API、browser、filesystem、email、payment、queue 等 concrete side effect；必要时应通过有意图且可见的 boundary 暴露。

这个工具不会接管你的项目。仓库内的 `AGENTS.md`、`CLAUDE.md` 和 docs 始终是权威来源。默认设置是 advisory 模式，使用 marker-managed 方式管理变更，设计目标是低风险、容易试用。

Skills 设计为在需要时由代理自动使用。例如，代理修改 API 代码时会被引导使用 API/database boundary skill；在完成前会被引导使用 red-team review skill。你也可以直接调用某个 skill，例如：`use jhste-preflight to review this change premise`，或 `run jhste-redteam on this diff`。

## 为什么要安装？

AI 编程代理很快，但经常以可预测的方式失败：

- 默默接受不清晰的需求或错误前提。
- 为了“帮忙”而扩大修改范围。
- 把 UI、route/controller、service、database、side effect 职责混在一个地方，或以 SOLID 为名加入没有真实 boundary 的抽象。
- 隐藏失败，或产生不安全的日志。
- 在变更代码尚未检查前就说“完成”。
- 当你切换机器或仓库时，忘记仓库特定规则。

`jhste-skills` 为代理提供一个可重复的工作循环，减少这些失败：

```text
在 non-trivial code change 前：
  检查目标、前提、ownership boundary、data contract、failure path、SOLID-informed review lens
  不填写固定 checklist，而是根据 changed execution path 找出真正重要的 failure mode

修改过程中：
  将 repo-local instructions 视为权威

代码修改后：
  在可用时运行快速 changed-file guard

在说“完成”前：
  运行 read-only red-team code review

如果出现 warning：
  尝试 bounded fix，重新检查，然后停止，避免无限循环
```

预期结果是更小的 diff、更清晰的 SOLID-informed boundary、更安全的 API/database 代码、更少的 silent assumption，以及更诚实的完成报告。

## 谁适合安装？

如果你符合以下情况，`jhste-skills` 值得安装：

- 在多个仓库中使用 Codex、Claude Code 或其他 coding agent；
- 希望代理在 non-trivial code change 前验证前提；
- 希望现有 repo docs 继续作为权威来源；
- 希望在提交前或声明完成前加入轻量 advisory check；
- 重视 SOLID-informed coding discipline、API/database boundary、safe logging、input validation、side effect、automation reliability；
- 希望在不同机器和仓库之间快速恢复相同的 AI 编程工作习惯。

如果你只想要一个 prompt 文件，或希望安装后立即启用 strict CI enforcement，或不想生成 `.jhste/` 文件和 bridge block，或期待这个工具自动重构代码，那它可能不适合你。

## 快速开始

```bash
npx jhste-skills install
```

也可以用 npm 全局安装 CLI，然后在任意仓库中使用。

```bash
npm install -g jhste-skills
jhste-skills install
```

如果只想临时运行一次，请使用 `npx`。如果希望把 `jhste-skills` 作为常用 shell 命令，请使用 `npm install -g`。

### Global setup（Codex + Claude Code + OpenCode，advisory-only）

如果你希望在所有仓库中使用 skills，但不写入每个仓库的文件或 git hooks，可以在用户级别设置一次：

```bash
npm install -g jhste-skills
jhste-skills global
```

该命令会把 skills 和 shared companion resources 复制到 `~/.jhste/skills`，并在每个 agent 的 global instruction file（`~/.claude/CLAUDE.md`、`~/.codex/AGENTS.md`、`~/.config/opencode/AGENTS.md`）中写入 marker-managed bridge block；文件不存在时会创建。它不会写入 git hooks 或每仓库文件；guard 保持 advisory（`jhste-skills guard --scope changed`）。可用 `--agents codex,claude,opencode` 选择 agent，用 `jhste-skills global --uninstall` 移除。

完成这一次 global setup 后，之后运行 `npm update -g jhste-skills` 会安全刷新 managed skill copies 和已有 managed global bridge blocks。只有在需要更改 agent 或选项时才重新运行 `jhste-skills global`。

默认安装使用 Normal mode。

- 安装全部 bundled skills：jhste core skills + vendored workflow skills。
- 如果缺失，则创建 `.jhste/profile.yaml`。`--force` 只刷新 generated/managed profile；modified profile 需要 `--force --allow-profile-overwrite`。
- 启用 project guidance 时，在 `AGENTS.md` 或 `CLAUDE.md` 中添加或刷新 marker-managed bridge block。
- 在安全时安装 advisory pre-commit hook。
- 不修改 CI、目标仓库的 `package.json`、lockfile 或 source code。

连接另一个仓库：

```bash
cd /path/to/another-repo
jhste-skills connect
```

只安装 jhste core guardrail skills：

```bash
npx jhste-skills install --skill-set core
```

手动运行 changed-file guard：

```bash
jhste-skills guard --scope changed --format text --fail-on error
```

拉取本仓库最新内容后，如果只想刷新已安装的 skill 文件，不触碰项目 bridge、profile、hook 或 scan output：

```bash
jhste-skills update --yes --skills-only
```

选择性运行 repo-wide advisory scan：

```bash
jhste-skills deep-scan
```

移除 managed outputs：

```bash
jhste-skills uninstall --yes --repo /path/to/repo
```

`uninstall` 会移除 managed hook、marker-managed bridge block 和 manifest-managed skill directory。它不会触碰 non-managed file。只有当 `.jhste/profile.yaml` 仍然匹配 current 或 legacy generated shape 时才会删除；如果 profile 已被修改，请先审查内容，再显式使用 `--force-profile`。

## 安装模式

```text
Minimal  - 只安装 jhste core skills；不创建 project file 或 hook
Normal   - 推荐默认值；all bundled skills + project profile/bridge + advisory pre-commit hook
Full     - all bundled skills + profile/bridge + advisory pre-commit/pre-push hooks + deep scan
Custom   - 通过面向效果的问题自定义安装范围
```

`Full` 也遵守 safety contract。它不会覆盖 non-managed hook、source file、CI、`package.json` 或 lockfile，也不会启用 strict mode。Interactive Full mode 只询问自动检查行为：warning only、commit-time block，或 commit/push-time block。除非显式传入 `--hooks blocking`，否则 `--yes` 使用 warning-only。

## Safety contract

`jhste-skills` 默认安全：

- repo-local `AGENTS.md`、`CLAUDE.md` 和 docs 始终是权威；
- 用户的显式指令决定任务 scope，但不会悄悄绕过已经验证的 safety/privacy/data-loss/repo-architecture constraint；
- 默认安装不修改 CI；
- 默认安装不修改目标 `package.json` 或 lockfile；
- 默认安装不会自动重构 source code；
- managed hook 默认是 advisory；
- strict mode 需要显式 opt-in；
- bridge block 使用 `<!-- jhste-skills:start -->` / `<!-- jhste-skills:end -->` marker；
- guard output 是 review evidence，不是 proof；
- guard runtime/config failure 必须与 rule violation 分开报告；
- install/update/uninstall flow 不触碰 non-managed hook、bridge text 或 skill directory。

## Core jhste skills

以下是 jhste 编写的 guardrail skills。它们默认作为 bundled skill set 的一部分安装。使用 `--skill-set core` 可以只安装这些 core skills。

| Skill | 何时使用 | 帮助减少什么 |
|---|---|---|
| [`setup`](skills/setup/SKILL.md)<br>安全安装 skill，避免 install/connect/update 覆盖现有项目说明 | 安装 kit 或连接仓库时 | Unsafe overwrite, unmanaged hook conflict, repo instruction replacement |
| [`ask-jhste`](skills/ask-jhste/SKILL.md)<br>用于选择正确 jhste skill 或 workflow 的 user-invoked router | 不确定下一步该用哪个 jhste skill/workflow 时 | Wrong workflow selection, unnecessary always-on context, accidental side effects from routing |
| [`jhste-preflight`](skills/jhste-preflight/SKILL.md)<br>pre-change groundwork skill，在改代码前验证目标、前提、scope、boundary 和 failure path | non-trivial code change 前 | Blind agreement, scope creep, unverified assumption, unclear boundary |
| [`jhste-change-review`](skills/jhste-change-review/SKILL.md)<br>检查 input validation、observable failure handling、secret-safe logging 和 oversized-file review 的 skill | 触及 external input、failure handling、logging、env/config 或 code-quality review path 时 | Unvalidated input, silent failure, secret logging, oversized file |
| [`jhste-change-review`](skills/jhste-change-review/SKILL.md)<br>检查 module boundary、side-effect placement 和 SOLID-informed design risk 的架构 review skill | 修改 module boundary、app structure、side-effect placement 或 responsibility split 时 | Pass-through abstraction, mixed responsibility, side-effect leakage |
| [`jhste-db-api-boundary`](skills/jhste-db-api-boundary/SKILL.md)<br>检查 API route、service、repository、SQL 之间职责和 data contract 的 boundary skill | 修改 API、controller、service、repository、SQL、persistence code 时 | Fat route, unsafe SQL, missing auth/data scoping, leaky DTO |
| [`jhste-crawler-automation`](skills/jhste-crawler-automation/SKILL.md)<br>检查 crawler/scraper/worker/scheduler 的 producer-consumer boundary 和 side effect 的 automation skill | 修改 crawler、scraper、worker、scheduler、browser automation 时 | Fragile automation, unclear producer/consumer boundary, hidden side effect |
| [`jhste-redteam`](skills/jhste-redteam/SKILL.md)<br>read-only red-team code review skill，在完成前主动攻击性复查变更代码 | non-trivial code work 完成声明前 | Premature “done”, missed null/auth/env/write/API/performance risk |
| [`jhste-workstate`](skills/jhste-workstate/SKILL.md)<br>用于在 session、等待状态和 durable decision 间保留工作状态的窄 orchestration skill | 状态丢失可能导致错误、重复、不安全或难以恢复的工作时：多会话工作、重复 review、当天或多天外部等待状态、多 repo 影响、PRD→issue→implementation→review 流程或 durable decision | Lost context, stale scratchpad, unclear approval boundary, unsafe resume point |

## Bundled workflow skills

Normal install 还会安装 14 个从 Matt Pocock 的 [`mattpocock/skills`](https://github.com/mattpocock/skills) vendoring 的 workflow skills。它们适用于 implementation、debugging、planning、architecture、issue workflow、prototyping、handoff 和 skill-writing guidance。若不想安装它们，请使用 `--skill-set core`。

| Skill | 何时使用 |
|---|---|
| [`diagnosing-bugs`](skills/diagnosing-bugs/SKILL.md)<br>围绕快速 pass/fail feedback loop 缩小 root cause 的 debugging skill | 需要 reproduce → minimise → hypothesise → instrument → fix 循环时 |
| [`grill-me`](skills/grill-me/SKILL.md)<br>直接、个人化地挑战用户计划或推理的 grilling skill | 需要被 grilled、challenged、pressure-tested 或 aggressive questioning 时 |
| [`grill-with-docs`](skills/grill-with-docs/SKILL.md)<br>在 grilling 后把 domain terms 和 decisions 记录到 CONTEXT.md 或 ADR 的 skill | 需要 stress-test 加 documentation、ADR、glossary 或 CONTEXT update 时 |
| [`grilling`](skills/grilling/SKILL.md)<br>不写 docs 的 read-only plan/design pressure-test grilling skill | 需要 challenge、pressure-test、red-team、grill 或 find gaps 时 |
| [`domain-modeling`](skills/domain-modeling/SKILL.md)<br>让项目术语、domain model、architectural decision 更清晰的 skill | 调整 domain term、ubiquitous language、architectural decision 时 |
| [`codebase-design`](skills/codebase-design/SKILL.md)<br>用于 deep module、小 interface、清晰 boundary 的代码库设计 skill | 需要更好的 module interface、boundary、testability vocabulary 时 |
| [`improve-codebase-architecture`](skills/improve-codebase-architecture/SKILL.md)<br>发现 shallow module 和 coupling，并寻找 deepening opportunity 的架构 skill | 想寻找 deepening opportunity 并减少 architectural friction 时 |
| [`prototype`](skills/prototype/SKILL.md)<br>用 throwaway local code 验证 logic/state model 或 UI direction 的 skill | 请求 prototype、mock up、try designs、sanity-check 或 “let me play with it” 时 |
| [`to-prd`](skills/to-prd/SKILL.md)<br>起草 PRD 并准备进入项目正常 PRD workflow 的 skill | 需要 PRD；tracker publish 只在直接请求或 repo approval 时进行 |
| [`to-issues`](skills/to-issues/SKILL.md)<br>把计划拆成 issue-ready vertical slices 的 skill | 需要 implementation tickets/work breakdown；tracker creation 需直接请求或 repo approval |
| [`triage`](skills/triage/SKILL.md)<br>分类 issue 并规划下一步行动的 triage skill | 需要 issue classification、next-action planning 或 repo-approved triage writes 时 |
| [`handoff`](skills/handoff/SKILL.md)<br>压缩 context，让下一个 agent 或 session 能继续工作的 handoff skill | 请求 handoff、session summary、continuation brief 或 next-agent context 时 |
| [`implement`](skills/implement/SKILL.md)<br>使用 jhste groundwork、verification、guard、review 的 scoped PRD/issue/spec implementation workflow skill | 想从 PRD、issue、spec 或 handoff 实现 focused work 时 |
| [`writing-great-skills`](skills/writing-great-skills/SKILL.md)<br>关于 predictable invocation、progressive disclosure、context load control、pruning 的 skill-writing reference | 想创建、替换或改进 agent skill 时 |

## Attribution: Matt Pocock skills

本仓库从 Matt Pocock 的 [`mattpocock/skills`](https://github.com/mattpocock/skills) vendoring 了上面列出的 14 个 skills。

这些 skills 按 upstream MIT License vendoring。本仓库保留所需 copyright/license notice，并记录导入来源。

- Upstream: [`mattpocock/skills`](https://github.com/mattpocock/skills)
- License: MIT
- Attribution: [`vendor/matt-pocock/NOTICE.md`](vendor/matt-pocock/NOTICE.md)
- Upstream license copy: [`vendor/matt-pocock/LICENSE`](vendor/matt-pocock/LICENSE)
- Allowlist: [`vendor/matt-pocock/allowlist.json`](vendor/matt-pocock/allowlist.json)
- Source lock: [`vendor/matt-pocock/source-lock.json`](vendor/matt-pocock/source-lock.json)

未经单独审查，不要添加 allowlist 外的 vendored skill。更新 vendored copy 时，必须刷新 source lock 并审查 diff。

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

详细 command behavior 请参考 [`docs/CLI.md`](docs/CLI.md)。

## 推荐 rollout

1. 先运行默认安装，并 dogfood advisory workflow。
2. 一开始保留 advisory hook。如果不想要 commit-time check，使用 `--skip-hooks`；只有在充分检查 noise 和 false positive 后才启用 blocking mode。
3. 先使用默认 300-line advisory limit。只有团队准备接受 warning-level hook enforcement 时，才使用 `--line-limit-mode blocking`。
4. 修改代码时，手动运行 `guard --scope changed --format text --fail-on error`。
5. non-trivial code change 前，用 `jhste-preflight` 检查 scope、boundary、failure path、data contract、assumption，以及 changed class/module/function 的 SOLID-informed review lens。
6. non-trivial code work 完成声明前，使用 `jhste-redteam`。跳过 docs-only、comment-only、formatting-only、trivial rename-only 变更。
7. fix + re-review 最多重复两轮，然后报告剩余 risk，避免无限循环。
8. 只有在审查 existing debt 后才创建 baseline。将 baseline 视为 known-issues ledger，用 ratchet 阻止 new debt，而不是隐藏 scanner failure。

## Repository layout

```text
skills/                 AI-readable skill guidance
rules/                  skills 和 scan 使用的 stable rule metadata
packs/                  core、web、API、database、crawler rule bundle
adapters/               Codex、Claude、generic adapter notes
cli/                    install、uninstall、deep-scan、guard、hooks、tune、baseline commands
vendor/matt-pocock/     Matt Pocock allowlist、source lock、license、attribution
examples/profile.yaml   default advisory profile example
```

## Verification

```bash
npm test
npm run public-safety:check
npm run vendor:check
npm run docs:check
```

Release acceptance notes 请参考 [`docs/ACCEPTANCE_CHECK.md`](docs/ACCEPTANCE_CHECK.md)。

## 哲学

`jhste-skills` 不是为了给 agent 更多权限。它是为了让快速的 agent 更可靠。

- 不盲目同意。
- 不覆盖 local project authority。
- 保持变更范围受控。
- 使用 SOLID-informed coding discipline 来命名 responsibility，并检查 extension boundary、caller contract、interface 大小和 concrete dependency 方向。
- 让 failure observable。
- 将 automated guard output 视为 evidence，而不是 proof。
- 在称 non-trivial work 完成前执行 red-team code review。

快速的 agent 需要 guardrail。`jhste-skills` 为它们提供 repo-respecting engineering workflow。

Skills 共享来自 `skills/_shared/` 的 cross-cutting doctrine（SOLID lens、evidence discipline、issue-candidate protocol、scope discipline）。`skills/` 下名称以 `_` 开头的目录是 shared companion resources，不是 skills：它们会从 skill listing、selection 和 missing-skill checks 中排除，但安装任何 skill 时都会一起复制，确保已安装 artifact 中的 cross-skill `../_shared/...` references 不会悬空。
