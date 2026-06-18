#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { ask, ensureDir, findGitRoot, parseArgs, readIfExists, relativeDisplay } from './shared.mjs';
import { parseProfileText, validateProfileConfig } from './profile.mjs';

function extractSection(text, heading) {
  const lines = String(text || '').split(/\r?\n/);
  const start = lines.findIndex((line) => line === `${heading}:`);
  if (start === -1) return '';
  const out = [lines[start]];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break;
    out.push(line);
  }
  return `${out.join('\n').replace(/\s*$/, '')}\n`;
}

function removeSection(text, heading) {
  const lines = String(text || '').split(/\r?\n/);
  const out = [];
  for (let index = 0; index < lines.length;) {
    if (lines[index] === `${heading}:`) {
      index += 1;
      while (index < lines.length && (lines[index] === '' || /^\s/.test(lines[index]))) index += 1;
      continue;
    }
    out.push(lines[index]);
    index += 1;
  }
  return out.join('\n').replace(/\s*$/, '\n');
}

function validateProfileText(label, text) {
  const profile = parseProfileText(text);
  const errors = validateProfileConfig(profile);
  if (errors.length) {
    console.error(`${label} profile is invalid:`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(3);
  }
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
  validateProfileText('Current', base);
  validateProfileText('Recommended', recommended);
  let tuned = base.replace(/\s*$/, '\n');
  for (const heading of ['packs', 'rules', 'baseline']) {
    const section = extractSection(recommended, heading);
    if (!section) continue;
    tuned = removeSection(tuned, heading);
    tuned = `${tuned.replace(/\s*$/, '\n')}${section.replace(/\s*$/, '\n')}`;
  }
  if (!tuned.includes('# jhste tune applied from .jhste/profile.recommended.yaml')) {
    tuned = `${tuned.replace(/\s*$/, '\n')}# jhste tune applied from .jhste/profile.recommended.yaml\n# Review the recommended file for details before enabling stricter modes.\n`;
  }
  ensureDir(path.dirname(profilePath));
  fs.writeFileSync(profilePath, tuned);
  console.log(`Updated ${relativeDisplay(repoRoot, profilePath)} with non-strict recommendations.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
