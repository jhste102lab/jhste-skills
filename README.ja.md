# jhste-skills

Languages: [English](README.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md)

AI コーディングエージェントが、あなたの定義したエンジニアリング基準を一貫して守るための、インストール可能な作業ルールキットです。

`jhste-skills` は Codex、Claude Code などの AI コーディングエージェントに、共通のエンジニアリング作業フローを提供します。コードを変更する前に前提を検証し、リポジトリ内の既存指示を優先し、API/database/automation の境界を明確に保ち、SOLID-informed coding discipline と design review lens を適用し、changed-file guard を実行し、完了を宣言する前に red-team code review を行うよう支援します。guard finding は自動的な SOLID 証明ではなく review candidate です。

## ここでの SOLID の意味

ここでの SOLID は、自動 compliance チェックリストではなく、設計レビューのレンズです。

- **S — Single Responsibility:** 変更された function、module、class は、1 つの主な役割と 1 つの主な変更理由を持つべきです。
- **O — Open/Closed:** 新しい variant、provider、policy を追加するたびに core branching を何度も編集するなら、実際の extension seam が必要かを確認します。
- **L — Liskov Substitution:** 実装は return shape、nullability、error、side effect、文書化された behavior に関する caller の期待を弱めてはいけません。
- **I — Interface Segregation:** caller が小さく安定した一部だけを必要とするのに、大きな config、interface、props object に依存しないようにします。
- **D — Dependency Inversion:** high-level policy が DB、API、browser、filesystem、email、payment、queue などの concrete side effect に強く結びつかないようにし、必要な場合は意図的で見える seam にします。

このツールはプロジェクトを乗っ取りません。リポジトリ内の `AGENTS.md`、`CLAUDE.md`、docs が常に権威です。デフォルト設定は advisory モードで、marker-managed 方式で管理され、低リスクで試せるように設計されています。

Skills は、必要な状況でエージェントが自動的に使うことを想定しています。たとえば API コードを変更する場合は API/database boundary skill を、完了直前には red-team review skill を使うよう促します。ユーザーが明示的に skill を呼び出すこともできます。例: `use jhste-engineering-judgment to review this change premise`、`run jhste-red-team-review on this diff`。

## なぜインストールするのか？

AI コーディングエージェントは高速ですが、失敗パターンは予測可能です。

- 不明確な要求や誤った前提を黙って受け入れます。
- 役に立とうとして作業範囲を広げすぎます。
- UI、route/controller、service、database、side effect の責任を 1 か所に混ぜ込んだり、実際の seam がない抽象化を SOLID 名目で追加したりします。
- 失敗を隠したり、安全でないログを出したりします。
- 変更コードを十分確認する前に「完了」と言います。
- マシンやリポジトリを切り替えるたびに、リポジトリ固有のルールを忘れます。

`jhste-skills` は、こうした失敗を減らすための反復可能な作業ループをエージェントに提供します。

```text
non-trivial code change の前:
  goal、premise、ownership seam、data contract、failure path、SOLID-informed review lens を確認

編集中:
  repo-local instructions を権威として扱う

コード変更後:
  利用可能なら高速な changed-file guard を実行

「完了」と言う前:
  read-only red-team code review を実行

warning が出た場合:
  bounded fix を試し、再確認し、無限ループせず停止する
```

期待される結果は、より小さな diff、より明確な SOLID-informed seam、より安全な API/database コード、より少ない silent assumption、より誠実な完了報告です。

## 誰がインストールすべきか？

次に当てはまるなら、`jhste-skills` をインストールする価値があります。

- Codex、Claude Code、または他の coding agent を複数のリポジトリで使っている。
- non-trivial code change の前に、エージェントに前提を検証してほしい。
- 既存の repo docs を引き続き権威として扱いたい。
- commit 前、または完了宣言前に軽量な advisory check を置きたい。
- SOLID-informed coding discipline、API/database boundary、safe logging、input validation、side effect、automation reliability を重視している。
- マシンやリポジトリを移っても、同じ AI 作業習慣を素早く復元したい。

逆に、単一の prompt ファイルだけが欲しい場合、インストール直後から strict CI enforcement を期待する場合、`.jhste/` ファイルや bridge block を生成したくない場合、このツールに自動リファクタリングを期待している場合は、適さないかもしれません。

## クイックスタート

```bash
npx jhste-skills install
```

または npm で CLI をグローバルインストールして、どのリポジトリからでも使えます。

```bash
npm install -g jhste-skills
jhste-skills install
```

一度だけ試すなら `npx`、普段使う CLI として置いておきたいなら `npm install -g` を使ってください。

デフォルトインストールは Normal mode を使います。

- bundled skills 全体をインストールします: jhste core skills + vendored workflow skills。
- `.jhste/profile.yaml` がなければ作成します。
- project guidance が有効な場合、`AGENTS.md` または `CLAUDE.md` に marker-managed bridge block を追加または更新します。
- 安全な場合、advisory pre-commit hook をインストールします。
- CI、対象 `package.json`、lockfile、source code は変更しません。

別のリポジトリに接続するには:

```bash
cd /path/to/another-repo
jhste-skills connect
```

jhste core guardrail skills だけをインストールするには:

```bash
npx jhste-skills install --skill-set core
```

changed-file guard を手動で実行するには:

```bash
jhste-skills guard --scope changed --format text --fail-on error
```

任意で repo-wide advisory scan を実行するには:

```bash
jhste-skills deep-scan
```

managed outputs を削除するには:

```bash
jhste-skills uninstall --yes --repo /path/to/repo
```

`uninstall` は managed hook、marker-managed bridge block、manifest-managed skill directory を削除します。non-managed file には触れません。`.jhste/profile.yaml` は generated shape のままの場合のみ削除されます。変更済み profile を削除する場合は、内容を確認してから `--force-profile` を明示してください。

## インストールモード

```text
Minimal  - jhste core skills のみをインストール; project file や hook は作成しない
Normal   - 推奨デフォルト; all bundled skills + project profile/bridge + advisory pre-commit hook
Full     - all bundled skills + profile/bridge + advisory pre-commit/pre-push hooks + deep scan
Custom   - 効果ベースの質問でセットアップ範囲を選択
```

`Full` も safety contract を守ります。non-managed hook、source file、CI、`package.json`、lockfile を上書きせず、strict mode も有効化しません。Interactive Full mode では自動 check の挙動だけを尋ねます: warning only、commit-time block、commit/push-time block。`--yes` は `--hooks blocking` が明示されない限り warning-only を使います。

## Safety contract

`jhste-skills` は safe-by-default です。

- repo-local `AGENTS.md`、`CLAUDE.md`、docs が常に権威です。
- ユーザーの明示的な指示は task scope を定めますが、確認済みの safety/privacy/data-loss/repo-architecture constraint を黙って無視しません。
- デフォルトインストールは CI を変更しません。
- デフォルトインストールは対象 `package.json` や lockfile を変更しません。
- デフォルトインストールは source code を自動リファクタリングしません。
- managed hook はデフォルトで advisory です。
- strict mode には明示的な opt-in が必要です。
- bridge block は `<!-- jhste-skills:start -->` / `<!-- jhste-skills:end -->` marker を使います。
- guard output は review evidence であり、それ自体が proof ではありません。
- guard runtime/config failure は rule violation と分けて報告する必要があります。
- install/update/uninstall flow は non-managed hook、bridge text、skill directory に触れません。

## Core jhste skills

以下は jhste が作成した guardrail skills です。デフォルトでは bundled skill set の一部としてインストールされます。`--skill-set core` を使うと、これら core skills だけをインストールできます。

| Skill | いつ使うか | 何を減らすか |
|---|---|---|
| [`setup`](skills/setup/SKILL.md)<br>install/connect/update が既存プロジェクト指示を上書きしないようにする安全セットアップ skill | kit をインストール、またはリポジトリに接続するとき | Unsafe overwrite, unmanaged hook conflict, repo instruction replacement |
| [`jhste-engineering-judgment`](skills/jhste-engineering-judgment/SKILL.md)<br>コード変更前に goal、premise、scope、seam、failure path を検証する pre-change 判断 skill | non-trivial code change の前 | Blind agreement, scope creep, unverified assumption, unclear seam |
| [`jhste-code-quality`](skills/jhste-code-quality/SKILL.md)<br>input validation、observable failure handling、secret-safe logging を確認するコード品質 skill | application code の作成またはレビュー時 | Unvalidated input, silent failure, secret logging, oversized file |
| [`jhste-architecture-review`](skills/jhste-architecture-review/SKILL.md)<br>module boundary、side-effect placement、SOLID-informed design risk を確認する architecture review skill | module boundary や app structure を変更するとき | Pass-through abstraction, mixed responsibility, side-effect leakage |
| [`jhste-db-api-boundary`](skills/jhste-db-api-boundary/SKILL.md)<br>API route、service、repository、SQL 間の責任と data contract を確認する boundary skill | API、controller、service、repository、SQL、persistence code を触るとき | Fat route, unsafe SQL, missing auth/data scoping, leaky DTO |
| [`jhste-crawler-automation`](skills/jhste-crawler-automation/SKILL.md)<br>crawler/scraper/worker/scheduler の producer-consumer seam と side effect を確認する automation skill | crawler、scraper、worker、scheduler、browser automation を触るとき | Fragile automation, unclear producer/consumer boundary, hidden side effect |
| [`jhste-red-team-review`](skills/jhste-red-team-review/SKILL.md)<br>完了前に変更コードを攻撃的に再確認する read-only red-team code review skill | non-trivial code work の完了宣言前 | Premature “done”, missed null/auth/env/write/API/performance risk |

## Bundled workflow skills

Normal install では、Matt Pocock の [`mattpocock/skills`](https://github.com/mattpocock/skills) から vendoring した 14 個の workflow skills もインストールします。これらは debugging、planning、architecture、issue workflow、prototyping、handoff に役立ちます。インストールしたくない場合は `--skill-set core` を使ってください。

| Skill | いつ使うか |
|---|---|
| [`diagnosing-bugs`](skills/diagnosing-bugs/SKILL.md)<br>高速な pass/fail feedback loop を中心に root cause を絞り込む debugging skill | reproduce → minimise → hypothesise → instrument → fix ループが必要なとき |
| [`grill-me`](skills/grill-me/SKILL.md)<br>計画や設計の穴がなくなるまで粘り強く質問する skill | agent に計画や設計を明確になるまで質問させたいとき |
| [`grill-with-docs`](skills/grill-with-docs/SKILL.md)<br>質問しながら domain terms と decisions を文書化する design validation skill | 質問プロセスで project vocabulary や docs/ADR も更新したいとき |
| [`grilling`](skills/grilling/SKILL.md)<br>実装前に圧迫質問で計画と設計を検証する汎用 grilling skill | 一般的な plan/design stress-test 質問ループが必要なとき |
| [`domain-modeling`](skills/domain-modeling/SKILL.md)<br>プロジェクト用語、domain model、architectural decision を明確にする skill | domain term、ubiquitous language、architectural decision を整えるとき |
| [`codebase-design`](skills/codebase-design/SKILL.md)<br>deep module、小さな interface、明確な seam のための codebase design skill | より良い module interface、seam、testability vocabulary が必要なとき |
| [`improve-codebase-architecture`](skills/improve-codebase-architecture/SKILL.md)<br>shallow module と coupling を見つけ、deepening opportunity を探す architecture skill | deepening opportunity を見つけ、architectural friction を減らしたいとき |
| [`prototype`](skills/prototype/SKILL.md)<br>本実装前に throwaway code で logic や UI 方向を検証する prototyping skill | approach を確定する前に throwaway logic/UI prototype を作りたいとき |
| [`to-prd`](skills/to-prd/SKILL.md)<br>会話 context を product requirements に構造化する PRD 作成 skill | 会話 context を PRD に変換したいとき |
| [`to-issues`](skills/to-issues/SKILL.md)<br>計画を独立して作業可能な vertical-slice issues に分解する skill | plan を独立して進められる implementation issues に分けたいとき |
| [`triage`](skills/triage/SKILL.md)<br>structured workflow で issue を分類し、次の action を決める triage skill | issue を structured triage workflow で処理したいとき |
| [`handoff`](skills/handoff/SKILL.md)<br>次の agent や session が続けられるよう context を圧縮する handoff skill | 別の agent や session に context を渡したいとき |
| [`write-a-skill`](skills/write-a-skill/SKILL.md)<br>正しい構造と progressive disclosure で agent skill を作成する skill-writing skill | agent skill を作成または改善したいとき |

## Attribution: Matt Pocock skills

このリポジトリは、上記 14 個の skills を Matt Pocock の [`mattpocock/skills`](https://github.com/mattpocock/skills) から vendoring しています。

これらの skills は upstream MIT License に基づいて vendoring されています。このリポジトリは必要な copyright/license notice を保持し、インポート元を記録しています。

- Upstream: [`mattpocock/skills`](https://github.com/mattpocock/skills)
- License: MIT
- Attribution: [`vendor/matt-pocock/NOTICE.md`](vendor/matt-pocock/NOTICE.md)
- Upstream license copy: [`vendor/matt-pocock/LICENSE`](vendor/matt-pocock/LICENSE)
- Allowlist: [`vendor/matt-pocock/allowlist.json`](vendor/matt-pocock/allowlist.json)
- Source lock: [`vendor/matt-pocock/source-lock.json`](vendor/matt-pocock/source-lock.json)

allowlist 外の vendored skill を別途レビューなしで追加しないでください。Vendored copy を更新する場合は source lock を更新し、diff をレビューしてください。

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

詳しい command behavior は [`docs/CLI.md`](docs/CLI.md) を参照してください。

## 推奨 rollout

1. まずデフォルトインストールを実行し、advisory workflow を dogfood します。
2. 最初は advisory hook を維持します。commit-time check が不要なら `--skip-hooks` を使い、blocking mode は noise と false positive を十分確認してから有効にします。
3. まずデフォルトの 300-line advisory limit を使います。チームが warning-level hook enforcement を受け入れられるようになってから `--line-limit-mode blocking` を使います。
4. コード変更中は `guard --scope changed --format text --fail-on error` を手動で実行します。
5. non-trivial code change の前に、`jhste-engineering-judgment` で scope、seam、failure path、data contract、assumption、changed class/module/function の SOLID-informed review lens を確認します。
6. non-trivial code work の完了宣言前に `jhste-red-team-review` を使います。docs-only、comment-only、formatting-only、trivial rename-only の変更はスキップします。
7. fix + re-review は最大 2 サイクルまでにし、無限ループせず残りの risk を報告します。
8. baseline は existing debt をレビューした後にだけ作成します。Baseline は known-issues ledger として扱い、scanner failure を隠すのではなく、ratchet で new debt を防ぐために使います。

## Repository layout

```text
skills/                 AI-readable skill guidance
rules/                  skills と scan で使う stable rule metadata
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

Release acceptance notes は [`docs/ACCEPTANCE_CHECK.md`](docs/ACCEPTANCE_CHECK.md) を参照してください。

## Philosophy

`jhste-skills` は agent により多くの権限を与えるためのツールではありません。高速な agent をより信頼できるものにするためのツールです。

- 盲目的に同意しない。
- local project authority を上書きしない。
- 変更範囲を小さく保つ。
- SOLID-informed coding discipline を使い、responsibility、extension seam、caller contract、interface size、concrete dependency direction を確認する。
- failure を observable にする。
- automated guard output を proof ではなく evidence として扱う。
- non-trivial work を完了と呼ぶ前に red-team code review を行う。

高速な agent には guardrail が必要です。`jhste-skills` は agent に repo-respecting engineering workflow を提供します。
