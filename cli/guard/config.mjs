import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_BASELINE_PATH } from '../profile.mjs';
import { relativeDisplay, resolveRepoContainedPath } from '../shared.mjs';

export function profileUsesMode(profile, mode) {
  if (profile?.mode === mode) return true;
  if (Object.values(profile?.packs || {}).some((config) => config?.mode === mode)) return true;
  if (Object.values(profile?.rules || {}).some((config) => config?.mode === mode)) return true;
  return false;
}

export function resolveGuardConfig(args, profileState, repoRoot, callbacks = {}) {
  const failConfig = callbacks.failConfig || ((message) => { throw new Error(message); });
  const inManagedHook = callbacks.inManagedHook || (() => false);
  const format = String(args.format || profileState.profile.guard.default_format || 'text');
  if (!['text', 'json'].includes(format)) failConfig('--format must be text or json.');

  const strictProfile = profileUsesMode(profileState.profile, 'strict');
  const baselineNewOnlyProfile = profileUsesMode(profileState.profile, 'baseline-new-only');
  const failOn = String(args['fail-on'] || profileState.profile.guard.fail_on || (strictProfile ? 'error' : 'none'));
  if (!['none', 'warning', 'error'].includes(failOn)) failConfig('--fail-on must be none, warning, or error.');
  if (strictProfile && failOn === 'none') {
    failConfig('Profile mode strict requires enforcement; set guard.fail_on to error/warning or choose a non-strict mode.');
  }

  const baselineMode = String(args.baseline || (baselineNewOnlyProfile ? 'ratchet' : (profileState.profile.baseline.enabled ? 'use' : 'off')));
  if (!['off', 'use', 'update', 'ratchet'].includes(baselineMode)) {
    failConfig(`Unsupported --baseline ${baselineMode}. Use off, use, update, or ratchet.`);
  }
  let baselinePath;
  try {
    baselinePath = resolveRepoContainedPath(repoRoot, String(args['baseline-path'] || profileState.profile.baseline.path || DEFAULT_BASELINE_PATH), { label: '--baseline-path' });
  } catch (error) {
    failConfig(error instanceof Error ? error.message : String(error));
  }
  if (inManagedHook() && baselineMode === 'update') {
    failConfig('Managed hook execution is read-only; --baseline update is not allowed while JHSTE_HOOK_ACTIVE=1.');
  }
  if (baselineMode === 'ratchet' && !fs.existsSync(baselinePath)) {
    failConfig(`--baseline ratchet requires an existing baseline at ${relativeDisplay(repoRoot, baselinePath)}.`);
  }
  const scopedArgs = {
    ...args,
    scope: args.scope || (strictProfile ? 'all' : (profileState.profile.guard.default_scope || 'changed')),
  };
  return { format, failOn, baselineMode, baselinePath, scopedArgs };
}
