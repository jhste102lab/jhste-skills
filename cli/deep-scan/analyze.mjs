import fs from 'node:fs';
import { scanText as scanSharedGuardText } from '../guard/scanners/index.mjs';

function candidate(list, kind, file, line, detail, severity = 'advisory') {
  list.push({ kind, file: file.rel, line, detail, severity });
}

const SHARED_SCANNER_BUCKETS = new Map([
  ['no_silent_failure', 'silentFailures'],
  ['broad_exception_advisory', 'silentFailures'],
  ['no_secret_logging', 'secretLogging'],
  ['file_size_advisory', 'largeFiles'],
  ['responsibility_budget', 'responsibilityBudget'],
  ['component_responsibility', 'clientServerSeam'],
  ['external_input_validation', 'externalInput'],
  ['null_state_safety', 'stateSafety'],
  ['authz_data_isolation', 'authzIsolation'],
  ['build_runtime_env_safety', 'runtimeEnv'],
  ['write_safety_idempotency', 'writeSafety'],
  ['api_contract_compatibility', 'apiContract'],
  ['public_safe_error', 'apiContract'],
  ['db_row_validation', 'apiContract'],
  ['performance_duplicate_fetch', 'performanceDuplication'],
  ['sql_parameter_binding', 'rawSql'],
  ['thin_api_route', 'dbInRoutes'],
  ['type_escape_advisory', 'typeEscapes'],
  ['side_effect_boundary', 'hiddenSideEffects'],
  ['crawler_producer_boundary', 'hiddenSideEffects'],
]);

function deepScanSeverity(finding) {
  if (finding.rule_id === 'file_size.review' || finding.severity === 'error') return 'review';
  if (finding.severity === 'warning') return 'warning';
  return 'advisory';
}

function addSharedScannerCandidates(file, text, findings, thresholds) {
  const sharedFindings = scanSharedGuardText(file.rel, text, {
    applyProfile: false,
    fileSize: thresholds.fileSize,
    responsibilityBudget: thresholds.responsibility,
  });
  const seen = new Set();
  for (const finding of sharedFindings) {
    const bucket = SHARED_SCANNER_BUCKETS.get(finding.rule_family);
    if (!bucket || !findings[bucket]) continue;
    const key = `${bucket}:${finding.rule_id}:${finding.line}:${finding.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    candidate(
      findings[bucket],
      `${finding.rule_family} candidate`,
      file,
      finding.line || 1,
      finding.message,
      deepScanSeverity(finding),
    );
    if (finding.rule_id === 'responsibility.route.budget') {
      candidate(
        findings.routeResponsibility,
        `${finding.rule_family} candidate`,
        file,
        finding.line || 1,
        finding.message,
        deepScanSeverity(finding),
      );
    }
  }
}

function hasUseClientDirective(text) {
  return /^\s*(?:"use client"|'use client')\s*;?/u.test(text);
}

function isScriptPipeline(file) {
  return /(^|\/)scripts\/(data|ops|import|imports|backfill|repair|migrate|migration)\//.test(file.rel)
    && /\.(ts|tsx|js|jsx|mjs|cjs|py)$/.test(file.rel);
}

function matchedResponsibilityHints(text, hintGroups) {
  return hintGroups
    .filter((group) => group.patterns.some((pattern) => pattern.test(text)))
    .map((group) => group.label);
}

function scanMixedResponsibilities(file, text, findings) {
  if (hasUseClientDirective(text)) {
    const hints = matchedResponsibilityHints(text, [
      { label: 'browser storage', patterns: [/\b(localStorage|sessionStorage)\b/] },
      { label: 'network/API', patterns: [/\bfetch\s*\(/, /\baxios\./, /\buse(Query|Mutation)\s*\(/] },
      { label: 'toast/notification', patterns: [/\btoast\b/, /\bnotify\b/] },
      { label: 'modal/dialog state', patterns: [/\b(Dialog|Modal|Sheet)\b/, /\bopen[A-Z]\w*\b/, /\bis[A-Z]\w*Open\b/] },
      { label: 'route navigation', patterns: [/\buseRouter\s*\(/, /\brouter\.(push|replace|refresh)\b/] },
      { label: 'heavy mapping', patterns: [/\.(map|filter|reduce)\s*\(/] },
    ]);
    if (hints.length >= 3) {
      candidate(findings.responsibilityBudget, 'mixed client responsibility candidate', file, 1, `client module mixes ${hints.slice(0, 4).join(', ')}; review hook/adapter/presentation split`, 'warning');
    }
  }

  const routeLike = /(^|\/)(api|routes?|controllers?|pages\/api)\//i.test(file.rel) || /route\.(ts|js)$/.test(file.rel);
  if (routeLike) {
    const hints = matchedResponsibilityHints(text, [
      { label: 'auth/session', patterns: [/\b(auth|session|permission|currentUser|getUser)\b/i] },
      { label: 'validation', patterns: [/\b(z\.object|safeParse|parseAsync|validate|schema)\b/] },
      { label: 'database', patterns: [/\b(prisma|pool\.query|client\.query|SELECT|INSERT|UPDATE|DELETE|db\.)\b/i] },
      { label: 'response formatting', patterns: [/\b(Response\.json|NextResponse\.json|res\.json)\b/] },
    ]);
    if (hints.length >= 3) {
      candidate(findings.responsibilityBudget, 'mixed route responsibility candidate', file, 1, `route/controller mixes ${hints.join(', ')}; review route/service/repository/response split`, 'warning');
    }
  }

  if (isScriptPipeline(file)) {
    const hints = matchedResponsibilityHints(text, [
      { label: 'CLI parsing', patterns: [/\b(process\.argv|argparse|ArgumentParser|commander)\b/] },
      { label: 'file IO', patterns: [/\b(readFile|writeFile|open\(|Path\(|fs\.)\b/] },
      { label: 'data transform', patterns: [/\.(map|filter|reduce)\s*\(/, /\bjson\.loads\b/i, /\bJSON\.parse\b/] },
      { label: 'persistence/network', patterns: [/\b(fetch|pool\.query|client\.query|INSERT|UPDATE|DELETE|requests\.)\b/i] },
      { label: 'reporting', patterns: [/\b(console\.|print\(|logger\.)\b/] },
    ]);
    if (hints.length >= 4) {
      candidate(findings.responsibilityBudget, 'mixed script responsibility candidate', file, 1, `script mixes ${hints.join(', ')}; review CLI/loader/transform/persist/report seams`, 'warning');
    }
  }
}

function newFindingsBag() {
  return {
    largeFiles: [],
    silentFailures: [],
    typeEscapes: [],
    rawSql: [],
    dbInRoutes: [],
    routeResponsibility: [],
    responsibilityBudget: [],
    clientServerSeam: [],
    hiddenSideEffects: [],
    secretLogging: [],
    stateSafety: [],
    authzIsolation: [],
    runtimeEnv: [],
    writeSafety: [],
    apiContract: [],
    performanceDuplication: [],
    externalInput: [],
    scanWarnings: [],
  };
}

export function scanFiles(files, thresholds) {
  const findings = newFindingsBag();
  for (const file of files) {
    try {
      const text = fs.readFileSync(file.full, 'utf8');
      addSharedScannerCandidates(file, text, findings, thresholds);
      scanMixedResponsibilities(file, text, findings);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      candidate(findings.scanWarnings, 'scan warning', file, 1, `file could not be scanned and was omitted from rule candidates: ${message}`, 'warning');
    }
  }
  return findings;
}
