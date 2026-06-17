#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { ask, ensureDir, findGitRoot, parseArgs, readIfExists, relativeDisplay } from './shared.mjs';

function extractSection(text, heading) {
  const re = new RegExp(`^${heading}:\\n([\\s\\S]*?)(?=^\\S|$)`, 'm');
  return text.match(re)?.[0] ?? '';
}

function hasStrictEnabled(text) {
  return /^\s*mode:\s*strict\s*$/m.test(text) || /^strict:\n\s*enabled:\s*true\s*$/m.test(text);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = findGitRoot(args.repo || process.cwd());
  const profilePath = path.join(repoRoot, '.jhste', 'profile.yaml');
  const recommendedPath = path.join(repoRoot, '.jhste', 'profile.recommended.yaml');
  const current = readIfExists(profilePath);
  const recommended = readIfExists(recommendedPath);

  if (!recommended) {
    console.error(`Recommended profile not found: ${relativeDisplay(repoRoot, recommendedPath)}`);
    process.exit(1);
  }
  if (hasStrictEnabled(recommended) && !args['allow-strict']) {
    console.error('Recommended profile contains strict mode. Re-run with --allow-strict only after explicit user approval.');
    process.exit(1);
  }

  console.log('Recommended profile is separate and has not been applied yet.');
  console.log(`- Current profile: ${current ? relativeDisplay(repoRoot, profilePath) : 'missing'}`);
  console.log(`- Recommended profile: ${relativeDisplay(repoRoot, recommendedPath)}`);
  console.log('- Strict mode: not applied without --allow-strict');

  const autoYes = Boolean(args.yes) || !process.stdin.isTTY;
  const answer = autoYes ? 'y' : await ask('Apply non-strict recommended pack/rule modes to .jhste/profile.yaml? [y/N] ');
  if (answer.toLowerCase() !== 'y') {
    console.log('No changes applied.');
    return;
  }

  const base = current || `version: 1\nmode: advisory\n`;
  const tuned = `${base.replace(/\s*$/, '\n')}
# jhste tune applied from .jhste/profile.recommended.yaml
# Review the recommended file for details before enabling stricter modes.
${extractSection(recommended, 'packs')}${extractSection(recommended, 'rules')}${extractSection(recommended, 'baseline')}`;
  ensureDir(path.dirname(profilePath));
  fs.writeFileSync(profilePath, tuned);
  console.log(`Updated ${relativeDisplay(repoRoot, profilePath)} with non-strict recommendations.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
