import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { effectiveRuleMode } from '../../profile.mjs';
import { FINDING_METADATA } from '../registry.mjs';
import { externalInputValidationFindings } from './external-input.mjs';

const ACTIVE_PROFILE_MODES = new Set(['advisory', 'changed-files', 'baseline-new-only', 'strict']);

function normalizePath(value) {
  return value.replaceAll(path.sep, '/').replace(/^\.\//, '');
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

function occurrenceKeyFor(ruleId, relPath, symbol, line) {
  const stable = `${ruleId}|${normalizePath(relPath)}|${line || 1}|${symbol || ''}`;
  return crypto.createHash('sha1').update(stable).digest('hex').slice(0, 16);
}

function fingerprintFor(ruleId, relPath, occurrenceKey) {
  const stable = `${ruleId}|${normalizePath(relPath)}|${occurrenceKey}`;
  return crypto.createHash('sha1').update(stable).digest('hex');
}

export function violation({ ruleId, severity, relPath, line = 1, symbol = '', message, source = 'builtin', confidence = 'medium', relatedKey = '' }) {
  const isHeuristic = confidence !== 'high';
  const occurrenceKey = occurrenceKeyFor(ruleId, relPath, symbol, line);
  return {
    rule_id: ruleId,
    severity,
    path: normalizePath(relPath),
    line,
    symbol,
    message,
    occurrence_key: occurrenceKey,
    fingerprint: fingerprintFor(ruleId, relPath, occurrenceKey),
    source,
    confidence,
    category: isHeuristic ? 'heuristic_candidate' : 'proof_like',
    why_not_proof: isHeuristic ? 'Pattern-based scanner result; confirm against code context before treating as proof.' : null,
    related_key: relatedKey || null,
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

function scanExternalInputValidation(relPath, text) {
  if (!isSourceCodePath(relPath)) return [];
  return externalInputValidationFindings(relPath, text).map((item) => violation(item));
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
      relatedKey: 'raw-storage-response',
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
      const withoutStrings = line.replace(/(['"`])(?:\\.|(?!\1).)*\1/gu, '');
      const hasSecretIdentifier = /\b[A-Za-z_$][\w$]*(secret|token|password|authorization|cookie|session|apiKey|api_key)[\w$]*\b/i.test(withoutStrings)
        || /\b(secret|token|password|authorization|cookie|session|api[_-]?key)[A-Za-z_$][\w$]*\b/i.test(withoutStrings);
      const stringOnly = !hasSecretIdentifier;
      out.push(violation({
        ruleId: 'secret.logging',
        severity: stringOnly ? 'warning' : 'error',
        relPath,
        line: index + 1,
        symbol: 'secret-like-log',
        message: stringOnly
          ? 'Log message contains secret-like wording; confirm it does not include secret values.'
          : 'Log statement references secret-like data; log a stable request id or redacted reason code instead.',
        confidence: stringOnly ? 'low' : 'high',
      }));
    }
  });
  return out;
}

function scanSqlParameterBinding(relPath, text) {
  if (!isSourceCodePath(relPath)) return [];
  const out = [];
  const rawSqlTemplate = /(?:(\b(?:sql|Prisma\.sql|db\.sql|pgSql))\s*)?`[^`]*(?:SELECT\s+[\s\S]{0,120}\s+FROM|INSERT\s+INTO|UPDATE\s+[A-Za-z_][\w.]*\s+SET|DELETE\s+FROM)[^`]*\$\{[^`]+`/gis;
  const rawSqlConcat = /(?:query|execute)\s*\(\s*['"][^'"]*(?:SELECT\s+[\s\S]{0,120}\s+FROM|INSERT\s+INTO|UPDATE\s+[A-Za-z_][\w.]*\s+SET|DELETE\s+FROM)[^'"]*['"]\s*\+/isu;
  const pythonFStringSql = /f["'][^"']*(?:SELECT\s+[\s\S]{0,120}\s+FROM|INSERT\s+INTO|UPDATE\s+[A-Za-z_][\w.]*\s+SET|DELETE\s+FROM)[^"']*\{[^"']+["']/isu;
  const unsafeTemplate = [...text.matchAll(rawSqlTemplate)].some((match) => !match[1]);
  const assembledQueryNames = new Set();
  for (const match of text.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:`[^`]*(?:SELECT\s+[\s\S]{0,120}\s+FROM|INSERT\s+INTO|UPDATE\s+[A-Za-z_][\w.]*\s+SET|DELETE\s+FROM)[^`]*\$\{[^`]+`|['"][^'"]*(?:SELECT\s+[\s\S]{0,120}\s+FROM|INSERT\s+INTO|UPDATE\s+[A-Za-z_][\w.]*\s+SET|DELETE\s+FROM)[^'"]*['"]\s*\+)/gis)) {
    assembledQueryNames.add(match[1]);
  }
  const assembledQueryExecuted = [...assembledQueryNames].some((name) => new RegExp(`\\b(?:query|execute)\\s*\\(\\s*${name}\\b`).test(text));
  if (unsafeTemplate || rawSqlConcat.test(text) || pythonFStringSql.test(text) || assembledQueryExecuted) {
    out.push(violation({
      ruleId: 'sql.raw_interpolation',
      severity: assembledQueryExecuted && !unsafeTemplate ? 'warning' : 'error',
      relPath,
      symbol: assembledQueryExecuted ? 'assembled-query-interpolation' : 'raw-sql-interpolation',
      message: assembledQueryExecuted
        ? 'SQL-like query string appears assembled before execution; verify placeholders are used instead of raw interpolation.'
        : 'SQL-like string interpolation detected; use placeholders and pass values separately.',
      confidence: assembledQueryExecuted && !unsafeTemplate ? 'medium' : 'high',
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
  const rawVariables = [...text.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+(?:prisma|db|client|pool)\b/gsu)].map((match) => match[1]);
  const responseExpressions = [...text.matchAll(/\b(?:Response\.json|NextResponse\.json|res\.json)\(([\s\S]{0,300})\)/gu)].map((match) => match[1] || '');
  const rawVariableReturned = rawVariables.some((name) => responseExpressions.some((expr) => new RegExp(`\\b${name}\\b`).test(expr)));
  if (directStorageResponse.test(text) || rawVariableReturned) {
    out.push(violation({
      ruleId: 'database.raw_row_public_response',
      severity: 'warning',
      relPath,
      symbol: 'raw-row-response',
      message: 'Route appears to return storage-shaped data directly; validate or map rows before public DTO output.',
      confidence: 'low',
      relatedKey: 'raw-storage-response',
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

function profileUsesMode(profile, mode) {
  if (profile?.mode === mode) return true;
  if (Object.values(profile?.packs || {}).some((config) => config?.mode === mode)) return true;
  if (Object.values(profile?.rules || {}).some((config) => config?.mode === mode)) return true;
  return false;
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
