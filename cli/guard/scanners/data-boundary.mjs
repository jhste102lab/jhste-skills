import {
  hasAuthContext,
  hasMutationHandler,
  hasPersistenceAccess,
  hasPersistenceWrite,
  hasReadHandler,
  hasScopeHint,
  isCrawlerProducerPath,
  isRouteLikePath,
  isScriptPipelinePath,
  isSourceCodePath,
  violation,
} from './utils.mjs';

export function scanAuthzDataIsolation(relPath, text) {
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
  if (hasDbAccess && hasMutationHandler(text) && !authContextVisible) {
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

export function scanWriteSafety(relPath, text) {
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

export function scanApiContractCompatibility(relPath, text) {
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

export function scanSqlParameterBinding(relPath, text) {
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

export function scanPublicSafeError(relPath, text) {
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

export function scanDbRowValidation(relPath, text) {
  if (!isRouteLikePath(relPath)) return [];
  const directStorageResponse = /\b(Response\.json|NextResponse\.json|res\.json)\(\s*await\s+(?:prisma|db|client|pool)\b/su;
  const rawVariables = [...text.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+(?:prisma|db|client|pool)\b/gsu)].map((match) => match[1]);
  const responseExpressions = [...text.matchAll(/\b(?:Response\.json|NextResponse\.json|res\.json)\(([\s\S]{0,300})\)/gu)].map((match) => match[1] || '');
  const rawVariableReturned = rawVariables.some((name) => responseExpressions.some((expr) => new RegExp(`\\b${name}\\b`).test(expr)));
  if (!directStorageResponse.test(text) && !rawVariableReturned) return [];
  return [violation({
    ruleId: 'database.raw_row_public_response',
    severity: 'warning',
    relPath,
    symbol: 'raw-row-response',
    message: 'Route appears to return storage-shaped data directly; validate or map rows before public DTO output.',
    confidence: 'low',
    relatedKey: 'raw-storage-response',
  })];
}

export function scanThinApiRoute(relPath, text) {
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

export function scanCrawlerProducerBoundary(relPath, text) {
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
