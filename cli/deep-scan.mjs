#!/usr/bin/env node
import path from 'node:path';
import {
  atomicWrite,
  ensureDir,
  findGitRoot,
  parseArgs,
  relativeDisplay,
} from './shared.mjs';
import {
  fileSizeSettings,
  loadProfileConfig,
  responsibilityBudgetSettings,
} from './profile.mjs';
import { collectFiles, detectInstructions, detectStack } from './deep-scan/collect.mjs';
import { scanFiles } from './deep-scan/analyze.mjs';
import { renderRecommendedProfile, renderReport } from './deep-scan/report.mjs';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = findGitRoot(args.repo || process.cwd());
  const profileState = loadProfileConfig(repoRoot);
  const thresholds = {
    fileSize: fileSizeSettings(profileState.profile),
    responsibility: responsibilityBudgetSettings(profileState.profile),
  };
  const { files, skipped } = collectFiles(repoRoot);
  const stack = detectStack(repoRoot, files);
  const instructions = detectInstructions(repoRoot);
  const findings = scanFiles(files, thresholds);
  const jhsteDir = path.join(repoRoot, '.jhste');
  ensureDir(jhsteDir);
  const reportPath = path.join(jhsteDir, 'deep-scan-report.md');
  const recommendedPath = path.join(jhsteDir, 'profile.recommended.yaml');
  atomicWrite(reportPath, renderReport({ repoRoot, files, skipped, stack, instructions, findings }));
  atomicWrite(recommendedPath, renderRecommendedProfile({ stack, findings, thresholds }));

  console.log('Deep scan이 끝났습니다. 코드는 수정하지 않았습니다.');
  console.log(`- 감지된 stack: ${Object.entries(stack).filter(([, value]) => value).map(([key]) => key).join(', ') || 'none'}`);
  console.log(`- Files inspected: ${files.length}`);
  console.log(`- Files skipped: ${skipped.length}`);
  console.log('- 추천: advisory default, changed-files 후보는 사용자 승인 후 적용');
  console.log('\n결과 파일:');
  console.log(`- ${relativeDisplay(repoRoot, reportPath)}`);
  console.log(`- ${relativeDisplay(repoRoot, recommendedPath)}`);
  console.log('\n추천 설정을 적용하려면:');
  console.log('  npx jhste-skills tune');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
