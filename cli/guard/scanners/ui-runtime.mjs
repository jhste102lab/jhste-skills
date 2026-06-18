import {
  countMatches,
  hasUseClientDirective,
  lineAt,
  violation,
} from './utils.mjs';

export function scanClientServerBoundary(relPath, text) {
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

export function scanStateSafety(relPath, text) {
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

export function scanRuntimeEnvSafety(relPath, text) {
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

export function scanPerformanceDuplicateFetch(relPath, text) {
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

export function scanSideEffectBoundary(relPath, text) {
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
