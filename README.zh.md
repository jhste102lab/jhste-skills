# jhste-skills

Languages: [English](README.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md)

一套可安装的工作规则工具包，帮助 AI 编程代理稳定遵循你设定的工程标准。

`jhste-skills` 为 Codex、Claude Code 等 AI 编程代理提供一套共享的工程工作流。它帮助代理在修改代码前验证前提，优先遵循仓库本地说明，保持 API/database/automation 边界清晰，从 SRP（Single Responsibility Principle，单一职责原则）的角度检查每个模块是否只有一个明确职责，运行 changed-file guard，并在声明完成前执行 red-team code review。

这个工具不会接管你的项目。仓库内的 `AGENTS.md`、`CLAUDE.md` 和 docs 始终是权威来源。默认设置是 advisory 模式，使用 marker-managed 方式管理变更，设计目标是低风险、容易试用。

Skills 设计为在需要时由代理自动使用。例如，代理修改 API 代码时会被引导使用 API/database boundary skill；在完成前会被引导使用 red-team review skill。你也可以直接调用某个 skill，例如：`use jhste-engineering-judgment to review this change premise`，或 `run jhste-red-team-review on this diff`。

## 为什么要安装？

AI 编程代理很快，但经常以可预测的方式失败：

- 默默接受不清晰的需求或错误前提。
- 为了“帮忙”而扩大修改范围。
- 把 UI、route/controller、service、database、side effect 职责混在一个地方，破坏“一个模块，一个职责”原则（SRP）。
- 隐藏失败，或产生不安全的日志。
- 在变更代码尚未检查前就说“完成”。
- 当你切换机器或仓库时，忘记仓库特定规则。

`jhste-skills` 为代理提供一个可重复的工作循环，减少这些失败：

```text
在 non-trivial code change 前：
  检查目标、前提、ownership seam、data contract、failure path、SRP 职责

修改过程中：
  将 repo-local instructions 视为权威

代码修改后：
  在可用时运行快速 changed-file guard

在说“完成”前：
  运行 read-only red-team code review

如果出现 warning：
  尝试 bounded fix，重新检查，然后停止，避免无限循环
```

预期结果是更小的 diff、更清晰的 SRP 边界、更安全的 API/database 代码、更少的 silent assumption，以及更诚实的完成报告。

## 谁适合安装？

如果你符合以下情况，`jhste-skills` 值得安装：

- 在多个仓库中使用 Codex、Claude Code 或其他 coding agent；
- 希望代理在 non-trivial code change 前验证前提；
- 希望现有 repo docs 继续作为权威来源；
- 希望在提交前或声明完成前加入轻量 advisory check；
- 重视 SRP、API/database boundary、safe logging、input validation、side effect、automation reliability；
- 希望在不同机器和仓库之间快速恢复相同的 AI 编程工作习惯。

如果你只想要一个 prompt 文件，或希望安装后立即启用 strict CI enforcement，或不想生成 `.jhste/` 文件和 bridge block，或期待这个工具自动重构代码，那它可能不适合你。

## 快速开始

```bash
npx jhste-skills install
```

默认安装使用 Normal mode。

- 安装全部 bundled skills：jhste core skills + vendored workflow skills。
- 如果缺失，则创建 `.jhste/profile.yaml`。
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

选择性运行 repo-wide advisory scan：

```bash
jhste-skills deep-scan
```

移除 managed outputs：

```bash
jhste-skills uninstall --yes --repo /path/to/repo
```

`uninstall` 会移除 managed hook、marker-managed bridge block 和 manifest-managed skill directory。它不会触碰 non-managed file。只有当 `.jhste/profile.yaml` 仍然匹配 generated shape 时才会删除；如果 profile 已被修改，请先审查内容，再显式使用 `--force-profile`。

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
| [`jhste-engineering-judgment`](skills/jhste-engineering-judgment/SKILL.md)<br>pre-change 判断 skill，在改代码前验证目标、前提、scope、seam 和 failure path | non-trivial code change 前 | Blind agreement, scope creep, unverified assumption, unclear seam |
| [`jhste-code-quality`](skills/jhste-code-quality/SKILL.md)<br>检查 input validation、observable failure handling、secret-safe logging 的代码质量 skill | 编写或 review application code 时 | Unvalidated input, silent failure, secret logging, oversized file |
| [`jhste-architecture-review`](skills/jhste-architecture-review/SKILL.md)<br>检查 module boundary、side-effect placement 和 SRP 风险的架构 review skill | 修改 module boundary 或 app structure 时 | Pass-through abstraction, mixed responsibility, side-effect leakage |
| [`jhste-db-api-boundary`](skills/jhste-db-api-boundary/SKILL.md)<br>检查 API route、service、repository、SQL 之间职责和 data contract 的 boundary skill | 修改 API、controller、service、repository、SQL、persistence code 时 | Fat route, unsafe SQL, missing auth/data scoping, leaky DTO |
| [`jhste-crawler-automation`](skills/jhste-crawler-automation/SKILL.md)<br>检查 crawler/scraper/worker/scheduler 的 producer-consumer seam 和 side effect 的 automation skill | 修改 crawler、scraper、worker、scheduler、browser automation 时 | Fragile automation, unclear producer/consumer boundary, hidden side effect |
| [`jhste-red-team-review`](skills/jhste-red-team-review/SKILL.md)<br>read-only red-team code review skill，在完成前主动攻击性复查变更代码 | non-trivial code work 完成声明前 | Premature “done”, missed null/auth/env/write/API/performance risk |

## Bundled workflow skills

Normal install 还会安装 14 个从 Matt Pocock 的 [`mattpocock/skills`](https://github.com/mattpocock/skills) vendoring 的 workflow skills。它们适用于 debugging、planning、architecture、issue workflow、prototyping 和 handoff。若不想安装它们，请使用 `--skill-set core`。

| Skill | 何时使用 |
|---|---|
| [`diagnose`](skills/diagnose/SKILL.md)<br>强制执行 reproduce、minimize、hypothesize、instrument、fix、regression-check 的诊断循环 skill | 系统性诊断 hard bug 或 performance regression 时 |
| [`diagnosing-bugs`](skills/diagnosing-bugs/SKILL.md)<br>围绕快速 pass/fail feedback loop 缩小 root cause 的 debugging skill | 需要 reproduce → minimise → hypothesise → instrument → fix 循环时 |
| [`grill-me`](skills/grill-me/SKILL.md)<br>持续提问，直到计划或设计没有明显空洞的 skill | 希望 agent 持续追问计划或设计直到清晰时 |
| [`grill-with-docs`](skills/grill-with-docs/SKILL.md)<br>在提问过程中记录 domain terms 和 decisions 的设计验证 skill | 希望在提问过程中更新 project vocabulary 和 docs/ADR 时 |
| [`grilling`](skills/grilling/SKILL.md)<br>在实现前用压力问题验证计划和设计的通用 grilling skill | 需要通用 plan/design stress-test 问题循环时 |
| [`domain-modeling`](skills/domain-modeling/SKILL.md)<br>让项目术语、domain model、architectural decision 更清晰的 skill | 调整 domain term、ubiquitous language、architectural decision 时 |
| [`codebase-design`](skills/codebase-design/SKILL.md)<br>用于 deep module、小 interface、清晰 seam 的代码库设计 skill | 需要更好的 module interface、seam、testability vocabulary 时 |
| [`improve-codebase-architecture`](skills/improve-codebase-architecture/SKILL.md)<br>发现 shallow module 和 coupling，并寻找 deepening opportunity 的架构 skill | 想寻找 deepening opportunity 并减少 architectural friction 时 |
| [`prototype`](skills/prototype/SKILL.md)<br>在正式实现前用 throwaway code 验证 logic 或 UI 方向的 prototyping skill | 想在确定 approach 前做 throwaway logic/UI prototype 时 |
| [`to-prd`](skills/to-prd/SKILL.md)<br>把对话 context 组织成 product requirements 的 PRD 写作 skill | 想把对话 context 转成 PRD 时 |
| [`to-issues`](skills/to-issues/SKILL.md)<br>把计划拆成可独立处理的 vertical-slice issues 的 skill | 想把 plan 拆成可独立推进的 implementation issues 时 |
| [`triage`](skills/triage/SKILL.md)<br>通过结构化 workflow 分类 issue 并决定下一步行动的 triage skill | 想用 structured triage workflow 处理 issue 时 |
| [`handoff`](skills/handoff/SKILL.md)<br>压缩 context，让下一个 agent 或 session 能继续工作的 handoff skill | 想把 context 交给另一个 agent 或 session 时 |
| [`write-a-skill`](skills/write-a-skill/SKILL.md)<br>用正确结构和 progressive disclosure 创建 agent skill 的 skill-writing skill | 想创建或改进 agent skill 时 |

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
5. non-trivial code change 前，用 `jhste-engineering-judgment` 检查 scope、seam、failure path、data contract、assumption，以及每个 changed class/module/function 的 main responsibility。
6. non-trivial code work 完成声明前，使用 `jhste-red-team-review`。跳过 docs-only、comment-only、formatting-only、trivial rename-only 变更。
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
- 从 SRP 角度命名 responsibility boundary。
- 让 failure observable。
- 将 automated guard output 视为 evidence，而不是 proof。
- 在称 non-trivial work 完成前执行 red-team code review。

快速的 agent 需要 guardrail。`jhste-skills` 为它们提供 repo-respecting engineering workflow。
