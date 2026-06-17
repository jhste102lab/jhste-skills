#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { ask, ensureDir, findGitRoot, nowIso, parseArgs, relativeDisplay } from './shared.mjs';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = findGitRoot(args.repo || process.cwd());
  const reportPath = path.join(repoRoot, '.jhste', 'deep-scan-report.md');
  const baselinePath = path.join(repoRoot, '.jhste', 'baseline.json');
  if (!fs.existsSync(reportPath)) {
    console.error(`Deep scan report not found: ${relativeDisplay(repoRoot, reportPath)}`);
    console.error('Run deep-scan first.');
    process.exit(1);
  }
  console.log('Baseline is optional and does not enable strict mode by itself.');
  const autoYes = Boolean(args.yes) || !process.stdin.isTTY;
  const answer = autoYes ? 'y' : await ask('Create .jhste/baseline.json from the current deep scan report? [y/N] ');
  if (answer.toLowerCase() !== 'y') {
    console.log('No baseline created.');
    return;
  }
  ensureDir(path.dirname(baselinePath));
  fs.writeFileSync(baselinePath, `${JSON.stringify({
    version: 1,
    created_at: nowIso(),
    source_report: '.jhste/deep-scan-report.md',
    mode: 'baseline-new-only-ready',
    strict_enabled: false,
    note: 'Human review is required before using this baseline for enforcement.',
  }, null, 2)}\n`);
  console.log(`Created ${relativeDisplay(repoRoot, baselinePath)}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
