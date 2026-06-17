# jhste-skills

Portable AI coding skills kit for quickly restoring a shared coding-assistant environment across machines and repositories.

This kit does **not** replace existing repository instructions. Repo-local `AGENTS.md`, `CLAUDE.md`, and docs remain authoritative. The kit adds shared, public-safe guidance, an advisory profile, and an optional read-only deep scan.

## What the quick install does

- Installs selected skills into a kit-managed skill directory.
- Creates `.jhste/profile.yaml` in the current git repository when one does not already exist.
- Adds a short bridge block to `AGENTS.md` or `CLAUDE.md` only when the file already exists and the bridge is missing.
- Keeps enforcement advisory by default.

## What the quick install never does by default

- It does not modify CI.
- It does not install git hooks.
- It does not modify a target repository `package.json` or lockfile.
- It does not run a repo-wide strict scan.
- It does not auto-refactor code.
- It does not enable `strict` mode without explicit opt-in.
- Responsibility budget checks are advisory by default; they flag review candidates rather than blocking a repository.

## Quick start

```bash
npx jhste-skills install
```

Useful local-development commands:

```bash
node cli/install.mjs --yes --repo /path/to/repo
node cli/deep-scan.mjs --repo /path/to/repo
node cli/tune.mjs --repo /path/to/repo
node cli/baseline.mjs --repo /path/to/repo
```

The install prompt is intentionally one question:

```text
추천 설정으로 설치합니다.
- 이 PC 전체에서 skills 사용
- 현재 repo에도 가볍게 연결
- 기존 코드는 막지 않음
- 앞으로 AI가 바꾸는 파일 중심으로 규칙 참고
- CI, hook, package.json은 건드리지 않음
진행할까요? [Enter=예 / n=아니오 / c=직접 설정]
```

## Repository layout

```text
skills/                 AI-readable skill guidance
rules/                  Stable rule metadata for skills and scans
packs/                  Rule bundles for core, web, API, database, crawler
adapters/               Codex, Claude, and generic adapter notes
cli/                    install, deep-scan, tune, and baseline commands
vendor/matt-pocock/     Matt Pocock allowlist, source lock, and attribution
examples/profile.yaml   Default advisory profile example
```

## Included core skills

- `setup`
- `jhste-code-quality`
- `jhste-architecture-review`
- `jhste-db-api-boundary`
- `jhste-crawler-automation`

The kit also vendors exactly 10 allowlisted Matt Pocock skills. See [`vendor/matt-pocock/allowlist.json`](vendor/matt-pocock/allowlist.json) and [`vendor/matt-pocock/source-lock.json`](vendor/matt-pocock/source-lock.json).

## Verification

```bash
npm test
npm run public-safety:check
npm run vendor:check
npm run docs:check
```

See [`docs/ACCEPTANCE_CHECK.md`](docs/ACCEPTANCE_CHECK.md) for release acceptance notes.
