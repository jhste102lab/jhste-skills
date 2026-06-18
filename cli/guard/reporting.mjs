import { nowIso } from '../shared.mjs';
import { FINDING_METADATA } from './registry.mjs';

export const EXIT_VIOLATION = 1;
export const EXIT_GUARD_FAILURE = 2;
export const SEVERITIES = ['info', 'warning', 'error'];

export function summarize(violations, failures = []) {
  const active = violations.filter((item) => item.baseline_status !== 'matched');
  const summary = { error: 0, warning: 0, info: 0, suppressed: violations.length - active.length, failures: failures.length };
  for (const item of active) summary[item.severity] = (summary[item.severity] || 0) + 1;
  return summary;
}

export function guardResult(violations, failures = [], meta = {}) {
  return {
    schema_version: 1,
    generated_at: nowIso(),
    summary: summarize(violations, failures),
    meta,
    violations,
    failures,
  };
}

export function severityMeets(severity, threshold) {
  if (threshold === 'none') return false;
  const severityIndex = SEVERITIES.indexOf(severity);
  const thresholdIndex = SEVERITIES.indexOf(threshold);
  return severityIndex >= thresholdIndex;
}

export function exitCodeFor(result, failOn, baselineMode) {
  if (result.failures.length > 0) return EXIT_GUARD_FAILURE;
  if (baselineMode === 'update') return 0;
  const active = result.violations.filter((item) => item.baseline_status !== 'matched');
  if (baselineMode === 'ratchet' && active.length > 0) return EXIT_VIOLATION;
  if (active.some((item) => severityMeets(item.severity, failOn))) return EXIT_VIOLATION;
  return 0;
}

export function printResult(result, format) {
  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  const { summary } = result;
  console.log(`jhste guard: errors=${summary.error} warnings=${summary.warning} info=${summary.info} suppressed=${summary.suppressed} failures=${summary.failures}`);
  if (result.failures.length) {
    console.log('\nGuard failures:');
    for (const failure of result.failures) console.log(`- [${failure.code}] ${failure.message}${failure.details?.length ? ` (${failure.details.join('; ')})` : ''}`);
  }
  const active = result.violations.filter((item) => item.baseline_status !== 'matched');
  const visible = active.slice(0, 80);
  if (visible.length) {
    console.log('\nViolations:');
    for (const item of visible) {
      const confidence = item.confidence ? ` [${item.confidence}-confidence]` : '';
      const family = item.rule_family && item.rule_family !== item.rule_id ? ` (${item.rule_family})` : '';
      const related = item.related_key ? ` [related: ${item.related_key}]` : '';
      console.log(`- [${item.severity}]${confidence} ${item.rule_id}${family} ${item.path}:${item.line}${related} — ${item.message}`);
    }
    if (active.length > visible.length) console.log(`- ... ${active.length - visible.length} more omitted from text output`);
  }
  const matched = result.violations.filter((item) => item.baseline_status === 'matched');
  if (matched.length) {
    console.log('\nExisting baseline issues encountered (remediation queue; not a pass):');
    for (const item of matched.slice(0, 40)) {
      const family = item.rule_family && item.rule_family !== item.rule_id ? ` (${item.rule_family})` : '';
      const reason = item.baseline_reason ? ` — ${item.baseline_reason}` : '';
      console.log(`- [${item.severity}] ${item.rule_id}${family} ${item.path}:${item.line}${reason}`);
    }
    if (matched.length > 40) console.log(`- ... ${matched.length - 40} more baseline issues encountered in this scan scope`);
  }
}

