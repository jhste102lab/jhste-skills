#!/usr/bin/env node
import path from 'node:path';
import { KIT_ROOT, findGitRoot, parseArgs, relativeDisplay } from './shared.mjs';
import {
  fileSizeSettings,
  loadProfileConfig,
  responsibilityBudgetSettings,
  singleResponsibilitySettings,
  validateProfileConfig,
} from './profile.mjs';
import { readJsonFile, validateJsonObject } from './json-file.mjs';
import { loadBaseline, writeBaseline, applyBaseline } from './guard/baseline.mjs';
import { resolveGuardConfig } from './guard/config.mjs';
import { profileCommandExecutionErrors, runProfileCommands } from './guard/profile-commands.mjs';
import { guardResult, printResult, exitCodeFor } from './guard/reporting.mjs';
import { resolveScopeFiles } from './guard/scope.mjs';
import { scanFile } from './guard/scanners/index.mjs';

const EXIT_VIOLATION = 1;
const EXIT_GUARD_FAILURE = 2;
const EXIT_CONFIG_FAILURE = 3;
let currentFormat = 'text';

function inManagedHook() {
  return process.env.JHSTE_HOOK_ACTIVE === '1';
}

function failGuard(message, details = []) {
  const result = guardResult([], [{ code: 'guard.runtime', message, details }]);
  printResult(result, currentFormat);
  process.exit(EXIT_GUARD_FAILURE);
}

function failConfig(message, details = []) {
  const result = guardResult([], [{ code: 'guard.config', message, details }]);
  printResult(result, currentFormat);
  process.exit(EXIT_CONFIG_FAILURE);
}

function toolVersion() {
  try {
    const pkg = readJsonFile(path.join(KIT_ROOT, 'package.json'), {
      description: 'package.json',
      validate: validateJsonObject,
    });
    return String(pkg.version || '0.0.0');
  } catch {
    return '0.0.0';
  }
}

function requestedOutputFormat(args, profileState = null) {
  const requested = String(args.format || profileState?.profile?.guard?.default_format || 'text');
  return ['text', 'json'].includes(requested) ? requested : 'text';
}

async function main() {
  const startedAt = Date.now();
  const args = parseArgs(process.argv.slice(2));
  currentFormat = requestedOutputFormat(args);
  const repoRoot = findGitRoot(args.repo || process.cwd());
  const profileState = loadProfileConfig(repoRoot);
  currentFormat = requestedOutputFormat(args, profileState);
  const profileErrors = validateProfileConfig(profileState.profile);
  if (profileErrors.length) failConfig(`Invalid profile ${relativeDisplay(repoRoot, profileState.path)}.`, profileErrors);
  const { format, failOn, baselineMode, baselinePath, scopedArgs } = resolveGuardConfig(args, profileState, repoRoot, {
    failConfig,
    inManagedHook,
  });
  currentFormat = format;
  const scope = resolveScopeFiles(repoRoot, scopedArgs, { failConfig, failGuard });
  const violations = [];
  const failures = [];
  const scanSettings = {
    profile: profileState.profile,
    scope: scope.scope,
    fileSize: fileSizeSettings(profileState.profile),
    responsibilityBudget: responsibilityBudgetSettings(profileState.profile),
    singleResponsibility: singleResponsibilitySettings(profileState.profile),
  };
  for (const relPath of scope.files) {
    const result = scanFile(repoRoot, relPath, scanSettings);
    violations.push(...result.violations);
    if (result.failure) failures.push(result.failure);
  }
  if (args['run-profile-commands']) {
    if (inManagedHook()) {
      failConfig('Managed hook execution is read-only; --run-profile-commands is not allowed while JHSTE_HOOK_ACTIVE=1.');
    }
    const executionErrors = profileCommandExecutionErrors(profileState.profile.commands, {
      trusted: Boolean(args['trust-repo-profile']),
      allowShell: Boolean(args['allow-profile-shell']),
    });
    if (executionErrors.length) failConfig('Profile command execution requires explicit trust.', executionErrors);
    const profile = runProfileCommands(repoRoot, profileState.profile.commands, {
      allowShell: Boolean(args['allow-profile-shell']),
    });
    violations.push(...profile.violations);
    failures.push(...profile.failures);
  }
  const baselineMap = loadBaseline(repoRoot, baselinePath, { failConfig });
  if (baselineMode === 'update' && failures.length === 0) writeBaseline(baselinePath, violations, baselineMap);
  const managed = applyBaseline(violations, baselineMap, baselineMode, { failConfig });
  const result = guardResult(managed, failures, {
    tool_version: toolVersion(),
    scope: scope.scope,
    files_considered: scope.files_considered,
    files_scanned: scope.files.length,
    fail_on: failOn,
    baseline_mode: baselineMode,
    baseline_path: relativeDisplay(repoRoot, baselinePath),
    profile_path: profileState.exists ? relativeDisplay(repoRoot, profileState.path) : null,
    duration_ms: Date.now() - startedAt,
    git: scope.git,
  });
  printResult(result, format);
  process.exit(exitCodeFor(result, failOn, baselineMode));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  const result = guardResult([], [{ code: 'guard.unhandled', message, details: [] }]);
  printResult(result, currentFormat);
  process.exit(EXIT_GUARD_FAILURE);
});
