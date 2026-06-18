# jhste-skills

Portable AI coding skills kit for quickly restoring a shared coding-assistant environment across machines and repositories.

This kit does **not** replace existing repository instructions. Repo-local `AGENTS.md`, `CLAUDE.md`, and docs remain authoritative. The kit adds shared, public-safe guidance, an advisory profile, and an optional read-only deep scan.

## What the quick install does

- Installs selected skills into a kit-managed skill directory.
- Creates `.jhste/profile.yaml` in the current git repository when one does not already exist.
- Adds a short bridge block to `AGENTS.md` or `CLAUDE.md` only when the file already exists and the bridge is missing.
- Keeps enforcement advisory by default.

## What the quick install still avoids

- It does not modify CI.
- It does not install blocking git hooks by default. The default hook is advisory only; use `--skip-hooks` to opt out or `--hooks blocking` to enforce errors.
- It does not modify a target repository `package.json` or lockfile.
- It does not run a repo-wide strict scan.
- It does not auto-refactor code.
- It does not enable `strict` mode without explicit opt-in.
- Responsibility budget checks are advisory by default; they flag review candidates rather than blocking a repository.

## Quick start

```bash
npx jhste-skills install
```

Non-interactive runs fail closed unless `--yes` (or `-y`) is explicit, so CI/scripts must opt in before the installer changes files.

Useful local-development commands:

```bash
node cli/install.mjs --yes --repo /path/to/repo
node cli/install.mjs --yes --repo /path/to/repo --skip-hooks
node cli/install.mjs --yes --repo /path/to/repo --hooks blocking
node cli/install.mjs --yes --repo /path/to/repo --skill-set all
node cli/deep-scan.mjs --repo /path/to/repo
node cli/guard.mjs --repo /path/to/repo --scope changed --format text --fail-on error
node cli/hooks.mjs install --repo /path/to/repo --mode advisory
node cli/tune.mjs --repo /path/to/repo
node cli/baseline.mjs --repo /path/to/repo
```

The install prompts are intentionally small:

```text
추천 설정으로 설치합니다.
- 이 PC 전체에서 skills 사용
- 현재 repo에도 가볍게 연결
- 기존 코드는 막지 않음
- 앞으로 AI가 바꾸는 파일 중심으로 규칙 참고
- CI, package.json은 건드리지 않음
- 자동 guard hook은 advisory로 기본 설치
진행할까요? [Enter=예 / n=아니오 / c=직접 설정]
```

## Recommended rollout

1. Run `deep-scan` once to get advisory recommendations.
2. Keep the default advisory hook at first. Use `--skip-hooks` only if you do not want commit-time checks; use blocking mode only after dogfooding noise and false positives.
3. Run `guard --scope changed --format text --fail-on error` manually while iterating on code changes.
4. Before non-trivial code changes, use `jhste-engineering-judgment` to check scope, seams, failure paths, data contracts, and assumptions.
5. Before declaring non-trivial code work complete, use the `jhste-final-review` skill. Skip docs-only, comment-only, formatting-only, and trivial rename-only changes.
6. Stop after at most two fix + re-review cycles and report remaining risks instead of chasing an unbounded review loop.
7. Create a baseline only after reviewing existing debt. Use `ratchet` to stop new debt, not to hide scanner failures.
8. Enable profile commands only after repo-local guard commands are stable.

## Repository layout

```text
skills/                 AI-readable skill guidance
rules/                  Stable rule metadata for skills and scans
packs/                  Rule bundles for core, web, API, database, crawler
adapters/               Codex, Claude, and generic adapter notes
cli/                    install, deep-scan, guard, hooks, tune, and baseline commands
vendor/matt-pocock/     Matt Pocock allowlist, source lock, and attribution
examples/profile.yaml   Default advisory profile example
```

## Included core skills

Quick install defaults to the core skill set to keep setup safe-by-default. Use `--skill-set all` to include vendored workflow skills, or `--skill-set vendor` to install only the vendored set. Vendored skills are useful, but may suggest documentation, issue-tracker, or vocabulary workflows; their jhste compatibility preamble keeps repo-local instructions authoritative and requires explicit approval for side effects.

- `setup`
- `jhste-engineering-judgment`
- `jhste-code-quality`
- `jhste-architecture-review`
- `jhste-db-api-boundary`
- `jhste-crawler-automation`
- `jhste-final-review`

The kit also vendors exactly 14 allowlisted Matt Pocock skills. See [`vendor/matt-pocock/allowlist.json`](vendor/matt-pocock/allowlist.json) and [`vendor/matt-pocock/source-lock.json`](vendor/matt-pocock/source-lock.json).

## Verification

```bash
npm test
npm run public-safety:check
npm run vendor:check
npm run docs:check
```

See [`docs/ACCEPTANCE_CHECK.md`](docs/ACCEPTANCE_CHECK.md) for release acceptance notes.
