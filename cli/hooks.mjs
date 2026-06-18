#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { findGitRoot, parseArgs, relativeDisplay } from './shared.mjs';
import {
  EXIT_CONFIG_FAILURE,
  HOOKS,
  gitHooksDir,
  hookScript,
  isManagedHook,
  selectedHooks,
} from './hook-utils.mjs';

function usage() {
  console.log(`jhste-skills hooks

Usage:
  jhste-skills hooks install [--repo <path>] [--mode advisory|blocking] [--hook pre-commit|pre-push|all] [--fail-on none|warning|error]
  jhste-skills hooks uninstall [--repo <path>] [--hook pre-commit|pre-push|all]
  jhste-skills hooks doctor [--repo <path>]

Notes:
  install never overwrites a non-managed existing hook.
  advisory hooks print guard output but return success.
  blocking hooks return the guard exit code.
`);
}

function fail(message) {
  console.error(`jhste-skills hooks: ${message}`);
  process.exit(EXIT_CONFIG_FAILURE);
}

function install(repoRoot, args) {
  const mode = String(args.mode || 'advisory');
  if (!['advisory', 'blocking'].includes(mode)) fail('--mode must be advisory or blocking.');
  const failOn = String(args['fail-on'] || (mode === 'blocking' ? 'error' : 'none'));
  if (!['none', 'warning', 'error'].includes(failOn)) fail('--fail-on must be none, warning, or error.');
  let hooksDir;
  try {
    hooksDir = gitHooksDir(repoRoot);
  } catch {
    fail(`not a git repository: ${repoRoot}`);
  }
  fs.mkdirSync(hooksDir, { recursive: true });
  let hooks;
  try {
    hooks = selectedHooks(args.hook);
  } catch (error) {
    fail(error.message);
  }
  for (const hook of hooks) {
    const file = path.join(hooksDir, hook);
    if (fs.existsSync(file)) {
      const existing = fs.readFileSync(file, 'utf8');
      if (!isManagedHook(existing)) {
        fail(`${relativeDisplay(repoRoot, file)} already exists and is not managed by jhste-skills; refusing to overwrite.`);
      }
    }
  }
  for (const hook of hooks) {
    const file = path.join(hooksDir, hook);
    fs.writeFileSync(file, hookScript({ hook, mode, failOn }), { mode: 0o755 });
    fs.chmodSync(file, 0o755);
    console.log(`installed ${relativeDisplay(repoRoot, file)} (${mode}, fail-on=${failOn})`);
  }
}

function uninstall(repoRoot, args) {
  let hooksDir;
  try {
    hooksDir = gitHooksDir(repoRoot);
  } catch {
    fail(`not a git repository: ${repoRoot}`);
  }
  let hooks;
  try {
    hooks = selectedHooks(args.hook);
  } catch (error) {
    fail(error.message);
  }
  for (const hook of hooks) {
    const file = path.join(hooksDir, hook);
    if (!fs.existsSync(file)) {
      console.log(`${hook}: not installed`);
      continue;
    }
    const existing = fs.readFileSync(file, 'utf8');
    if (!isManagedHook(existing)) {
      console.log(`${hook}: existing non-managed hook left untouched`);
      continue;
    }
    fs.rmSync(file);
    console.log(`${hook}: removed managed hook`);
  }
}

function doctor(repoRoot) {
  let hooksDir;
  try {
    hooksDir = gitHooksDir(repoRoot);
  } catch {
    fail(`not a git repository: ${repoRoot}`);
  }
  for (const hook of HOOKS) {
    const file = path.join(hooksDir, hook);
    if (!fs.existsSync(file)) {
      console.log(`${hook}: absent`);
      continue;
    }
    const existing = fs.readFileSync(file, 'utf8');
    console.log(`${hook}: ${isManagedHook(existing) ? 'managed by jhste-skills' : 'present but not managed'}`);
  }
}

const [subcommand, ...rest] = process.argv.slice(2);
if (!subcommand || subcommand === '--help' || subcommand === '-h') {
  usage();
  process.exit(0);
}

const args = parseArgs(rest);
const repoRoot = findGitRoot(args.repo || process.cwd());
if (subcommand === 'install') install(repoRoot, args);
else if (subcommand === 'uninstall') uninstall(repoRoot, args);
else if (subcommand === 'doctor') doctor(repoRoot);
else fail(`unknown subcommand: ${subcommand}`);
