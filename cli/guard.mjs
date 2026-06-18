#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { KIT_ROOT, findGitRoot, nowIso, parseArgs, relativeDisplay } from './shared.mjs';
import {
  DEFAULT_BASELINE_PATH,
  effectiveRuleMode,
  fileSizeSettings,
  loadProfileConfig,
  responsibilityBudgetSettings,
  validateProfileConfig,
} from './profile.mjs';

const TEXT_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.yml', '.yaml']);
const EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'vendor', 'dist', 'build', '.next', 'out', 'coverage', '.turbo', '.cache', '__pycache__']);
const EXCLUDED_FILE_NAMES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'bun.lock', 'poetry.lock', 'Pipfile.lock']);
const SECRET_FILE_RE = /(^|\/)(\.env(\..*)?|.*\.(pem|key|p12|pfx|crt)|id_rsa|id_ed25519)$/i;
const EXIT_VIOLATION = 1;
const EXIT_GUARD_FAILURE = 2;
const EXIT_CONFIG_FAILURE = 3;
const SEVERITIES = ['info', 'warning', 'error'];
const DEFAULT_COMMAND_TIMEOUT_MS = 120000;
const PROFILE_OUTPUT_LIMIT = 4000;
const ACTIVE_PROFILE_MODES = new Set(['advisory', 'changed-files', 'baseline-new-only', 'strict']);
let currentFormat = 'text';

const FINDING_METADATA = {
  'silent.catch.empty': { family: 'no_silent_failure', pack: 'core', scanner: 'scanSilentFailures' },
  'silent.promise_catch.empty': { family: 'no_silent_failure', pack: 'core', scanner: 'scanSilentFailures' },
  'silent.python_except.pass': { family: 'no_silent_failure', pack: 'core', scanner: 'scanSilentFailures' },
  'silent.catch.fallback_no_reason': { family: 'no_silent_failure', pack: 'core', scanner: 'scanSilentFailures' },
  'secret.logging': { family: 'no_secret_logging', pack: 'core', scanner: 'scanSecretLogging' },
  'file_size.warning': { family: 'file_size_advisory', pack: 'core', scanner: 'scanFileSizeAdvisory' },
  'file_size.review': { family: 'file_size_advisory', pack: 'core', scanner: 'scanFileSizeAdvisory' },
  'boundary.import.server_in_client': { family: 'component_responsibility', pack: 'web', scanner: 'scanClientServerBoundary' },
  'workflow.input_interpolation.run': { family: 'workflow_security', pack: 'core', scanner: 'scanWorkflowSecurity' },
  'workflow.action.unpinned': { family: 'workflow_security', pack: 'core', scanner: 'scanWorkflowSecurity' },
  'responsibility.page.budget': { family: 'responsibility_budget', pack: 'core', scanner: 'scanResponsibilityBudget' },
  'responsibility.client.budget': { family: 'responsibility_budget', pack: 'core', scanner: 'scanResponsibilityBudget' },
  'responsibility.route.budget': { family: 'responsibility_budget', pack: 'core', scanner: 'scanResponsibilityBudget' },
  'responsibility.script.budget': { family: 'responsibility_budget', pack: 'core', scanner: 'scanResponsibilityBudget' },
  'responsibility.python_orchestrator.budget': { family: 'responsibility_budget', pack: 'core', scanner: 'scanResponsibilityBudget' },
  'state.non_null_assertion': { family: 'null_state_safety', pack: 'core', scanner: 'scanStateSafety' },
  'state.async_ui_missing_fallback': { family: 'null_state_safety', pack: 'core', scanner: 'scanStateSafety' },
  'authz.scope_not_visible': { family: 'authz_data_isolation', pack: 'core', scanner: 'scanAuthzDataIsolation' },
  'authz.read_scope_not_visible': { family: 'authz_data_isolation', pack: 'core', scanner: 'scanAuthzDataIsolation' },
  'authz.mutation_without_auth_context': { family: 'authz_data_isolation', pack: 'core', scanner: 'scanAuthzDataIsolation' },
  'authz.read_without_auth_context': { family: 'authz_data_isolation', pack: 'core', scanner: 'scanAuthzDataIsolation' },
  'runtime.env_direct_access': { family: 'build_runtime_env_safety', pack: 'core', scanner: 'scanRuntimeEnvSafety' },
  'runtime.import_meta_env_direct_access': { family: 'build_runtime_env_safety', pack: 'core', scanner: 'scanRuntimeEnvSafety' },
  'runtime.getenv_direct_access': { family: 'build_runtime_env_safety', pack: 'core', scanner: 'scanRuntimeEnvSafety' },
  'write.loop_without_transaction': { family: 'write_safety_idempotency', pack: 'core', scanner: 'scanWriteSafety' },
  'write.mutation_retry_safety': { family: 'write_safety_idempotency', pack: 'core', scanner: 'scanWriteSafety' },
  'contract.boundary_without_schema': { family: 'api_contract_compatibility', pack: 'core', scanner: 'scanApiContractCompatibility' },
  'contract.raw_storage_response': { family: 'api_contract_compatibility', pack: 'core', scanner: 'scanApiContractCompatibility' },
  'performance.multiple_fetch_sources': { family: 'performance_duplicate_fetch', pack: 'core', scanner: 'scanPerformanceDuplicateFetch' },
  'performance.fetch_in_effect': { family: 'performance_duplicate_fetch', pack: 'core', scanner: 'scanPerformanceDuplicateFetch' },
  'sql.raw_interpolation': { family: 'sql_parameter_binding', pack: 'database', scanner: 'scanSqlParameterBinding' },
  'error.public_raw_details': { family: 'public_safe_error', pack: 'api', scanner: 'scanPublicSafeError' },
  'database.raw_row_public_response': { family: 'db_row_validation', pack: 'database', scanner: 'scanDbRowValidation' },
  'route.direct_db_access': { family: 'thin_api_route', pack: 'api', scanner: 'scanThinApiRoute' },
  'type.escape': { family: 'type_escape_advisory', pack: 'web', scanner: 'scanTypeEscapeAdvisory' },
  'side_effect.hidden_in_helper': { family: 'side_effect_boundary', pack: 'core', scanner: 'scanSideEffectBoundary' },
  'crawler.producer_direct_persistence': { family: 'crawler_producer_boundary', pack: 'crawler', scanner: 'scanCrawlerProducerBoundary' },
  'python.broad_exception': { family: 'broad_exception_advisory', pack: 'core', scanner: 'scanBroadExceptionAdvisory' },
};

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

function git(repoRoot, args, options = {}) {
  return execFileSync('git', ['-C', repoRoot, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

function normalizePath(value) {
  return value.replaceAll(path.sep, '/').replace(/^\.\//, '');
}

function isScannablePath(relPath) {
  const normalized = normalizePath(relPath);
  if (!normalized || normalized.startsWith('..')) return false;
  if (EXCLUDED_FILE_NAMES.has(path.basename(normalized)) || SECRET_FILE_RE.test(normalized)) return false;
  if (normalized.split('/').some((part) => EXCLUDED_DIRS.has(part))) return false;
  return TEXT_EXTENSIONS.has(path.extname(normalized).toLowerCase());
}

function listAllFiles(repoRoot) {
  const out = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = normalizePath(path.relative(repoRoot, full));
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) walk(full);
        continue;
      }
      if (entry.isFile() && isScannablePath(rel)) out.push(rel);
    }
  }
  walk(repoRoot);
  return out;
}

function readNulFile(filePath) {
  const raw = fs.readFileSync(filePath);
  return raw.toString('utf8').split('\0').map((item) => item.trim()).filter(Boolean);
}

function readGitPathList(repoRoot, args) {
  const raw = execFileSync('git', ['-C', repoRoot, ...args], { encoding: 'buffer', stdio: ['ignore', 'pipe', 'pipe'] });
  return raw.toString('utf8').split('\0').map((item) => item.trim()).filter(Boolean);
}

function resolveBaseRef(repoRoot, explicitBase, headRef) {
  if (explicitBase) return explicitBase;
  for (const candidate of ['origin/main', 'main', 'origin/master', 'master']) {
    try {
      git(repoRoot, ['rev-parse', '--verify', '--quiet', `${candidate}^{commit}`]);
      return git(repoRoot, ['merge-base', candidate, headRef]).trim();
    } catch {
      // Try the next common base candidate.
    }
  }
  try {
    return git(repoRoot, ['rev-parse', `${headRef}^`]).trim();
  } catch {
    return '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
  }
}

function repoRelativePath(repoRoot, rawPath) {
  const raw = String(rawPath || '').trim();
  if (!raw) return '';
  const resolved = path.isAbsolute(raw) ? path.resolve(raw) : path.resolve(repoRoot, raw);
  const relative = normalizePath(path.relative(repoRoot, resolved));
  if (!relative || relative === '.') return '';
  if (relative.startsWith('../') || relative === '..' || path.isAbsolute(relative)) {
    throw new Error(`Path escapes repo root: ${raw}`);
  }
  return relative;
}

function uniqueExistingScannableWithCount(repoRoot, relPaths) {
  const normalized = [];
  for (const relPath of relPaths) {
    if (!relPath) continue;
    normalized.push(repoRelativePath(repoRoot, relPath));
  }
  const unique = [...new Set(normalized)].sort();
  return {
    considered: unique.length,
    files: unique.filter(isScannablePath).filter((rel) => fs.existsSync(path.join(repoRoot, rel))),
  };
}

function scopePayload(repoRoot, scope, relPaths, gitMeta = {}) {
  const { files, considered } = uniqueExistingScannableWithCount(repoRoot, relPaths);
  return { scope, files, files_considered: considered, git: gitMeta };
}

function resolveScopeFiles(repoRoot, args) {
  const scope = String(args.scope || 'changed');
  if (!['changed', 'staged', 'all', 'files-from'].includes(scope)) {
    failConfig(`Unsupported --scope ${scope}. Use changed, staged, all, or files-from.`);
  }
  const gitMeta = {
    root: repoRoot,
    head: '',
    base: '',
  };
  try {
    gitMeta.head = git(repoRoot, ['rev-parse', '--short', 'HEAD']).trim();
  } catch {
    gitMeta.head = 'unavailable';
  }

  if (scope === 'all') {
    const files = listAllFiles(repoRoot).sort();
    return { scope, files, files_considered: files.length, git: gitMeta };
  }

  if (scope === 'files-from') {
    if (!args['files-from']) failConfig('--scope files-from requires --files-from <nul-delimited-file>.');
    let rawPaths;
    try {
      rawPaths = readNulFile(path.resolve(String(args['files-from'])));
    } catch (error) {
      failGuard('Failed to read --files-from input.', [error instanceof Error ? error.message : String(error)]);
    }
    try {
      return scopePayload(repoRoot, scope, rawPaths, gitMeta);
    } catch (error) {
      failGuard('Invalid path in --files-from input.', [error instanceof Error ? error.message : String(error)]);
    }
  }

  if (scope === 'staged') {
    try {
      return scopePayload(repoRoot, scope, readGitPathList(repoRoot, ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMRTUX', '--']), gitMeta);
    } catch (error) {
      failGuard('Failed to resolve staged files.', [error instanceof Error ? error.message : String(error)]);
    }
  }

  try {
    const headRef = String(args.head || 'HEAD');
    const baseRef = resolveBaseRef(repoRoot, args.base ? String(args.base) : '', headRef);
    gitMeta.head = git(repoRoot, ['rev-parse', '--short', headRef]).trim();
    gitMeta.base = baseRef;
    const files = [
      ...readGitPathList(repoRoot, ['diff', '--name-only', '-z', '--diff-filter=ACMRTUX', baseRef, headRef, '--']),
      ...readGitPathList(repoRoot, ['diff', '--name-only', '-z', '--diff-filter=ACMRTUX', '--']),
      ...readGitPathList(repoRoot, ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMRTUX', '--']),
      ...readGitPathList(repoRoot, ['ls-files', '--others', '--exclude-standard', '-z']),
    ];
    return scopePayload(repoRoot, scope, files, gitMeta);
  } catch (error) {
    failGuard('Failed to resolve changed files.', [error instanceof Error ? error.message : String(error)]);
  }
  return { scope, files: [], files_considered: 0, git: gitMeta };
}

function lineAt(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function hasUseClientDirective(text) {
  return /^\s*(?:"use client"|'use client')\s*;?/u.test(text);
}

function isRouteLikePath(relPath) {
  return /(^|\/)(api|routes?|controllers?|pages\/api)\//i.test(relPath) || /route\.(ts|js)$/.test(relPath);
}

function isScriptPipelinePath(relPath) {
  return /(^|\/)scripts\/(data|ops|import|imports|backfill|repair|migrate|migration)\//.test(relPath);
}

function isSourceCodePath(relPath) {
  return ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py'].includes(path.extname(relPath).toLowerCase());
}

function isCrawlerProducerPath(relPath) {
  return /(^|\/)(crawler|crawlers|scraper|scrapers|automation|workers?|schedulers?)\//i.test(relPath)
    || /crawler|scraper|automation|producer/i.test(path.basename(relPath));
}

function hasPersistenceRead(text) {
  return /\b(prisma\.\w+\.(find(?:Unique|First|Many)?|aggregate|count)|pool\.query|client\.query|db\.|database\.)\b/i.test(text)
    || /\bSELECT\b[\s\S]{0,120}\bFROM\b/i.test(text);
}

function hasPersistenceWrite(text) {
  return /\b(prisma\.\w+\.(create|update|delete|upsert)|pool\.query|client\.query|db\.)\b/i.test(text)
    || /\b(INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM)\b/i.test(text);
}

function hasPersistenceAccess(text) {
  return hasPersistenceRead(text) || hasPersistenceWrite(text);
}

function hasReadHandler(text) {
  return /\b(export\s+async\s+function\s+GET|router\.get|app\.get)\b/i.test(text);
}

function hasMutationHandler(text) {
  return /\b(export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)|router\.(post|put|patch|delete)|app\.(post|put|patch|delete))\b/i.test(text);
}

function hasAuthContext(text) {
  return /\b(auth\s*\(|session|currentUser|getUser|permission|requireUser|requireAuth)\b/i.test(text);
}

function hasScopeHint(text) {
  return /\b(userId|user\.id|accountId|orgId|tenantId|ownerId|workspaceId|teamId|projectId|where\s*:|filter\s*:)\b/i.test(text);
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function fingerprintFor(ruleId, relPath, symbol) {
  const stable = `${ruleId}|${normalizePath(relPath)}|${symbol || ''}`;
  return crypto.createHash('sha1').update(stable).digest('hex');
}

function violation({ ruleId, severity, relPath, line = 1, symbol = '', message, source = 'builtin', confidence = 'medium' }) {
  return {
    rule_id: ruleId,
    severity,
    path: normalizePath(relPath),
    line,
    symbol,
    message,
    fingerprint: fingerprintFor(ruleId, relPath, symbol),
    source,
    confidence,
  };
}

function scanSilentFailures(relPath, text) {
  if (!isSourceCodePath(relPath)) return [];
  const out = [];
  for (const match of text.matchAll(/\bcatch\s*(?:\([^)]*\))?\s*\{\s*\}/gsu)) {
    const before = text.slice(Math.max(0, (match.index || 0) - 40), match.index || 0);
    if (/['"`]\s*$/.test(before)) continue;
    if (/matchAll\s*\(\s*\/|RegExp\s*\(/.test(before)) continue;
    out.push(violation({
      ruleId: 'silent.catch.empty',
      severity: 'error',
      relPath,
      line: lineAt(text, match.index || 0),
      symbol: 'catch{}',
      message: 'Empty catch block hides failures; return a failure, log a redacted reason, or document an intentional fallback.',
      confidence: 'high',
    }));
  }
  for (const match of text.matchAll(/\.catch\s*\(\s*(?:async\s*)?\(?\s*[^)]*\)?\s*=>\s*\{\s*\}\s*\)/gsu)) {
    out.push(violation({
      ruleId: 'silent.promise_catch.empty',
      severity: 'error',
      relPath,
      line: lineAt(text, match.index || 0),
      symbol: '.catch-empty',
      message: 'Empty promise rejection handler hides failures; return a failure, log a redacted reason, or document an intentional fallback.',
      confidence: 'high',
    }));
  }
  for (const match of text.matchAll(/(?:^|\n)\s*except\s+(?:Exception|BaseException)?\s*:\s*pass\b/gu)) {
    out.push(violation({
      ruleId: 'silent.python_except.pass',
      severity: 'error',
      relPath,
      line: lineAt(text, match.index || 0),
      symbol: 'except-pass',
      message: 'Broad Python exception handler with pass hides failures; record a redacted reason or return an explicit fallback result.',
      confidence: 'high',
    }));
  }
  for (const match of text.matchAll(/\bcatch\s*(?:\([^)]*\))?\s*\{(?:(?!\}).){0,180}\breturn\s+(?:\[\]|null|undefined|false)\s*;?\s*\}/gsu)) {
    const block = match[0];
    if (/console\.|logger\.|reason|fallback|best[- ]?effort|optional|allowlist/i.test(block)) continue;
    out.push(violation({
      ruleId: 'silent.catch.fallback_no_reason',
      severity: 'warning',
      relPath,
      line: lineAt(text, match.index || 0),
      symbol: 'catch-fallback',
      message: 'Exception is converted to an empty/null fallback without log, metric, reason, or best-effort marker.',
      confidence: 'medium',
    }));
  }
  return out;
}

function scanClientServerBoundary(relPath, text) {
  if (!hasUseClientDirective(text)) return [];
  const out = [];
  const pattern = /^\s*import\s+(?!type\b)[^;\n]*\sfrom\s+['"]([^'"]+)['"]/gmu;
  for (const match of text.matchAll(pattern)) {
    const source = match[1] || '';
    if (/^(fs|path|crypto|child_process|server-only|next\/headers|next\/cookies|next\/server)$/.test(source)
      || /(^|\/)(server|db|database|repositories?|prisma|postgres)(\/|$)/i.test(source)) {
      out.push(violation({
        ruleId: 'boundary.import.server_in_client',
        severity: 'error',
        relPath,
        line: lineAt(text, match.index || 0),
        symbol: `import:${source}`,
        message: `Client file imports server/runtime module '${source}'. Move loading to a server boundary or pass shaped data into the client module.`,
        confidence: 'high',
      }));
    }
  }
  return out;
}

function scanWorkflowSecurity(relPath, text) {
  if (!/^\.github\/workflows\/.+\.ya?ml$/u.test(relPath)) return [];
  const out = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/\brun\s*:/.test(line) && /\$\{\{\s*(github\.event\.inputs|inputs)\./.test(line)) {
      out.push(violation({
        ruleId: 'workflow.input_interpolation.run',
        severity: 'error',
        relPath,
        line: index + 1,
        symbol: 'workflow-input-run',
        message: 'Workflow run command directly interpolates dispatch input; pass input through env and validate it before shell use.',
        confidence: 'high',
      }));
    }
    if (/\buses\s*:\s*[^\s#]+\/[^\s#]+@(?:v\d+|main|master)\b/.test(line)) {
      out.push(violation({
        ruleId: 'workflow.action.unpinned',
        severity: 'warning',
        relPath,
        line: index + 1,
        symbol: line.trim(),
        message: 'External workflow action is not pinned to a full commit SHA; consider pinning for supply-chain safety.',
        confidence: 'medium',
      }));
    }
  });
  return out;
}

function scanFileSizeAdvisory(relPath, text, settings) {
  const ext = path.extname(relPath).toLowerCase();
  if (!['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py'].includes(ext)) return [];
  const lineCount = text.split(/\r?\n/).length;
  const out = [];
  if (lineCount >= settings.source_file_review_lines) {
    out.push(violation({
      ruleId: 'file_size.review',
      severity: 'warning',
      relPath,
      symbol: 'source-file-review',
      message: `${lineCount} lines in source file; review whether responsibilities can move behind a clearer seam.`,
      confidence: 'medium',
    }));
  } else if (lineCount >= settings.source_file_warning_lines) {
    out.push(violation({
      ruleId: 'file_size.warning',
      severity: 'info',
      relPath,
      symbol: 'source-file-warning',
      message: `${lineCount} lines in source file; keep an eye on responsibility creep.`,
      confidence: 'medium',
    }));
  }
  return out;
}

function scanResponsibilityBudget(relPath, text, settings) {
  const ext = path.extname(relPath).toLowerCase();
  if (!['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py'].includes(ext)) return [];
  const lineCount = text.split(/\r?\n/).length;
  const out = [];
  const nextPage = relPath.endsWith('/page.tsx') && /(^|\/)(app|src\/app|apps\/[^/]+\/src\/app)\//.test(relPath);
  if (nextPage && lineCount > settings.next_page_review_lines) {
    out.push(violation({ ruleId: 'responsibility.page.budget', severity: 'warning', relPath, symbol: 'next-page', message: `${lineCount} lines in Next page; review loader/model/view split.`, confidence: 'medium' }));
  }
  if (hasUseClientDirective(text) && lineCount > settings.client_module_review_lines) {
    out.push(violation({ ruleId: 'responsibility.client.budget', severity: 'warning', relPath, symbol: 'use-client', message: `${lineCount} lines in client module; review hook/adapter/presentation split.`, confidence: 'medium' }));
  }
  const routeLike = /(^|\/)(api|routes?|controllers?|pages\/api)\//i.test(relPath) || /route\.(ts|js)$/.test(relPath);
  if (routeLike && lineCount >= settings.route_review_lines) {
    out.push(violation({ ruleId: 'responsibility.route.budget', severity: 'warning', relPath, symbol: 'route', message: `${lineCount} lines in route/controller-like file; review auth/validation/service/response seams.`, confidence: 'medium' }));
  }
  const scriptPipeline = /(^|\/)scripts\/(data|ops|import|imports|backfill|repair|migrate|migration)\//.test(relPath);
  if (scriptPipeline && lineCount >= settings.import_ops_script_review_lines) {
    out.push(violation({ ruleId: 'responsibility.script.budget', severity: 'warning', relPath, symbol: 'script-pipeline', message: `${lineCount} lines in import/ops-style script; review CLI/loader/transform/persist/report seams.`, confidence: 'medium' }));
  }
  if (ext === '.py' && /(^|\/)(main|.*orchestrator|.*runner|stage_runner)\.py$/.test(relPath) && lineCount >= settings.python_orchestrator_review_lines) {
    out.push(violation({ ruleId: 'responsibility.python_orchestrator.budget', severity: 'warning', relPath, symbol: 'python-orchestrator', message: `${lineCount} lines in Python orchestrator/runner; review policy/IO/runtime/notification/result seams.`, confidence: 'medium' }));
  }
  return out;
}

function scanStateSafety(relPath, text) {
  const out = [];
  if (!/\.(tsx?|jsx?)$/u.test(relPath)) return out;
  for (const match of text.matchAll(/\b[A-Za-z_$][\w$]*!\s*(?:\.|\[|\()/gu)) {
    out.push(violation({
      ruleId: 'state.non_null_assertion',
      severity: 'warning',
      relPath,
      line: lineAt(text, match.index || 0),
      symbol: match[0].trim(),
      message: 'Non-null assertion hides null or empty-state risk; prefer an explicit guard or fallback on the affected path.',
      confidence: 'medium',
    }));
  }
  if ((hasUseClientDirective(text) || /page\.(tsx|jsx)$/.test(relPath))
    && /\b(useQuery|useSuspenseQuery|fetch\s*\(|axios\.)\b/.test(text)
    && !/\b(isLoading|loading|isError|error|notFound|empty|Empty|skeleton|placeholder)\b/.test(text)) {
    out.push(violation({
      ruleId: 'state.async_ui_missing_fallback',
      severity: 'warning',
      relPath,
      symbol: 'async-ui-state',
      message: 'Async UI path has data-loading hints but no obvious loading, empty, or error fallback; review state handling before ship.',
      confidence: 'low',
    }));
  }
  return out;
}

function scanAuthzDataIsolation(relPath, text) {
  if (!isRouteLikePath(relPath)) return [];
  const out = [];
  const hasDbAccess = hasPersistenceAccess(text);
  const authContextVisible = hasAuthContext(text);
  const scopeVisible = hasScopeHint(text);
  if (hasDbAccess && authContextVisible && !scopeVisible && !hasReadHandler(text)) {
    out.push(violation({
      ruleId: 'authz.scope_not_visible',
      severity: 'warning',
      relPath,
      symbol: 'authz-scope',
      message: 'Route uses auth context and persistence but no obvious owner or tenant filter is visible; review data isolation before ship.',
      confidence: 'low',
    }));
  }
  if (hasDbAccess && hasReadHandler(text) && !authContextVisible) {
    out.push(violation({
      ruleId: 'authz.read_without_auth_context',
      severity: 'warning',
      relPath,
      symbol: 'authz-read',
      message: 'Read path touches persistence without obvious auth or permission context; confirm whether the route is intentionally public.',
      confidence: 'low',
    }));
  }
  if (hasDbAccess && hasReadHandler(text) && authContextVisible && !scopeVisible) {
    out.push(violation({
      ruleId: 'authz.read_scope_not_visible',
      severity: 'warning',
      relPath,
      symbol: 'authz-read-scope',
      message: 'Read path uses auth context and persistence but no obvious owner or tenant filter is visible; review data isolation before ship.',
      confidence: 'low',
    }));
  }
  if (hasDbAccess
    && hasMutationHandler(text)
    && !authContextVisible) {
    out.push(violation({
      ruleId: 'authz.mutation_without_auth_context',
      severity: 'warning',
      relPath,
      symbol: 'authz-mutation',
      message: 'Mutation path touches persistence without obvious auth or permission context; confirm whether the route is intentionally public.',
      confidence: 'low',
    }));
  }
  return out;
}

function scanRuntimeEnvSafety(relPath, text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/\bprocess\.env\.(?!NODE_ENV\b|JHSTE_HOOK_ACTIVE\b)[A-Z0-9_]+\b/.test(line) && !/\?\?|\|\||default|safeParse|parseEnv|assertEnv|requiredEnv|validate|schema/i.test(line)) {
      out.push(violation({
        ruleId: 'runtime.env_direct_access',
        severity: 'warning',
        relPath,
        line: index + 1,
        symbol: line.trim(),
        message: 'Env var is read directly without an obvious validation or fallback path; review build/runtime setup safety.',
        confidence: 'medium',
      }));
    }
    if (/\bimport\.meta\.env\.(?!MODE\b|DEV\b|PROD\b|SSR\b)[A-Z0-9_]+\b/.test(line) && !/\?\?|\|\||default|safeParse|validate|schema/i.test(line)) {
      out.push(violation({
        ruleId: 'runtime.import_meta_env_direct_access',
        severity: 'warning',
        relPath,
        line: index + 1,
        symbol: line.trim(),
        message: 'Client env var is read directly without an obvious fallback or validation; review runtime safety before ship.',
        confidence: 'medium',
      }));
    }
    if (/\bos\.getenv\(['"][A-Z0-9_]+['"]\)/.test(line) && !/\bor\b|\bif\b|default|validate|schema/i.test(line)) {
      out.push(violation({
        ruleId: 'runtime.getenv_direct_access',
        severity: 'warning',
        relPath,
        line: index + 1,
        symbol: line.trim(),
        message: 'Python env lookup has no obvious fallback or validation; review startup/runtime safety.',
        confidence: 'medium',
      }));
    }
  });
  return out;
}

function scanWriteSafety(relPath, text) {
  const out = [];
  const hasWrite = hasPersistenceWrite(text);
  const writeSafetyPath = isRouteLikePath(relPath)
    || isScriptPipelinePath(relPath)
    || /(^|\/)(repositories?|queries|db|database|migrations?)\//i.test(relPath);
  if (writeSafetyPath
    && hasWrite
    && /(forEach\s*\(|for\s*\([^)]*;|for\s*\(\s*const\s+.+\s+of\s+|\.map\s*\(|while\s*\()/i.test(text)
    && !/\b(transaction|batch|Promise\.allSettled|idempotenc|dedup|dedupe|upsert|ON CONFLICT|on conflict)\b/i.test(text)) {
    out.push(violation({
      ruleId: 'write.loop_without_transaction',
      severity: 'warning',
      relPath,
      symbol: 'write-loop',
      message: 'Repeated writes appear inside a loop without an obvious transaction, batch, or dedupe strategy; review write safety before ship.',
      confidence: 'low',
    }));
  }
  if (isRouteLikePath(relPath)
    && hasMutationHandler(text)
    && hasWrite
    && !/\b(idempotenc|dedup|dedupe|upsert|transaction|ON CONFLICT|on conflict)\b/i.test(text)) {
    out.push(violation({
      ruleId: 'write.mutation_retry_safety',
      severity: 'warning',
      relPath,
      symbol: 'mutation-retry-safety',
      message: 'Mutation route has no obvious idempotency, dedupe, or transaction marker; review duplicate execution and partial-write risk.',
      confidence: 'low',
    }));
  }
  return out;
}

function scanApiContractCompatibility(relPath, text) {
  if (!isRouteLikePath(relPath)) return [];
  const out = [];
  if (/\b(request\.json\(|req\.body\b|params\.[A-Za-z_$]|\bsearchParams\.get\(|new URLSearchParams\b)/.test(text)
    && !/\b(safeParse|parseAsync|schema|z\.object|validate|validator|assert)\b/.test(text)) {
    out.push(violation({
      ruleId: 'contract.boundary_without_schema',
      severity: 'warning',
      relPath,
      symbol: 'boundary-without-schema',
      message: 'Route reads request body, params, or search params without an obvious schema or validator; review contract compatibility before ship.',
      confidence: 'medium',
    }));
  }
  if (/\b(Response\.json|NextResponse\.json|res\.json)\(\s*await\s+(?:prisma|db|client|pool)|\breturn\s+(?:await\s+)?(?:prisma|db|client|pool)\./.test(text)) {
    out.push(violation({
      ruleId: 'contract.raw_storage_response',
      severity: 'warning',
      relPath,
      symbol: 'raw-storage-response',
      message: 'Route appears to expose storage-shaped data directly; review DTO mapping and caller compatibility before ship.',
      confidence: 'low',
    }));
  }
  return out;
}

function scanPerformanceDuplicateFetch(relPath, text) {
  const out = [];
  if (!/\.(tsx?|jsx?)$/u.test(relPath)) return out;
  const fetchCount = countMatches(text, /\b(fetch\s*\(|axios\.|useQuery\s*\(|useSuspenseQuery\s*\()/g);
  if (fetchCount >= 2) {
    out.push(violation({
      ruleId: 'performance.multiple_fetch_sources',
      severity: 'warning',
      relPath,
      symbol: `fetch-count:${fetchCount}`,
      message: 'File appears to trigger multiple fetch paths; review whether duplicate requests or split caches are avoidable.',
      confidence: 'low',
    }));
  }
  if (hasUseClientDirective(text) && /useEffect\s*\([\s\S]{0,500}\b(fetch\s*\(|axios\.)/su.test(text)) {
    out.push(violation({
      ruleId: 'performance.fetch_in_effect',
      severity: 'warning',
      relPath,
      symbol: 'fetch-in-effect',
      message: 'Client module fetches inside useEffect; review whether the request can move to a cached loader or shared data hook.',
      confidence: 'low',
    }));
  }
  return out;
}

function scanSecretLogging(relPath, text) {
  if (!isSourceCodePath(relPath)) return [];
  const out = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/\b(console\.(log|info|warn|error|debug)|logger\.(info|warn|error|debug)|print)\s*\(/.test(line)
      && /\b(secret|token|password|authorization|cookie|session|api[_-]?key)\b/i.test(line)) {
      out.push(violation({
        ruleId: 'secret.logging',
        severity: 'error',
        relPath,
        line: index + 1,
        symbol: 'secret-like-log',
        message: 'Log statement references secret-like data; log a stable request id or redacted reason code instead.',
        confidence: 'high',
      }));
    }
  });
  return out;
}

function scanSqlParameterBinding(relPath, text) {
  if (!isSourceCodePath(relPath)) return [];
  const out = [];
  const rawSqlTemplate = /`[^`]*(SELECT|INSERT|UPDATE|DELETE)[^`]*\$\{[^`]+`/isu;
  const rawSqlConcat = /(?:query|execute)\s*\(\s*['"][^'"]*(SELECT|INSERT|UPDATE|DELETE)[^'"]*['"]\s*\+/isu;
  const pythonFStringSql = /f["'][^"']*(SELECT|INSERT|UPDATE|DELETE)[^"']*\{[^"']+["']/isu;
  if (rawSqlTemplate.test(text) || rawSqlConcat.test(text) || pythonFStringSql.test(text)) {
    out.push(violation({
      ruleId: 'sql.raw_interpolation',
      severity: 'error',
      relPath,
      symbol: 'raw-sql-interpolation',
      message: 'SQL-like string interpolation detected; use placeholders and pass values separately.',
      confidence: 'high',
    }));
  }
  return out;
}

function scanPublicSafeError(relPath, text) {
  if (!isRouteLikePath(relPath)) return [];
  const out = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/\b(Response\.json|NextResponse\.json|res\.json)\b/.test(line)
      && /\b(stack|error\.message|err\.message|cause|details)\b/i.test(line)) {
      out.push(violation({
        ruleId: 'error.public_raw_details',
        severity: 'warning',
        relPath,
        line: index + 1,
        symbol: 'public-error-details',
        message: 'Public response appears to include raw error details; map to a stable public code and keep diagnostics internal.',
        confidence: 'medium',
      }));
    }
  });
  return out;
}

function scanDbRowValidation(relPath, text) {
  if (!isRouteLikePath(relPath)) return [];
  const out = [];
  const directStorageResponse = /\b(Response\.json|NextResponse\.json|res\.json)\(\s*await\s+(?:prisma|db|client|pool)\b/su;
  const rawVariable = /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+(?:prisma|db|client|pool)\b/su.exec(text);
  if (directStorageResponse.test(text)
    || (rawVariable && new RegExp(`\\b(Response\\.json|NextResponse\\.json|res\\.json)\\(\\s*${rawVariable[1]}\\b`).test(text))) {
    out.push(violation({
      ruleId: 'database.raw_row_public_response',
      severity: 'warning',
      relPath,
      symbol: 'raw-row-response',
      message: 'Route appears to return storage-shaped data directly; validate or map rows before public DTO output.',
      confidence: 'low',
    }));
  }
  return out;
}

function scanThinApiRoute(relPath, text) {
  if (!isRouteLikePath(relPath) || !hasPersistenceAccess(text)) return [];
  return [violation({
    ruleId: 'route.direct_db_access',
    severity: 'warning',
    relPath,
    symbol: 'route-db-access',
    message: 'Route/controller appears to contain direct persistence access; review whether auth, validation, usecase, repository, and response seams are thin enough.',
    confidence: 'low',
  })];
}

function scanTypeEscapeAdvisory(relPath, text) {
  if (!/\.(tsx?|jsx?)$/u.test(relPath)) return [];
  const out = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/\bas\s+any\b|:\s*any\b|@ts-ignore/.test(line)) {
      out.push(violation({
        ruleId: 'type.escape',
        severity: 'warning',
        relPath,
        line: index + 1,
        symbol: 'type-escape',
        message: 'Broad TypeScript escape detected; localize it or add a boundary parser/type guard where data enters.',
        confidence: 'medium',
      }));
    }
  });
  return out;
}

function scanSideEffectBoundary(relPath, text) {
  if (!/\.(tsx?|jsx?|mjs|cjs|py)$/u.test(relPath)) return [];
  if (/function\s+(format|helper|build|make|map)\w*\s*\([^)]*\)\s*{[\s\S]{0,1200}\b(fetch|writeFile|readFile|exec|spawn|setTimeout)\b/.test(text)) {
    return [violation({
      ruleId: 'side_effect.hidden_in_helper',
      severity: 'warning',
      relPath,
      symbol: 'hidden-side-effect',
      message: 'Generic helper appears to perform a side effect; make the side-effect seam visible in name, directory, or dependency injection.',
      confidence: 'low',
    })];
  }
  return [];
}

function scanCrawlerProducerBoundary(relPath, text) {
  if (!isCrawlerProducerPath(relPath) || !hasPersistenceWrite(text)) return [];
  return [violation({
    ruleId: 'crawler.producer_direct_persistence',
    severity: 'warning',
    relPath,
    symbol: 'crawler-direct-write',
    message: 'Crawler/automation producer appears to write directly to persistence; review artifact handoff and consumer-side validation before ship.',
    confidence: 'low',
  })];
}

function scanBroadExceptionAdvisory(relPath, text) {
  if (!relPath.endsWith('.py')) return [];
  const out = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/^\s*except\s*(?:Exception|BaseException)?\s*(?:as\s+\w+)?\s*:/.test(line) && !/\bpass\b/.test(line)) {
      out.push(violation({
        ruleId: 'python.broad_exception',
        severity: 'warning',
        relPath,
        line: index + 1,
        symbol: 'broad-exception',
        message: 'Broad Python exception handler detected; prefer specific exceptions or record a clear fallback reason.',
        confidence: 'low',
      }));
    }
  });
  return out;
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

function applyProfileModes(violations, profile) {
  return violations
    .map((item) => decorateViolation(item, profile))
    .filter((item) => ACTIVE_PROFILE_MODES.has(item.effective_mode));
}

function scanFile(repoRoot, relPath, settings) {
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
  return {
    violations: applyProfileModes([
      ...scanSilentFailures(relPath, text),
      ...scanSecretLogging(relPath, text),
      ...scanClientServerBoundary(relPath, text),
      ...scanWorkflowSecurity(relPath, text),
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
    ], settings.profile),
    failure: null,
  };
}

function loadBaseline(repoRoot, baselinePath) {
  if (!fs.existsSync(baselinePath)) return new Map();
  try {
    const data = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    const items = Array.isArray(data.violations) ? data.violations : [];
    return new Map(items.filter((item) => typeof item.fingerprint === 'string').map((item) => [item.fingerprint, item]));
  } catch (error) {
    failConfig(`Failed to parse baseline ${relativeDisplay(repoRoot, baselinePath)}.`, [error instanceof Error ? error.message : String(error)]);
  }
  return new Map();
}

function writeBaseline(baselinePath, violations) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  const now = nowIso();
  const rows = violations.map((item) => ({
    fingerprint: item.fingerprint,
    rule_id: item.rule_id,
    path: item.path,
    severity: item.severity,
    first_seen: now,
    last_seen: now,
    reason: 'accepted baseline debt; review before enforcing',
  }));
  fs.writeFileSync(baselinePath, `${JSON.stringify({ version: 1, created_at: now, updated_at: now, violations: rows }, null, 2)}\n`);
}

function applyBaseline(violations, baselineMap, mode) {
  if (!['off', 'use', 'update', 'ratchet'].includes(mode)) failConfig(`Unsupported --baseline ${mode}. Use off, use, update, or ratchet.`);
  if (mode === 'off' || mode === 'update') return violations.map((item) => ({ ...item, baseline_status: 'unmanaged' }));
  return violations.map((item) => ({ ...item, baseline_status: baselineMap.has(item.fingerprint) ? 'matched' : 'new' }));
}

function summarize(violations, failures = []) {
  const active = violations.filter((item) => item.baseline_status !== 'matched');
  const summary = { error: 0, warning: 0, info: 0, suppressed: violations.length - active.length, failures: failures.length };
  for (const item of active) summary[item.severity] = (summary[item.severity] || 0) + 1;
  return summary;
}

function guardResult(violations, failures = [], meta = {}) {
  return {
    schema_version: 1,
    generated_at: nowIso(),
    summary: summarize(violations, failures),
    meta,
    violations,
    failures,
  };
}

function severityMeets(severity, threshold) {
  if (threshold === 'none') return false;
  const severityIndex = SEVERITIES.indexOf(severity);
  const thresholdIndex = SEVERITIES.indexOf(threshold);
  return severityIndex >= thresholdIndex;
}

function exitCodeFor(result, failOn, baselineMode) {
  if (result.failures.length > 0) return EXIT_GUARD_FAILURE;
  if (baselineMode === 'update') return 0;
  const active = result.violations.filter((item) => item.baseline_status !== 'matched');
  if (baselineMode === 'ratchet' && active.length > 0) return EXIT_VIOLATION;
  if (active.some((item) => severityMeets(item.severity, failOn))) return EXIT_VIOLATION;
  return 0;
}

function printResult(result, format) {
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
  const visible = result.violations.filter((item) => item.baseline_status !== 'matched').slice(0, 80);
  if (visible.length) {
    console.log('\nViolations:');
    for (const item of visible) {
      const confidence = item.confidence ? ` [${item.confidence}-confidence]` : '';
      const family = item.rule_family && item.rule_family !== item.rule_id ? ` (${item.rule_family})` : '';
      console.log(`- [${item.severity}]${confidence} ${item.rule_id}${family} ${item.path}:${item.line} — ${item.message}`);
    }
    if (result.violations.length > visible.length) console.log(`- ... ${result.violations.length - visible.length} more omitted from text output`);
  }
}

function compactOutput(text) {
  const value = String(text || '').trim();
  if (value.length <= PROFILE_OUTPUT_LIMIT) return value;
  return `${value.slice(0, PROFILE_OUTPUT_LIMIT)}\n... truncated ${value.length - PROFILE_OUTPUT_LIMIT} chars`;
}

function safeCommandRuleId(name) {
  const slug = String(name || 'unnamed').toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '');
  return `profile.command.${slug || 'unnamed'}`;
}

function parseProfileCommands(repoRoot) {
  const profilePath = path.join(repoRoot, '.jhste', 'profile.yaml');
  if (!fs.existsSync(profilePath)) return [];
  const lines = fs.readFileSync(profilePath, 'utf8').split(/\r?\n/);
  const commands = [];
  let inCommands = false;
  let current = null;
  for (const line of lines) {
    if (/^commands:\s*$/.test(line)) { inCommands = true; continue; }
    if (inCommands && /^\S/.test(line) && !/^commands:/.test(line)) break;
    if (!inCommands) continue;
    const name = /^\s*-\s+name:\s*(.+?)\s*$/.exec(line);
    if (name) {
      current = { name: name[1].replace(/^['"]|['"]$/g, ''), run: '', severity: 'error', timeoutSeconds: 120 };
      commands.push(current);
      continue;
    }
    const run = /^\s+run:\s*(.+?)\s*$/.exec(line);
    if (run && current) current.run = run[1].replace(/^['"]|['"]$/g, '');
    const severity = /^\s+severity:\s*(.+?)\s*$/.exec(line);
    if (severity && current) current.severity = severity[1].replace(/^['"]|['"]$/g, '');
    const timeout = /^\s+timeout_seconds:\s*(\d+)\s*$/.exec(line);
    if (timeout && current) current.timeoutSeconds = Number(timeout[1]);
  }
  for (const command of commands) {
    if (!command.name || !command.run) failConfig('Each profile command needs name and run fields.');
    if (!SEVERITIES.includes(command.severity)) failConfig(`Profile command ${command.name} has unsupported severity ${command.severity}.`);
    if (!Number.isFinite(command.timeoutSeconds) || command.timeoutSeconds <= 0 || command.timeoutSeconds > 1800) {
      failConfig(`Profile command ${command.name} has invalid timeout_seconds; use 1..1800.`);
    }
  }
  return commands;
}

function runProfileCommands(repoRoot) {
  const commands = parseProfileCommands(repoRoot);
  const violations = [];
  const failures = [];
  for (const command of commands) {
    const result = spawnSync(command.run, [], {
      cwd: repoRoot,
      shell: true,
      encoding: 'utf8',
      timeout: command.timeoutSeconds ? command.timeoutSeconds * 1000 : DEFAULT_COMMAND_TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
    });
    if (result.error) {
      failures.push({
        code: 'profile.command.runtime',
        message: `Profile command could not run: ${command.name}`,
        details: [result.error.message, command.run],
      });
      continue;
    }
    if (result.status !== 0) {
      const output = compactOutput([result.stdout, result.stderr].filter(Boolean).join('\n'));
      violations.push(violation({
        ruleId: safeCommandRuleId(command.name),
        severity: command.severity,
        relPath: '.jhste/profile.yaml',
        line: 1,
        symbol: command.name,
        message: `Profile command failed: ${command.name}`,
        source: 'profile',
        confidence: 'high',
      }));
      if (output) violations[violations.length - 1].details = [`exit=${result.status}`, output];
    }
  }
  return { violations, failures };
}

function toolVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(KIT_ROOT, 'package.json'), 'utf8'));
    return String(pkg.version || '0.0.0');
  } catch {
    return '0.0.0';
  }
}

async function main() {
  const startedAt = Date.now();
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = findGitRoot(args.repo || process.cwd());
  const profileState = loadProfileConfig(repoRoot);
  const profileErrors = validateProfileConfig(profileState.profile);
  if (profileErrors.length) failConfig(`Invalid profile ${relativeDisplay(repoRoot, profileState.path)}.`, profileErrors);
  const format = String(args.format || profileState.profile.guard.default_format || 'text');
  if (!['text', 'json'].includes(format)) failConfig('--format must be text or json.');
  currentFormat = format;
  const failOn = String(args['fail-on'] || profileState.profile.guard.fail_on || 'none');
  if (!['none', 'warning', 'error'].includes(failOn)) failConfig('--fail-on must be none, warning, or error.');
  const baselineMode = String(args.baseline || (profileState.profile.baseline.enabled ? 'use' : 'off'));
  if (!['off', 'use', 'update', 'ratchet'].includes(baselineMode)) failConfig(`Unsupported --baseline ${baselineMode}. Use off, use, update, or ratchet.`);
  const baselinePath = path.resolve(repoRoot, String(args['baseline-path'] || profileState.profile.baseline.path || DEFAULT_BASELINE_PATH));
  if (inManagedHook() && baselineMode === 'update') {
    failConfig('Managed hook execution is read-only; --baseline update is not allowed while JHSTE_HOOK_ACTIVE=1.');
  }
  if (baselineMode === 'ratchet' && !fs.existsSync(baselinePath)) {
    failConfig(`--baseline ratchet requires an existing baseline at ${relativeDisplay(repoRoot, baselinePath)}.`);
  }
  const scopedArgs = { ...args, scope: args.scope || profileState.profile.guard.default_scope || 'changed' };
  const scope = resolveScopeFiles(repoRoot, scopedArgs);
  const violations = [];
  const failures = [];
  const scanSettings = {
    profile: profileState.profile,
    fileSize: fileSizeSettings(profileState.profile),
    responsibilityBudget: responsibilityBudgetSettings(profileState.profile),
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
    const profile = runProfileCommands(repoRoot);
    violations.push(...profile.violations);
    failures.push(...profile.failures);
  }
  const baselineMap = loadBaseline(repoRoot, baselinePath);
  if (baselineMode === 'update' && failures.length === 0) writeBaseline(baselinePath, violations);
  const managed = applyBaseline(violations, baselineMap, baselineMode);
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
  printResult(result, 'text');
  process.exit(EXIT_GUARD_FAILURE);
});
