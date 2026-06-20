import { nowIso } from '../shared.mjs';
import { FINDING_METADATA } from './registry.mjs';

export const EXIT_VIOLATION = 1;
export const EXIT_GUARD_FAILURE = 2;
export const SEVERITIES = ['info', 'warning', 'error'];

export function summarize(violations, failures = []) {
  const active = violations.filter((item) => item.baseline_status !== 'matched');
  const baselineMatched = violations.length - active.length;
  const summary = {
    error: 0,
    warning: 0,
    info: 0,
    baseline_matched: baselineMatched,
    // Backward-compatible alias for schema_version: 1 consumers. Prefer baseline_matched in new integrations.
    suppressed: baselineMatched,
    failures: failures.length,
  };
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

function guidanceForFinding(item) {
  const family = item.rule_family || FINDING_METADATA[item.rule_id]?.family || item.rule_id;
  if (family === 'file_size_advisory') {
    return {
      means: 'This file exceeds the configured line limit. It is not proof of a bug, but it increases the chance that review, conflict resolution, and test boundaries become harder to manage.',
      next: 'Split the file along natural boundaries so each helper, adapter, scanner family, or test fixture carries one main responsibility at a time.',
    };
  }
  if (family === 'responsibility_budget') {
    return {
      means: 'This file may be combining multiple responsibilities such as UI, state, IO, validation, persistence, and response shaping.',
      next: 'Check whether the code can move into smaller modules with explicit names such as loader, service, repository, or view.',
    };
  }

  if (family === 'single_responsibility_advisory') {
    return {
      means: 'This class, module, or function may have more than one reason to change. The finding is heuristic and should be reviewed, not treated as proof.',
      next: 'Name the one main responsibility, then move only independently changing work behind a real seam; keep always-cochanging contract pieces together and avoid shallow pass-through wrappers.',
    };
  }
  if (family === 'external_input_validation') {
    return {
      means: 'This is a candidate path where external input such as files, request bodies, third-party API data, or env values may be trusted without shape validation.',
      next: 'Add an explicit validation boundary such as schema.safeParse, a validator, or assert/parseEnv, or make an existing validation step clearly visible in code.',
    };
  }
  if (family === 'no_secret_logging') {
    return {
      means: 'This is a candidate path where logs may include sensitive fields such as tokens, passwords, or session values.',
      next: 'Confirm that real secrets are not emitted, and redact values before logging when needed.',
    };
  }
  if (family === 'build_runtime_env_safety') {
    return {
      means: 'Direct env reads can fail differently across build and runtime environments, producing undefined values or invalid configuration.',
      next: 'Use startup-time env schema validation, defaults, or a requiredEnv helper so failure points are explicit.',
    };
  }
  if (family === 'write_safety_idempotency') {
    return {
      means: 'This is a candidate path where repeated or retried writes could create duplicate records or partial success states.',
      next: 'Check whether transactions, upserts, idempotency keys, dedupe logic, or batch semantics are the right safety mechanism here.',
    };
  }
  if (family === 'api_contract_compatibility') {
    return {
      means: 'The request or response shape may be unclear at the API boundary, or storage-layer shapes may be leaking directly to callers.',
      next: 'Add an input schema and public DTO mapping so the caller-facing contract stays explicit and stable.',
    };
  }
  if (family === 'authz_data_isolation') {
    return {
      means: 'Authn/authz checks or tenant-owner scoping may be unclear in code, creating a candidate risk of cross-user data access.',
      next: 'Make requireUser/permission checks and owner filters such as userId, orgId, or tenantId visible in the same flow.',
    };
  }
  if (family === 'performance_duplicate_fetch') {
    return {
      means: 'Duplicate fetches or missing cache use in the same path may cause slow rendering or unnecessary network calls.',
      next: 'Check whether these calls can be consolidated behind a shared loader, query hook, or cache key.',
    };
  }
  if (item.confidence === 'low') {
    return {
      means: 'This is a low-confidence static heuristic candidate. It does not mean the code is definitely buggy.',
      next: 'If the code is safe, make the validation or safeguard more visible. If the risk is real, add a small boundary fix.',
    };
  }
  return null;
}

export function printResult(result, format) {
  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  const { summary } = result;
  console.log(`jhste guard: errors=${summary.error} warnings=${summary.warning} info=${summary.info} baseline-matched=${summary.baseline_matched} failures=${summary.failures}`);
  if (result.meta?.git?.file_source) {
    const fallback = result.meta.git.file_source === 'filesystem-fallback' ? ` (fallback: ${result.meta.git.fallback_reason || 'unknown reason'})` : '';
    console.log(`File collection: ${result.meta.git.file_source}${fallback}`);
  }
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
      const guidance = guidanceForFinding(item);
      if (guidance) {
        console.log(`  Meaning: ${guidance.means}`);
        console.log(`  Next: ${guidance.next}`);
      }
    }
    if (active.length > visible.length) console.log(`- ... ${active.length - visible.length} more omitted from text output`);
  }
  const matched = result.violations.filter((item) => item.baseline_status === 'matched');
  if (matched.length) {
    console.log('\nExisting known issues encountered from baseline (remediation queue; not a pass):');
    for (const item of matched.slice(0, 40)) {
      const family = item.rule_family && item.rule_family !== item.rule_id ? ` (${item.rule_family})` : '';
      const reason = item.baseline_reason ? ` — ${item.baseline_reason}` : '';
      console.log(`- [${item.severity}] ${item.rule_id}${family} ${item.path}:${item.line}${reason}`);
    }
    if (matched.length > 40) console.log(`- ... ${matched.length - 40} more baseline issues encountered in this scan scope`);
  }
}
