#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findGitRoot, parseArgs, relativeDisplay } from './shared.mjs';

const EXIT_CONFIG_FAILURE = 3;
const MANAGED_START = '# jhste-skills managed hook start';
const MANAGED_END = '# jhste-skills managed hook end';
const HOOKS = new Set(['pre-commit', 'pre-push']);

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

function git(repoRoot, args) {
  return execFileSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function gitHooksDir(repoRoot) {
  try {
    git(repoRoot, ['rev-parse', '--is-inside-work-tree']);
    return git(repoRoot, ['rev-parse', '--path-format=absolute', '--git-path', 'hooks']);
  } catch (error) {
    fail(`not a git repository: ${repoRoot}`);
  }
  return path.join(repoRoot, '.git', 'hooks');
}

function selectedHooks(value) {
  const hook = String(value || 'pre-commit');
  if (hook === 'all') return ['pre-commit', 'pre-push'];
  if (!HOOKS.has(hook)) fail('--hook must be pre-commit, pre-push, or all.');
  return [hook];
}

function isManaged(content) {
  return content.includes(MANAGED_START) && content.includes(MANAGED_END);
}

function guardScopeForHook(hook) {
  return hook === 'pre-push' ? 'changed' : 'staged';
}

function hookScript({ hook, mode, failOn }) {
  const scope = guardScopeForHook(hook);
  const cliPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'index.mjs');
  const escapedCliPath = cliPath.replaceAll("'", "'\\''");
  return `#!/usr/bin/env sh
${MANAGED_START}
# mode=${mode} hook=${hook} scope=${scope}
set -u
if [ "\${JHSTE_HOOK_ACTIVE:-}" = "1" ]; then
  echo "jhste-skills: nested managed hook invocation skipped."
  exit 0
fi
run_jhste_skills() {
  if command -v jhste-skills >/dev/null 2>&1; then
    jhste-skills "$@"
  else
    node '${escapedCliPath}' "$@"
  fi
}

echo "jhste-skills: running guard --scope ${scope} --fail-on ${failOn} (${mode})"
export JHSTE_HOOK_ACTIVE=1
run_jhste_skills guard --scope ${scope} --format text --fail-on ${failOn}
status=$?
if [ "$status" -eq 2 ] || [ "$status" -eq 3 ]; then
  echo "jhste-skills: guard runtime/config failure is not a validation pass (exit $status)."
fi
if [ "${mode}" = "advisory" ]; then
  if [ "$status" -ne 0 ]; then
    echo "jhste-skills: advisory hook reported issues but did not block. Use --mode blocking to enforce."
  fi
  exit 0
fi
exit "$status"
${MANAGED_END}
`;
}

function install(repoRoot, args) {
  const mode = String(args.mode || 'advisory');
  if (!['advisory', 'blocking'].includes(mode)) fail('--mode must be advisory or blocking.');
  const failOn = String(args['fail-on'] || (mode === 'blocking' ? 'error' : 'none'));
  if (!['none', 'warning', 'error'].includes(failOn)) fail('--fail-on must be none, warning, or error.');
  const hooksDir = gitHooksDir(repoRoot);
  fs.mkdirSync(hooksDir, { recursive: true });
  const hooks = selectedHooks(args.hook);
  for (const hook of hooks) {
    const file = path.join(hooksDir, hook);
    if (fs.existsSync(file)) {
      const existing = fs.readFileSync(file, 'utf8');
      if (!isManaged(existing)) {
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
  const hooksDir = gitHooksDir(repoRoot);
  for (const hook of selectedHooks(args.hook)) {
    const file = path.join(hooksDir, hook);
    if (!fs.existsSync(file)) {
      console.log(`${hook}: not installed`);
      continue;
    }
    const existing = fs.readFileSync(file, 'utf8');
    if (!isManaged(existing)) {
      console.log(`${hook}: existing non-managed hook left untouched`);
      continue;
    }
    fs.rmSync(file);
    console.log(`${hook}: removed managed hook`);
  }
}

function doctor(repoRoot) {
  const hooksDir = gitHooksDir(repoRoot);
  for (const hook of HOOKS) {
    const file = path.join(hooksDir, hook);
    if (!fs.existsSync(file)) {
      console.log(`${hook}: absent`);
      continue;
    }
    const existing = fs.readFileSync(file, 'utf8');
    console.log(`${hook}: ${isManaged(existing) ? 'managed by jhste-skills' : 'present but not managed'}`);
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
