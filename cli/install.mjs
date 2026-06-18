#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  ask,
  BRIDGE_BLOCK,
  copyDirSafe,
  DEFAULT_PROFILE,
  ensureDir,
  findGitRoot,
  KIT_ROOT,
  listDirectories,
  parseArgs,
  readIfExists,
  nowIso,
} from './shared.mjs';

const PROMPT = `추천 설정으로 설치합니다.
- 이 PC 전체에서 skills 사용
- 현재 repo에도 가볍게 연결
- 기존 코드는 막지 않음
- 앞으로 AI가 바꾸는 파일 중심으로 규칙 참고
- CI, package.json은 건드리지 않음
- 자동 guard hook은 advisory로 기본 설치
진행할까요? [Enter=예 / n=아니오 / c=직접 설정] `;

const EXIT_CONFIG_FAILURE = 3;
const BOOLEAN_OPTIONS = new Set(['yes', 'force', 'skip-hooks', 'no-bridge', 'skip-deep-scan']);
const VALUE_OPTIONS = new Set(['repo', 'skills-dir', 'hooks', 'skill-set']);
const HELP_OPTIONS = new Set(['help', 'h']);
const INSTALL_OPTIONS = new Set([...BOOLEAN_OPTIONS, ...VALUE_OPTIONS, ...HELP_OPTIONS]);

function usage() {
  console.log(`jhste-skills install

Usage:
  jhste-skills install [--yes] [--repo <path>] [--skills-dir <path>]
  jhste-skills install --yes [--skill-set core|vendor|all] [--skip-hooks | --hooks advisory|blocking]

Notes:
  Non-interactive installs require explicit --yes or -y.
  The default skill set is core.
  --skip-hooks and --hooks are mutually exclusive.
`);
}

function hasOption(args, key) {
  return Object.prototype.hasOwnProperty.call(args, key);
}

function readBooleanOption(args, key, errors) {
  if (!hasOption(args, key)) return false;
  if (args[key] !== true) errors.push(`--${key} does not take a value.`);
  return args[key] === true;
}

function readPathOption(args, key, errors) {
  if (!hasOption(args, key)) return undefined;
  const value = args[key];
  if (value === true || String(value).trim() === '') {
    errors.push(`--${key} requires a path value.`);
    return undefined;
  }
  return String(value);
}

function normalizeInstallOptions(args, { cwd, nonInteractive }) {
  if (args.help || args.h) return { help: true, errors: [] };

  const errors = [];
  for (const key of Object.keys(args)) {
    if (key !== '_' && !INSTALL_OPTIONS.has(key)) errors.push(`unknown option --${key}.`);
  }
  if (args._.length > 0) errors.push(`unexpected positional argument: ${args._[0]}`);

  const yes = readBooleanOption(args, 'yes', errors);
  const force = readBooleanOption(args, 'force', errors);
  const skipHooks = readBooleanOption(args, 'skip-hooks', errors);
  const noBridge = readBooleanOption(args, 'no-bridge', errors);
  const skipDeepScan = readBooleanOption(args, 'skip-deep-scan', errors);
  const repoInput = readPathOption(args, 'repo', errors);
  const skillsDirInput = readPathOption(args, 'skills-dir', errors);
  const skillSetInput = hasOption(args, 'skill-set') ? String(args['skill-set']).toLowerCase() : 'core';
  const explicitHooks = hasOption(args, 'hooks');

  if (skipHooks && explicitHooks) errors.push('--skip-hooks and --hooks are mutually exclusive.');
  const skillSetAliases = new Map([
    ['core', 'core'],
    ['core-only', 'core'],
    ['vendor', 'vendor'],
    ['vendor-only', 'vendor'],
    ['all', 'all'],
  ]);
  const skillSet = skillSetAliases.get(skillSetInput);
  if (!skillSet) errors.push('--skill-set must be core, vendor, or all.');

  let hooksMode = skipHooks ? '' : 'advisory';
  if (explicitHooks) {
    if (args.hooks === true) {
      hooksMode = 'advisory';
    } else {
      const requestedHooksMode = String(args.hooks || '').toLowerCase();
      hooksMode = requestedHooksMode === 'true' ? 'advisory' : requestedHooksMode;
      if (!['advisory', 'blocking'].includes(hooksMode)) {
        errors.push('--hooks must be advisory or blocking.');
      }
    }
  }

  const repoStart = path.resolve(repoInput || cwd);
  if (repoInput) {
    try {
      if (!fs.statSync(repoStart).isDirectory()) errors.push(`--repo must be a directory: ${repoInput}`);
    } catch {
      errors.push(`--repo path does not exist: ${repoInput}`);
    }
  }

  const skillsDir = path.resolve(skillsDirInput || path.join(os.homedir(), '.jhste', 'skills'));
  if (fs.existsSync(skillsDir) && !fs.statSync(skillsDir).isDirectory()) {
    errors.push(`--skills-dir must be a directory: ${skillsDirInput || skillsDir}`);
  }

  if (nonInteractive && !yes) {
    errors.push('non-interactive install requires explicit --yes or -y; refusing to change files.');
  }

  return {
    errors,
    explicitHooks,
    force,
    hooksMode,
    noBridge,
    promptForHooks: !skipHooks && !explicitHooks && !nonInteractive,
    repoStart,
    skillSet,
    skillsDir,
    skipDeepScan,
    yes,
  };
}

function printConfigErrors(errors) {
  for (const error of errors) console.error(`jhste-skills install: ${error}`);
  process.exitCode = EXIT_CONFIG_FAILURE;
}

function writeProfile(repoRoot, { force = false } = {}) {
  const profilePath = path.join(repoRoot, '.jhste', 'profile.yaml');
  if (fs.existsSync(profilePath) && !force) {
    return { status: 'skipped-existing', path: profilePath };
  }
  const existed = fs.existsSync(profilePath);
  ensureDir(path.dirname(profilePath));
  fs.writeFileSync(profilePath, DEFAULT_PROFILE.replace('<installed_at>', nowIso()));
  return { status: existed ? 'overwritten' : 'created', path: profilePath };
}

function maybeAppendBridge(repoRoot, fileName) {
  const target = path.join(repoRoot, fileName);
  const existing = readIfExists(target);
  if (existing === null) return { status: 'missing', path: target };
  if (existing.includes(BRIDGE_BLOCK)) return { status: 'unchanged', path: target };
  if (/^##\s+Agent skills\s*$/m.test(existing) || /jhste skills/i.test(existing)) {
    return { status: 'manual-review', path: target, snippet: BRIDGE_BLOCK };
  }
  const prefix = existing.endsWith('\n') ? existing : `${existing}\n`;
  fs.writeFileSync(target, `${prefix}\n${BRIDGE_BLOCK}\n`);
  return { status: 'appended', path: target };
}

function vendoredSkillNames() {
  const allowlistPath = path.join(KIT_ROOT, 'vendor', 'matt-pocock', 'allowlist.json');
  return new Set(JSON.parse(fs.readFileSync(allowlistPath, 'utf8')));
}

function skillNamesForSet(skillSet) {
  const sourceRoot = path.join(KIT_ROOT, 'skills');
  const all = listDirectories(sourceRoot);
  const vendored = vendoredSkillNames();
  if (skillSet === 'all') return all;
  if (skillSet === 'vendor') return all.filter((name) => vendored.has(name));
  return all.filter((name) => !vendored.has(name));
}

function installSkills(skillsDir, { force = false, skillSet = 'core' } = {}) {
  const sourceRoot = path.join(KIT_ROOT, 'skills');
  ensureDir(skillsDir);
  return skillNamesForSet(skillSet).map((name) => {
    return copyDirSafe(path.join(sourceRoot, name), path.join(skillsDir, name), { force });
  });
}

function installHooks(repoRoot, mode) {
  const result = spawnSync(process.execPath, [path.join(KIT_ROOT, 'cli', 'hooks.mjs'), 'install', '--repo', repoRoot, '--mode', mode], { stdio: 'inherit' });
  return result.status ?? 1;
}

function warnHookSkipped(mode) {
  console.log(`- Git hooks: ${mode} 자동 설치를 건너뜀. 기존 hook이 있거나 git repo가 아닐 수 있습니다.`);
  console.log('  필요하면 `jhste-skills hooks doctor`로 상태를 확인하세요.');
}

function printInstallResult({ repoRoot, skillsDir, skillSet, skillResults, profileResult, bridgeResults }) {
  const skillSummary = skillResults.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {});
  console.log('\n설치가 끝났습니다.');
  console.log(`- Skills directory: ${skillsDir}`);
  console.log(`- Skill set: ${skillSet}`);
  console.log(`- Skills: ${Object.entries(skillSummary).map(([k, v]) => `${k}=${v}`).join(', ') || 'none'}`);
  console.log(`- Current repo: ${repoRoot}`);
  console.log(`- Profile: ${profileResult.status} (${path.relative(repoRoot, profileResult.path)})`);
  for (const result of bridgeResults.filter((item) => item.status !== 'missing')) {
    console.log(`- Bridge: ${path.basename(result.path)} ${result.status}`);
    if (result.status === 'manual-review') {
      console.log('  Manual snippet:');
      console.log(result.snippet.split('\n').map((line) => `  ${line}`).join('\n'));
    }
  }
  console.log('- Enforcement: advisory only');
  console.log('- CI/package.json/lockfile: unchanged by installer');
  console.log('- Git hooks: advisory by default unless --skip-hooks or blocking is selected');
  console.log('\n나중에 deep scan을 실행하려면:');
  console.log('  npx jhste-skills deep-scan');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const nonInteractive = !process.stdin.isTTY;
  const options = normalizeInstallOptions(args, { cwd: process.cwd(), nonInteractive });
  if (options.help) {
    usage();
    return;
  }
  if (options.errors.length > 0) {
    printConfigErrors(options.errors);
    return;
  }

  const repoRoot = findGitRoot(options.repoStart);
  let answer = '';

  if (!options.yes && !nonInteractive) {
    answer = await ask(PROMPT);
  }

  if (String(answer).toLowerCase() === 'n') {
    console.log('설치를 취소했습니다. 변경 없음.');
    return;
  }

  let adapterMode = 'auto';
  if (String(answer).toLowerCase() === 'c' && !nonInteractive) {
    const custom = await ask('설치 범위를 선택하세요. [Enter=auto / g=generic only / r=repo profile only] ');
    if (custom.toLowerCase() === 'g') adapterMode = 'generic';
    if (custom.toLowerCase() === 'r') adapterMode = 'repo-only';
  }

  let hooksMode = options.hooksMode;
  if (options.promptForHooks) {
    const hooks = await ask(`
커밋할 때 guard를 자동 실행합니다. 기본값은 advisory입니다.
- Enter/advisory: 문제를 보여주지만 커밋은 막지 않음
- b/blocking: error면 커밋을 막음
- n/skip: 설치 안 함
선택하세요. [Enter=advisory / b=blocking / n=안 함] `);
    const normalizedHooks = hooks.toLowerCase();
    if (normalizedHooks === 'n' || normalizedHooks === 'skip' || normalizedHooks === 'none') hooksMode = '';
    if (normalizedHooks === 'b' || normalizedHooks === 'blocking') hooksMode = 'blocking';
    if (normalizedHooks === 'a' || normalizedHooks === 'advisory') hooksMode = 'advisory';
  }

  const skillResults = adapterMode === 'repo-only' ? [] : installSkills(options.skillsDir, { force: options.force, skillSet: options.skillSet });
  const profileResult = writeProfile(repoRoot, { force: options.force });
  const bridgeResults = options.noBridge ? [] : ['AGENTS.md', 'CLAUDE.md'].map((file) => maybeAppendBridge(repoRoot, file));

  printInstallResult({ repoRoot, skillsDir: options.skillsDir, skillSet: options.skillSet, skillResults, profileResult, bridgeResults });

  if (hooksMode) {
    const hookStatus = installHooks(repoRoot, hooksMode);
    if (hookStatus !== 0) {
      if (options.explicitHooks || hooksMode === 'blocking') {
        process.exitCode = hookStatus;
        return;
      }
      warnHookSkipped(hooksMode);
    }
  }

  if (!options.skipDeepScan && !nonInteractive) {
    const scan = await ask(`\n더 정확히 맞추려면 현재 repo를 깊게 점검할 수 있습니다.
대략 2~8분 걸리고, 코드는 수정하지 않습니다.
확인하는 것:
- 이 repo에 맞는 규칙 추천
- 이미 있는 큰 파일이나 구조 문제 확인
- 앞으로 AI가 새로 만들면 안 되는 문제 구분
- 필요한 경우 기존 문제를 기존 부채로 따로 저장
지금 실행할까요? [y=실행 / Enter=나중에] `);
    if (scan.toLowerCase() === 'y') {
      const result = spawnSync(process.execPath, [path.join(KIT_ROOT, 'cli', 'deep-scan.mjs'), '--repo', repoRoot], { stdio: 'inherit' });
      process.exitCode = result.status ?? 1;
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
