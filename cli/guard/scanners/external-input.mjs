export function hasValidationMarker(text) {
  return /\b(safeParse|parseAsync|schema\.parse|schema\.safeParse|z\.object|validate|validator|assert|parseEnv|requiredEnv|validated|sanitize)\b/i.test(text);
}

export function externalInputValidationFindings(relPath, text) {
  const out = [];
  const validationVisible = hasValidationMarker(text);
  if (!validationVisible
    && /\b(readFileSync|readFile)\s*\(/.test(text)
    && /\bJSON\.parse\s*\(/.test(text)) {
    out.push({
      ruleId: 'input.file_parse_unvalidated',
      severity: 'warning',
      relPath,
      symbol: 'file-json-parse',
      message: 'File input appears parsed without an obvious schema/validator; validate before trusting file contents.',
      confidence: 'low',
    });
  }
  if (!validationVisible
    && /\bfetch\s*\(\s*['"]https?:\/\//.test(text)
    && /\.json\s*\(\s*\)/.test(text)) {
    out.push({
      ruleId: 'input.third_party_json_unvalidated',
      severity: 'warning',
      relPath,
      symbol: 'third-party-json',
      message: 'Third-party fetch JSON appears used without an obvious schema/validator; validate response shape before trusting it.',
      confidence: 'low',
    });
  }
  const bodyVar = /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+(?:request|req)\.json\s*\(/.exec(text)?.[1];
  if (!validationVisible && bodyVar) {
    const directUse = new RegExp(`\\b(?:create|update|upsert|delete|save|mutate|service\\.[A-Za-z_$][\\w$]*|usecase\\.[A-Za-z_$][\\w$]*)\\s*\\(\\s*${bodyVar}\\b`).test(text);
    if (directUse) {
      out.push({
        ruleId: 'input.request_body_direct_use',
        severity: 'warning',
        relPath,
        symbol: 'request-body-direct-use',
        message: 'Request body appears passed directly into a mutation/service call without an obvious schema/validator.',
        confidence: 'low',
      });
    }
  }
  if (!validationVisible
    && /\bexport\s+(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*(?:\{[\s\S]{0,240})?process\.env\.[A-Z0-9_]+\b/.test(text)) {
    out.push({
      ruleId: 'input.env_export_unvalidated',
      severity: 'warning',
      relPath,
      symbol: 'env-export-unvalidated',
      message: 'Environment-derived config appears exported without an obvious validation/fallback boundary.',
      confidence: 'low',
    });
  }
  return out;
}
