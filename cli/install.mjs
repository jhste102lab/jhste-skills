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
- CI, hook, package.json은 건드리지 않음
진행할까요? [Enter=예 / n=아니오 / c=직접 설정] `;

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

function installSkills(skillsDir, { force = false } = {}) {
  const sourceRoot = path.join(KIT_ROOT, 'skills');
  ensureDir(skillsDir);
  return listDirectories(sourceRoot).map((name) => {
    return copyDirSafe(path.join(sourceRoot, name), path.join(skillsDir, name), { force });
  });
}

function printInstallResult({ repoRoot, skillsDir, skillResults, profileResult, bridgeResults }) {
  const skillSummary = skillResults.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {});
  console.log('\n설치가 끝났습니다.');
  console.log(`- Skills directory: ${skillsDir}`);
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
  console.log('- CI/hook/package.json/lockfile: unchanged by installer');
  console.log('\n나중에 deep scan을 실행하려면:');
  console.log('  npx jhste-skills deep-scan');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = findGitRoot(args.repo || process.cwd());
  const skillsDir = path.resolve(String(args['skills-dir'] || path.join(os.homedir(), '.jhste', 'skills')));
  const force = Boolean(args.force);
  const nonInteractive = !process.stdin.isTTY;
  let answer = '';

  if (!args.yes && !nonInteractive) {
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

  const skillResults = adapterMode === 'repo-only' ? [] : installSkills(skillsDir, { force });
  const profileResult = writeProfile(repoRoot, { force });
  const bridgeResults = args['no-bridge'] ? [] : ['AGENTS.md', 'CLAUDE.md'].map((file) => maybeAppendBridge(repoRoot, file));

  printInstallResult({ repoRoot, skillsDir, skillResults, profileResult, bridgeResults });

  if (!args['skip-deep-scan'] && !nonInteractive) {
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
