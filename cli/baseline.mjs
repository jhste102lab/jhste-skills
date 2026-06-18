#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { ask, findGitRoot, parseArgs, relativeDisplay, KIT_ROOT } from './shared.mjs';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = findGitRoot(args.repo || process.cwd());
  const baselinePath = path.join(repoRoot, '.jhste', 'baseline.json');
  console.log('Baseline is optional and does not enable strict mode by itself.');
  console.log('It is a remediation queue: encountered baseline issues remain visible until fixed or explicitly tracked.');
  const autoYes = Boolean(args.yes) || !process.stdin.isTTY;
  const answer = autoYes ? 'y' : await ask(`Create/update ${relativeDisplay(repoRoot, baselinePath)} from guard --scope all? [y/N] `);
  if (answer.toLowerCase() !== 'y') {
    console.log('No baseline created.');
    return;
  }
  const result = spawnSync(process.execPath, [path.join(KIT_ROOT, 'cli', 'guard.mjs'), '--repo', repoRoot, '--scope', 'all', '--baseline', 'update', '--format', 'text', '--fail-on', 'none'], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  process.exit(result.status ?? 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
