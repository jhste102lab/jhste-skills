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
  singleResponsibilitySettings,
  validateProfileConfig,
} from './profile.mjs';
import { collectFiles, detectInstructions, detectStack } from './deep-scan/collect.mjs';
import { scanFiles } from './deep-scan/analyze.mjs';
import { renderRecommendedProfile, renderReport } from './deep-scan/report.mjs';

const EXIT_CONFIG_FAILURE = 3;

function failConfig(message, details = []) {
  console.error(`jhste-skills deep-scan: ${message}`);
  for (const detail of details) console.error(`- ${detail}`);
  process.exit(EXIT_CONFIG_FAILURE);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = findGitRoot(args.repo || process.cwd());
  const profileState = loadProfileConfig(repoRoot);
  const profileErrors = validateProfileConfig(profileState.profile);
  if (profileErrors.length) failConfig(`Invalid profile ${relativeDisplay(repoRoot, profileState.path)}.`, profileErrors);
  const thresholds = {
    fileSize: fileSizeSettings(profileState.profile),
    responsibility: responsibilityBudgetSettings(profileState.profile),
    singleResponsibility: singleResponsibilitySettings(profileState.profile),
  };
  const { files, skipped, source } = collectFiles(repoRoot);
  const stack = detectStack(repoRoot, files);
  const instructions = detectInstructions(repoRoot);
  const findings = scanFiles(files, thresholds);
  const jhsteDir = path.join(repoRoot, '.jhste');
  ensureDir(jhsteDir);
  const reportPath = path.join(jhsteDir, 'deep-scan-report.md');
  const recommendedPath = path.join(jhsteDir, 'profile.recommended.yaml');
  atomicWrite(reportPath, renderReport({ repoRoot, files, skipped, source, stack, instructions, findings }));
  atomicWrite(recommendedPath, renderRecommendedProfile({ stack, findings, thresholds }));

  console.log('Deep scan completed. No code was modified.');
  console.log(`- Detected stack: ${Object.entries(stack).filter(([, value]) => value).map(([key]) => key).join(', ') || 'none'}`);
  console.log(`- Files inspected: ${files.length}`);
  console.log(`- Files skipped: ${skipped.length}`);
  console.log(`- File source: ${source.type}${source.fallback ? ` (fallback: ${source.fallback_reason || 'unknown reason'})` : ''}`);
  console.log('- Recommendation: keep advisory as the default; apply changed-files candidates only after user approval');
  console.log('\nOutput files:');
  console.log(`- ${relativeDisplay(repoRoot, reportPath)}`);
  console.log(`- ${relativeDisplay(repoRoot, recommendedPath)}`);
  console.log('\nTo apply the recommended settings:');
  console.log('  npx jhste-skills tune');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
