import path from 'node:path';
import crypto from 'node:crypto';

export function normalizePath(value) {
  return value.replaceAll(path.sep, '/').replace(/^\.\//, '');
}

export function lineAt(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

export function hasUseClientDirective(text) {
  return /^\s*(?:"use client"|'use client')\s*;?/u.test(text);
}

export function isRouteLikePath(relPath) {
  return /(^|\/)(api|routes?|controllers?|pages\/api)\//i.test(relPath) || /route\.(ts|js)$/.test(relPath);
}

export function isScriptPipelinePath(relPath) {
  return /(^|\/)scripts\/(data|ops|import|imports|backfill|repair|migrate|migration)\//.test(relPath);
}

export function isSourceCodePath(relPath) {
  return ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py'].includes(path.extname(relPath).toLowerCase());
}

export function isCrawlerProducerPath(relPath) {
  return /(^|\/)(crawler|crawlers|scraper|scrapers|automation|workers?|schedulers?)\//i.test(relPath)
    || /crawler|scraper|automation|producer/i.test(path.basename(relPath));
}

export function hasPersistenceRead(text) {
  return /\b(prisma\.\w+\.(find(?:Unique|First|Many)?|aggregate|count)|pool\.query|client\.query|db\.|database\.)\b/i.test(text)
    || /\bSELECT\b[\s\S]{0,120}\bFROM\b/i.test(text);
}

export function hasPersistenceWrite(text) {
  return /\b(prisma\.\w+\.(create|update|delete|upsert)|pool\.query|client\.query|db\.)\b/i.test(text)
    || /\b(INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM)\b/i.test(text);
}

export function hasPersistenceAccess(text) {
  return hasPersistenceRead(text) || hasPersistenceWrite(text);
}

export function hasReadHandler(text) {
  return /\b(export\s+async\s+function\s+GET|router\.get|app\.get)\b/i.test(text);
}

export function hasMutationHandler(text) {
  return /\b(export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)|router\.(post|put|patch|delete)|app\.(post|put|patch|delete))\b/i.test(text);
}

export function hasAuthContext(text) {
  return /\b(auth\s*\(|session|currentUser|getUser|permission|requireUser|requireAuth)\b/i.test(text);
}

export function hasScopeHint(text) {
  return /\b(userId|user\.id|accountId|orgId|tenantId|ownerId|workspaceId|teamId|projectId|where\s*:|filter\s*:)\b/i.test(text);
}

export function countMatches(text, pattern) {
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
