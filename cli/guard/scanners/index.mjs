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
import { isSourceCodePath, violation } from './utils.mjs';

const ACTIVE_PROFILE_MODES = new Set(['advisory', 'changed-files', 'baseline-new-only', 'strict']);

export { violation } from './utils.mjs';

function scanExternalInputValidation(relPath, text) {
  if (!isSourceCodePath(relPath)) return [];
  return externalInputValidationFindings(relPath, text).map((item) => violation(item));
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
  const raw = [
    ...scanSilentFailures(relPath, text),
    ...scanSecretLogging(relPath, text),
    ...scanClientServerBoundary(relPath, text),
    ...scanWorkflowSecurity(relPath, text),
    ...scanExternalInputValidation(relPath, text),
    ...scanFileSizeAdvisory(relPath, text, settings.fileSize),
    ...scanResponsibilityBudget(relPath, text, settings.responsibilityBudget),
    ...scanStateSafety(relPath, text),
    ...scanAuthzDataIsolation(relPath, text),
    ...scanRuntimeEnvSafety(relPath, text),
    ...scanWriteSafety(relPath, text),
    ...scanApiContractCompatibility(relPath, text),
    ...scanPerformanceDuplicateFetch(relPath, text),
    ...scanSqlParameterBinding(relPath, text),
    ...scanPublicSafeError(relPath, text),
    ...scanDbRowValidation(relPath, text),
    ...scanThinApiRoute(relPath, text),
    ...scanTypeEscapeAdvisory(relPath, text),
    ...scanSideEffectBoundary(relPath, text),
    ...scanCrawlerProducerBoundary(relPath, text),
    ...scanBroadExceptionAdvisory(relPath, text),
  ];
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
