import {
  hasPersistenceRead,
  hasPersistenceWrite,
  localWindow,
  maskCommentsAndStrings,
} from './utils.mjs';

const scopeToken = /\b(userId|user\.id|accountId|orgId|tenantId|ownerId|workspaceId|teamId|projectId)\b/i;
const loopPattern = /(forEach\s*\(|for\s*\([^)]*;|for\s*\(\s*const\s+.+\s+of\s+|\.map\s*\(|while\s*\()/i;

function callWindow(maskedText, index, after = 900) {
  const source = String(maskedText || '');
  const open = source.indexOf('(', Number(index || 0));
  if (open < 0 || open - Number(index || 0) > 120) return localWindow(source, index, 0, after);
  let depth = 0;
  const endLimit = Math.min(source.length, Number(index || 0) + after);
  for (let cursor = open; cursor < endLimit; cursor += 1) {
    if (source[cursor] === '(') depth += 1;
    if (source[cursor] === ')') {
      depth -= 1;
      if (depth === 0) return source.slice(Number(index || 0), cursor + 1);
    }
  }
  return localWindow(source, index, 0, after);
}

function statementWindow(text, index, before = 900, after = 900) {
  const source = String(text || '');
  const masked = maskCommentsAndStrings(source);
  const anchor = Number(index || 0);
  const min = Math.max(0, anchor - before);
  let start = min;
  for (let cursor = anchor - 1; cursor >= min; cursor -= 1) {
    if (/[;{}]/u.test(masked[cursor])) {
      start = cursor + 1;
      break;
    }
  }
  const max = Math.min(source.length, anchor + after);
  let end = max;
  for (let cursor = anchor; cursor < max; cursor += 1) {
    if (masked[cursor] === ';') {
      end = cursor + 1;
      break;
    }
  }
  return source.slice(start, end);
}

function collectPersistenceAccesses(text, { reads = true, writes = true } = {}) {
  const source = String(text || '');
  const masked = maskCommentsAndStrings(source);
  const accesses = [];
  const addMaskedCalls = (pattern) => {
    for (const match of masked.matchAll(pattern)) {
      accesses.push({
        index: match.index || 0,
        window: callWindow(masked, match.index || 0),
      });
    }
  };
  const addTextWindows = (pattern, before = 40, after = 700) => {
    for (const match of source.matchAll(pattern)) {
      accesses.push({
        index: match.index || 0,
        window: localWindow(source, match.index || 0, before, after),
      });
    }
  };

  if (reads) addMaskedCalls(/\bprisma\.\w+\.(find(?:Unique|First|Many)?|aggregate|count)\s*\(/gi);
  if (writes) addMaskedCalls(/\bprisma\.\w+\.(create|update|delete|upsert)\s*\(/gi);
  if (reads) addTextWindows(/\bSELECT\b[\s\S]{0,180}\bFROM\b/gi);
  if (writes) addTextWindows(/\b(UPDATE\s+\w+\s+SET|DELETE\s+FROM|INSERT\s+INTO)\b/gi);
  if (reads || writes) {
    addMaskedCalls(/\b(pool|client|db|database)\.(query|execute|select|from|update|delete|insert)\b/gi);
  }
  return accesses;
}

function accessHasScopedPredicate(window) {
  const codeWindow = maskCommentsAndStrings(window);
  return ((/\bwhere\s*:/.test(codeWindow) && scopeToken.test(codeWindow))
    || (/\bWHERE\b/i.test(window) && scopeToken.test(window)));
}

function hasScopedPersistencePredicate(text) {
  return collectPersistenceAccesses(text).some((access) => accessHasScopedPredicate(access.window));
}

function hasPersistenceForOptions(text, { reads = true, writes = true } = {}) {
  return (reads && hasPersistenceRead(text)) || (writes && hasPersistenceWrite(text));
}

export function hasUnscopedPersistenceAccess(text, options) {
  const accesses = collectPersistenceAccesses(text, options);
  if (accesses.length === 0) return hasPersistenceForOptions(text, options) && !hasScopedPersistencePredicate(text);
  return accesses.some((access) => !accessHasScopedPredicate(access.window));
}

function hasWriteSafetyMarker(text) {
  return /\b(transaction|batch|Promise\.allSettled|idempotenc|dedup|dedupe|upsert|ON CONFLICT|on conflict)\b/i.test(maskCommentsAndStrings(text));
}

function collectPersistenceWrites(text) {
  return collectPersistenceAccesses(text, { reads: false, writes: true });
}

function writeStatementHasSafety(text, index) {
  return hasWriteSafetyMarker(statementWindow(text, index));
}

export function hasLoopedWriteWithoutSafety(text) {
  const masked = maskCommentsAndStrings(text);
  return collectPersistenceWrites(text).some((access) => {
    const nearby = localWindow(masked, access.index, 360, 160);
    return loopPattern.test(nearby) && !writeStatementHasSafety(text, access.index);
  });
}

export function hasWriteWithoutLocalSafety(text) {
  const writes = collectPersistenceWrites(text);
  if (writes.length === 0) return hasPersistenceWrite(text) && !hasWriteSafetyMarker(text);
  return writes.some((access) => !writeStatementHasSafety(text, access.index));
}
