import { localWindow, maskCommentsAndStrings } from './utils.mjs';

export function hasValidationMarker(text) {
  return /\b(safeParse|parseAsync|schema\.parse|schema\.safeParse|z\.object|validate|validator|assert|parseEnv|requiredEnv|validated|sanitize)\b/i.test(text);
}

function hasLocalValidation(text, index, before = 360, after = 720) {
  return hasValidationMarker(localWindow(maskCommentsAndStrings(text), index, before, after));
}

export function externalInputValidationFindings(relPath, text) {
  const out = [];
  const markerText = maskCommentsAndStrings(text);
  for (const match of markerText.matchAll(/\bJSON\.parse\s*\(/g)) {
    const before = localWindow(markerText, match.index || 0, 260, 20);
    if (/\b(readFileSync|readFile)\s*\(/.test(before) && !hasLocalValidation(text, match.index || 0)) {
      out.push({
        ruleId: 'input.file_parse_unvalidated',
        severity: 'warning',
        relPath,
        line: undefined,
        symbol: 'file-json-parse',
        message: 'File input appears parsed without an obvious schema/validator; validate before trusting file contents.',
        confidence: 'low',
      });
      break;
    }
  }
  for (const match of markerText.matchAll(/\.json\s*\(\s*\)/g)) {
    const window = localWindow(text, match.index || 0, 420, 260);
    if (/\bfetch\s*\(\s*['"]https?:\/\//.test(window) && !hasLocalValidation(text, match.index || 0)) {
      out.push({
        ruleId: 'input.third_party_json_unvalidated',
        severity: 'warning',
        relPath,
        symbol: 'third-party-json',
        message: 'Third-party fetch JSON appears used without an obvious schema/validator; validate response shape before trusting it.',
        confidence: 'low',
      });
      break;
    }
  }
  for (const match of markerText.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+(?:request|req)\.json\s*\(/g)) {
    const bodyVar = match[1];
    if (hasLocalValidation(text, match.index || 0, 40, 720)) continue;
    const after = localWindow(markerText, match.index || 0, 0, 1100);
    const directUse = new RegExp(`\\b(?:create|update|upsert|delete|save|mutate|service\\.[A-Za-z_$][\\w$]*|usecase\\.[A-Za-z_$][\\w$]*)\\s*\\(\\s*${bodyVar}\\b`).test(after);
    if (directUse) {
      out.push({
        ruleId: 'input.request_body_direct_use',
        severity: 'warning',
        relPath,
        symbol: 'request-body-direct-use',
        message: 'Request body appears passed directly into a mutation/service call without an obvious schema/validator.',
        confidence: 'low',
      });
      break;
    }
  }
  for (const match of markerText.matchAll(/\bexport\s+(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*(?:\{[\s\S]{0,240})?process\.env\.[A-Z0-9_]+\b/g)) {
    if (!hasLocalValidation(text, match.index || 0)) {
      out.push({
        ruleId: 'input.env_export_unvalidated',
        severity: 'warning',
        relPath,
        symbol: 'env-export-unvalidated',
        message: 'Environment-derived config appears exported without an obvious validation/fallback boundary.',
        confidence: 'low',
      });
      break;
    }
  }
  return out;
}
