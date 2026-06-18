import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ensureDir, relativeDisplay } from './shared.mjs';

export const EXIT_CONFIG_FAILURE = 3;
export const MANAGED_START = '# jhste-skills managed hook start';
export const MANAGED_END = '# jhste-skills managed hook end';
export const HOOKS = new Set(['pre-commit', 'pre-push']);

export function git(repoRoot, args) {
  return execFileSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function gitHooksDir(repoRoot) {
  git(repoRoot, ['rev-parse', '--is-inside-work-tree']);
  return git(repoRoot, ['rev-parse', '--path-format=absolute', '--git-path', 'hooks']);
}

export function selectedHooks(value) {
  const hook = String(value || 'pre-commit');
  if (hook === 'all') return ['pre-commit', 'pre-push'];
  if (!HOOKS.has(hook)) throw new Error('--hook must be pre-commit, pre-push, or all.');
  return [hook];
}

export function isManagedHook(content) {
  return content.includes(MANAGED_START) && content.includes(MANAGED_END);
}

export function guardScopeForHook(hook) {
  return hook === 'pre-push' ? 'changed' : 'staged';
}

export function hookScript({ hook, mode, failOn }) {
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

export function preflightHookTarget(repoRoot, target) {
  let hooksDir;
  try {
    hooksDir = gitHooksDir(repoRoot);
  } catch {
    return { target, status: 'failed', reason: `not a git repository: ${repoRoot}` };
  }

  const file = path.join(hooksDir, target);
  if (!fs.existsSync(file)) return { target, status: 'will-install', path: file };
  const existing = fs.readFileSync(file, 'utf8');
  if (isManagedHook(existing)) return { target, status: 'will-refresh', path: file };
  return {
    target,
    status: 'skipped-non-managed',
    path: file,
    reason: `${relativeDisplay(repoRoot, file)} already exists and is not managed by jhste-skills`,
  };
}

export function installHookTarget(repoRoot, { target, mode, failOn }) {
  const preflight = preflightHookTarget(repoRoot, target);
  if (preflight.status === 'failed' || preflight.status === 'skipped-non-managed') {
    return { ...preflight, mode, failOn };
  }
  const hooksDir = path.dirname(preflight.path);
  ensureDir(hooksDir);
  fs.writeFileSync(preflight.path, hookScript({ hook: target, mode, failOn }), { mode: 0o755 });
  fs.chmodSync(preflight.path, 0o755);
  return {
    target,
    mode,
    failOn,
    path: preflight.path,
    status: preflight.status === 'will-refresh' ? 'refreshed-managed' : 'installed',
  };
}
