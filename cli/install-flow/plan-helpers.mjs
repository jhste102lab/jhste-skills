import { DEFAULT_LINE_LIMIT } from './options.mjs';

export function defaultLineLimit() {
  return { enabled: true, maxLines: DEFAULT_LINE_LIMIT, enforcement: 'advisory' };
}

export function disabledLineLimit() {
  return { enabled: false, maxLines: DEFAULT_LINE_LIMIT, enforcement: 'off' };
}

export function hookActions(targets, mode, failOn) {
  return targets.map((target) => ({
    target,
    mode,
    failOn: failOn || (mode === 'blocking' ? 'error' : 'none'),
  }));
}

export function targetList(plan, fallback = ['pre-commit']) {
  const existing = [...new Set((plan.hooks || []).map((hook) => hook.target))];
  return existing.length ? existing : fallback;
}

export function applyLineLimitToHooks(plan, options) {
  if (!plan.lineLimit?.enabled || plan.lineLimit.enforcement !== 'blocking') return;
  if (options.skipHooks) return;
  const targets = targetList(plan);
  plan.hooks = hookActions(targets, 'blocking', 'warning');
}
