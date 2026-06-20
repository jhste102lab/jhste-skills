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
  ['single_responsibility_advisory', 'singleResponsibility'],
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
    singleResponsibility: thresholds.singleResponsibility,
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

function newFindingsBag() {
  return {
    largeFiles: [],
    silentFailures: [],
    typeEscapes: [],
    rawSql: [],
    dbInRoutes: [],
    routeResponsibility: [],
    responsibilityBudget: [],
    singleResponsibility: [],
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      candidate(findings.scanWarnings, 'scan warning', file, 1, `file could not be scanned and was omitted from rule candidates: ${message}`, 'warning');
    }
  }
  return findings;
}
