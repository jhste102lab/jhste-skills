#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestName = '.jhste-skills-manifest.json';
const runtimeEnv = process.env;

function envValue(name, fallback = '') {
  return runtimeEnv[name] ?? fallback;
}

function envFlag(name) {
  return Boolean(envValue(name));
}

function log(message) {
  console.log(`jhste-skills postinstall: ${message}`);
}

function isGlobalInstall() {
  return envValue('npm_config_global') === 'true' || envValue('npm_config_location') === 'global';
}

function main() {
  if (envFlag('JHSTE_SKILLS_SKIP_POSTINSTALL_SYNC')) {
    log('skipped because JHSTE_SKILLS_SKIP_POSTINSTALL_SYNC is set.');
    return;
  }
  if (!isGlobalInstall()) return;

  if (typeof process.getuid === 'function' && process.getuid() === 0 && envValue('SUDO_USER') && envValue('SUDO_USER') !== 'root') {
    log('skipped managed skill sync during sudo global install to avoid root-owned user files. Run `jhste-skills update --yes --skip-hooks` as the target user.');
    return;
  }

  const home = os.homedir();
  const skillsDir = path.join(home, '.jhste', 'skills');
  const manifestPath = path.join(skillsDir, manifestName);
  if (!fs.existsSync(manifestPath)) {
    log(`no managed skills manifest at ${manifestPath}; nothing to sync.`);
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    log(`managed skill sync skipped because ${manifestPath} is not valid JSON.`);
    return;
  }
  if (manifest?.managed_by !== 'jhste-skills') {
    log(`managed skill sync skipped because ${manifestPath} is not owned by jhste-skills.`);
    return;
  }

  const cli = path.join(root, 'cli', 'index.mjs');
  const result = spawnSync(process.execPath, [cli, 'update', '--yes', '--skip-hooks', '--no-bridge', '--skills-dir', skillsDir], {
    cwd: home,
    env: { ...runtimeEnv, JHSTE_SKILLS_POSTINSTALL_SYNC: '1' },
    stdio: 'inherit',
  });
  if (result.error) {
    log(`managed skill sync skipped after spawn failure: ${result.error.message}`);
    return;
  }
  if (result.status) {
    log(`managed skill sync exited with ${result.status}; run \`jhste-skills update --yes --skip-hooks\` manually.`);
  }
}

main();
