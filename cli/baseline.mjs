#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import {
  confirmWriteAction,
  findGitRoot,
  parseArgs,
  relativeDisplay,
  resolveRepoContainedPath,
  KIT_ROOT,
} from './shared.mjs';
import { DEFAULT_BASELINE_PATH, loadProfileConfig, validateProfileConfig } from './profile.mjs';

const EXIT_CONFIG_FAILURE = 3;

function hasOption(args, key) {
  return Object.prototype.hasOwnProperty.call(args, key);
}

function failConfig(message, details = []) {
  console.error(`jhste-skills baseline: ${message}`);
  for (const detail of details) console.error(`- ${detail}`);
  process.exit(EXIT_CONFIG_FAILURE);
}

function resolveBaselinePath(args, profileState, repoRoot) {
  const configuredPath = hasOption(args, 'baseline-path') ? args['baseline-path'] : (profileState.profile.baseline.path || DEFAULT_BASELINE_PATH);
  if (configuredPath === true || String(configuredPath).trim() === '') failConfig('--baseline-path requires a path value.');
  try {
    return resolveRepoContainedPath(repoRoot, String(configuredPath), { label: '--baseline-path' });
  } catch (error) {
    failConfig(error instanceof Error ? error.message : String(error));
  }
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = findGitRoot(args.repo || process.cwd());
  const profileState = loadProfileConfig(repoRoot);
  const profileErrors = validateProfileConfig(profileState.profile);
  if (profileErrors.length) failConfig(`Invalid profile ${relativeDisplay(repoRoot, profileState.path)}.`, profileErrors);
  const baselinePath = resolveBaselinePath(args, profileState, repoRoot);

  console.log('Baseline is optional and does not enable strict mode by itself.');
  console.log('Think of it as a known-issues ledger: matched findings remain visible until fixed or explicitly tracked.');
  const shouldWrite = await confirmWriteAction(args, {
    action: 'baseline',
    repoRoot,
    changedFiles: [baselinePath],
    prompt: `Create/update ${relativeDisplay(repoRoot, baselinePath)} from guard --scope all? [y/N] `,
  });
  if (!shouldWrite) {
    console.log('No baseline created.');
    return;
  }
  const result = spawnSync(process.execPath, [
    path.join(KIT_ROOT, 'cli', 'guard.mjs'),
    '--repo',
    repoRoot,
    '--scope',
    'all',
    '--baseline',
    'update',
    '--baseline-path',
    baselinePath,
    '--format',
    'text',
    '--fail-on',
    'none',
  ], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  process.exit(result.status ?? 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
