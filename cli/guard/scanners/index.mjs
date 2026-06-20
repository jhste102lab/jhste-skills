import fs from 'node:fs';
import path from 'node:path';
import { effectiveRuleMode } from '../../profile.mjs';
import { FINDING_METADATA } from '../registry.mjs';
import { externalInputValidationFindings } from './external-input.mjs';
import {
  scanBroadExceptionAdvisory,
  scanFileSizeAdvisory,
  scanResponsibilityBudget,
  scanSecretLogging,
  scanSilentFailures,
  scanTypeEscapeAdvisory,
  scanWorkflowSecurity,
} from './code-health.mjs';
import {
  scanApiContractCompatibility,
  scanAuthzDataIsolation,
  scanCrawlerProducerBoundary,
  scanDbRowValidation,
  scanPublicSafeError,
  scanSqlParameterBinding,
  scanThinApiRoute,
  scanWriteSafety,
} from './data-boundary.mjs';
import {
  scanClientServerBoundary,
  scanPerformanceDuplicateFetch,
  scanRuntimeEnvSafety,
  scanSideEffectBoundary,
  scanStateSafety,
} from './ui-runtime.mjs';
import { scanSingleResponsibility } from './single-responsibility.mjs';
import { scanDependencyBoundaryAdvisory, scanExtensionSeamAdvisory } from './solid-design.mjs';
import { isSourceCodePath, violation } from './utils.mjs';

const ACTIVE_PROFILE_MODES = new Set(['advisory', 'changed-files', 'baseline-new-only', 'strict']);

export { violation } from './utils.mjs';

function scanExternalInputValidation(relPath, text) {
  if (!isSourceCodePath(relPath)) return [];
  return externalInputValidationFindings(relPath, text).map((item) => violation(item));
}

export const SCANNER_REGISTRY = [
  { id: 'scanSilentFailures', families: ['no_silent_failure'], scan: ({ relPath, text }) => scanSilentFailures(relPath, text) },
  { id: 'scanSecretLogging', families: ['no_secret_logging'], scan: ({ relPath, text }) => scanSecretLogging(relPath, text) },
  { id: 'scanClientServerBoundary', families: ['component_responsibility'], scan: ({ relPath, text }) => scanClientServerBoundary(relPath, text) },
  { id: 'scanWorkflowSecurity', families: ['workflow_security'], scan: ({ relPath, text }) => scanWorkflowSecurity(relPath, text) },
  { id: 'scanExternalInputValidation', families: ['external_input_validation'], scan: ({ relPath, text }) => scanExternalInputValidation(relPath, text) },
  { id: 'scanFileSizeAdvisory', families: ['file_size_advisory'], scan: ({ relPath, text, settings }) => scanFileSizeAdvisory(relPath, text, settings.fileSize) },
  { id: 'scanResponsibilityBudget', families: ['responsibility_budget'], scan: ({ relPath, text, settings }) => scanResponsibilityBudget(relPath, text, settings.responsibilityBudget) },
  { id: 'scanSingleResponsibility', families: ['single_responsibility_advisory'], scan: ({ relPath, text, settings }) => scanSingleResponsibility(relPath, text, settings.singleResponsibility) },
  { id: 'scanExtensionSeamAdvisory', families: ['extension_seam_advisory'], scan: ({ relPath, text }) => scanExtensionSeamAdvisory(relPath, text) },
  { id: 'scanDependencyBoundaryAdvisory', families: ['dependency_boundary_advisory'], scan: ({ relPath, text }) => scanDependencyBoundaryAdvisory(relPath, text) },
  { id: 'scanStateSafety', families: ['null_state_safety'], scan: ({ relPath, text }) => scanStateSafety(relPath, text) },
  { id: 'scanAuthzDataIsolation', families: ['authz_data_isolation'], scan: ({ relPath, text }) => scanAuthzDataIsolation(relPath, text) },
  { id: 'scanRuntimeEnvSafety', families: ['build_runtime_env_safety'], scan: ({ relPath, text }) => scanRuntimeEnvSafety(relPath, text) },
  { id: 'scanWriteSafety', families: ['write_safety_idempotency'], scan: ({ relPath, text }) => scanWriteSafety(relPath, text) },
  { id: 'scanApiContractCompatibility', families: ['api_contract_compatibility'], scan: ({ relPath, text }) => scanApiContractCompatibility(relPath, text) },
  { id: 'scanPerformanceDuplicateFetch', families: ['performance_duplicate_fetch'], scan: ({ relPath, text }) => scanPerformanceDuplicateFetch(relPath, text) },
  { id: 'scanSqlParameterBinding', families: ['sql_parameter_binding'], scan: ({ relPath, text }) => scanSqlParameterBinding(relPath, text) },
  { id: 'scanPublicSafeError', families: ['public_safe_error'], scan: ({ relPath, text }) => scanPublicSafeError(relPath, text) },
  { id: 'scanDbRowValidation', families: ['db_row_validation'], scan: ({ relPath, text }) => scanDbRowValidation(relPath, text) },
  { id: 'scanThinApiRoute', families: ['thin_api_route'], scan: ({ relPath, text }) => scanThinApiRoute(relPath, text) },
  { id: 'scanTypeEscapeAdvisory', families: ['type_escape_advisory'], scan: ({ relPath, text }) => scanTypeEscapeAdvisory(relPath, text) },
  { id: 'scanSideEffectBoundary', families: ['side_effect_boundary'], scan: ({ relPath, text }) => scanSideEffectBoundary(relPath, text) },
  { id: 'scanCrawlerProducerBoundary', families: ['crawler_producer_boundary'], scan: ({ relPath, text }) => scanCrawlerProducerBoundary(relPath, text) },
  { id: 'scanBroadExceptionAdvisory', families: ['broad_exception_advisory'], scan: ({ relPath, text }) => scanBroadExceptionAdvisory(relPath, text) },
];

export function validateScannerRegistry() {
  const errors = [];
  const seen = new Set();
  for (const scanner of SCANNER_REGISTRY) {
    if (!scanner?.id || typeof scanner.scan !== 'function' || !Array.isArray(scanner.families)) {
      errors.push(`Invalid scanner registry entry: ${JSON.stringify(scanner?.id || scanner)}`);
      continue;
    }
    if (seen.has(scanner.id)) errors.push(`Duplicate scanner registry id: ${scanner.id}`);
    seen.add(scanner.id);
  }
  for (const [findingId, metadata] of Object.entries(FINDING_METADATA)) {
    if (!seen.has(metadata.scanner)) errors.push(`Finding ${findingId} references missing scanner registry id ${metadata.scanner}`);
  }
  return errors;
}

const registryErrors = validateScannerRegistry();
if (registryErrors.length) {
  throw new Error(`Invalid guard scanner registry:\n${registryErrors.map((error) => `- ${error}`).join('\n')}`);
}

function decorateViolation(item, profile) {
  const metadata = FINDING_METADATA[item.rule_id] || { family: item.rule_id, pack: 'core', scanner: item.source || 'unknown' };
  const effectiveMode = effectiveRuleMode(profile, metadata);
  return {
    ...item,
    rule_family: metadata.family,
    scanner_id: metadata.scanner,
    effective_mode: effectiveMode,
  };
}

function isModeActiveForScope(mode, scope) {
  if (mode === 'changed-files' && scope === 'all') return false;
  return ACTIVE_PROFILE_MODES.has(mode);
}

function applyProfileModes(violations, profile, { scope } = {}) {
  return violations
    .map((item) => decorateViolation(item, profile))
    .filter((item) => isModeActiveForScope(item.effective_mode, scope));
}

export function scanText(relPath, text, settings = {}) {
  const raw = SCANNER_REGISTRY.flatMap((scanner) => scanner.scan({ relPath, text, settings }));
  if (settings.applyProfile === false) return raw.map((item) => decorateViolation(item, settings.profile || {}));
  return applyProfileModes(raw, settings.profile || {}, { scope: settings.scope });
}

export function scanFile(repoRoot, relPath, settings = {}) {
  const full = path.join(repoRoot, relPath);
  let text;
  try {
    text = fs.readFileSync(full, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      violations: [],
      failure: {
        code: 'guard.scan.file_read',
        message: `Failed to read ${relPath}`,
        details: [message],
      },
    };
  }
  return { violations: scanText(relPath, text, settings), failure: null };
}
