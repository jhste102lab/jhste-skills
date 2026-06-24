import path from 'node:path';
import { isSourceCodePath, lineAt, maskCommentsAndStrings, violation } from './utils.mjs';

const DEFAULT_SETTINGS = Object.freeze({
  function_review_lines: 80,
  mixed_responsibility_hints: 3,
  module_export_family_hints: 4,
});

const RESPONSIBILITY_HINTS = [
  { label: 'input parsing', patterns: [/\b(JSON\.parse|parseArgs|process\.argv|request\.json\(|new URL\(|URLSearchParams|yaml|frontmatter)\b/i] },
  { label: 'validation', patterns: [/\b(validate|validator|safeParse|parseAsync|schema|assert|parseEnv|errors\.push)\b/i] },
  { label: 'filesystem IO', patterns: [/\b(fs\.|readFile|writeFile|mkdir|rmSync|cpSync|readdirSync)\b/i] },
  { label: 'process/git/network IO', patterns: [/\b(spawnSync|execFileSync|fetch\(|axios\.|git\(|git\s+-C)\b/i] },
  { label: 'persistence', patterns: [/\b(prisma|pool\.query|client\.query|db\.|INSERT\s+INTO|UPDATE\s+\w|DELETE\s+FROM|SELECT\s+.+\s+FROM)\b/i, /\b\w*(Repository|Repo|Store)\.(find|findMany|save|create|insert|update|delete|upsert|query|persist)\w*\s*\(/i] },
  { label: 'rendering/reporting', patterns: [/\b(console\.|Response\.json|NextResponse\.json|res\.json|render|markdown|tableRows|print|logger\.)\b/i] },
  { label: 'prompting', patterns: [/\b(ask\(|readline|question\(|prompt)\b/i] },
  { label: 'data transformation', patterns: [/\btransform|serialize|deserialize\b/i] },
  { label: 'time/crypto policy', patterns: [/\b(Date\.now|new Date\(|crypto\.|randomUUID|createHash)\b/i] },
  { label: 'notification/email side effect', patterns: [/\b\w*(Email|Mail|Notification|Notifier)\w*\.(send|deliver|notify|enqueue|publish)\w*\s*\(/i, /\b(sendEmail|sendMail|sendWelcome|notifyUser)\w*\s*\(/i] },
  { label: 'billing/payment side effect', patterns: [/\b\w*(Payment|Billing|Invoice|Subscription|Stripe)\w*\.(create|charge|capture|refund|update|cancel)\w*\s*\(/i] },
  { label: 'event/queue side effect', patterns: [/\b(eventBus|queue|publisher|producer)\.(publish|send|enqueue|emit)\w*\s*\(/i] },
];

const EXPORT_NAME_FAMILIES = [
  { family: 'argument parsing', pattern: /^(parseArgs|arg|args|option|options|usage|mode|choice|normalize)$/i },
  { family: 'git/repo discovery', pattern: /^(git|repo|repository|branch|changed|staged)$/i },
  { family: 'filesystem', pattern: /^(file|files|dir|directory|path|read|write|copy|digest|atomic|ensure)$/i },
  { family: 'prompting', pattern: /^(ask|confirm|prompt|question|user)$/i },
  { family: 'time/template', pattern: /^(now|template|profile|bridge|block|time)$/i },
  { family: 'validation/schema', pattern: /^(validate|validator|schema|known|default|settings)$/i },
  { family: 'reporting', pattern: /^(print|render|report|summary|table)$/i },
  { family: 'install orchestration', pattern: /^(install|apply|preflight|hook|skill|manifest)$/i },
];

function settingsOrDefault(settings = {}) {
  return { ...DEFAULT_SETTINGS, ...(settings || {}) };
}

function matchingHints(text) {
  return RESPONSIBILITY_HINTS
    .filter((hint) => hint.patterns.some((pattern) => pattern.test(text)))
    .map((hint) => hint.label);
}

function functionDeclarations(text) {
  const pattern = /(?:^|\n)([ \t]*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{|[ \t]*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{)/gu;
  const out = [];
  for (const match of text.matchAll(pattern)) {
    const declaration = match[1];
    const name = match[2] || match[3] || 'anonymous';
    const start = (match.index || 0) + (match[0].startsWith('\n') ? 1 : 0);
    const openBrace = text.indexOf('{', start + declaration.indexOf(declaration.trim()));
    if (openBrace === -1) continue;
    const end = matchingBraceIndex(text, openBrace);
    if (end === -1) continue;
    out.push({ name, start, end, body: text.slice(start, end + 1) });
  }
  return out;
}

const CONTROL_FLOW_NAMES = new Set(['if', 'for', 'while', 'switch', 'catch', 'function']);

function braceDepthBetween(text, start, end) {
  let depth = 0;
  for (let index = start; index < end; index += 1) {
    if (text[index] === '{') depth += 1;
    if (text[index] === '}') depth -= 1;
  }
  return depth;
}

function classMethodDeclarations(text) {
  const classPattern = /(?:^|\n)[ \t]*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)[^{]*\{/gu;
  const methodPattern = /(?:^|\n)([ \t]*(?:(?:public|private|protected|static|override|abstract|async|get|set)\s+)*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*(?::[^{;\n]+)?\s*\{)/gu;
  const out = [];
  for (const classMatch of text.matchAll(classPattern)) {
    const className = classMatch[1] || 'AnonymousClass';
    const classStart = (classMatch.index || 0) + (classMatch[0].startsWith('\n') ? 1 : 0);
    const classOpen = text.indexOf('{', classStart);
    if (classOpen === -1) continue;
    const classEnd = matchingBraceIndex(text, classOpen);
    if (classEnd === -1) continue;
    const classBodyStart = classOpen + 1;
    const classBody = text.slice(classBodyStart, classEnd);
    for (const methodMatch of classBody.matchAll(methodPattern)) {
      const methodName = methodMatch[2] || 'anonymous';
      if (CONTROL_FLOW_NAMES.has(methodName)) continue;
      const relativeStart = (methodMatch.index || 0) + (methodMatch[0].startsWith('\n') ? 1 : 0);
      const start = classBodyStart + relativeStart;
      if (braceDepthBetween(text, classOpen, start) !== 1) continue;
      const openBrace = classBodyStart + (methodMatch.index || 0) + methodMatch[0].lastIndexOf('{');
      const end = matchingBraceIndex(text, openBrace);
      if (end === -1 || end > classEnd) continue;
      out.push({ name: `${className}.${methodName}`, start, end, body: text.slice(start, end + 1) });
    }
  }
  return out;
}

function matchingBraceIndex(text, openBrace) {
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = openBrace; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      escaped = char === '\\' && !escaped;
      if (char === quote && !escaped) quote = '';
      if (char !== '\\') escaped = false;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}


function pythonFunctionDeclarations(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let offset = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = /^(\s*)def\s+([A-Za-z_][\w]*)\s*\([^)]*\)\s*:/.exec(line);
    if (!match) {
      offset += line.length + 1;
      continue;
    }
    const indent = match[1].length;
    const start = offset;
    let endLine = index + 1;
    for (; endLine < lines.length; endLine += 1) {
      const candidate = lines[endLine];
      if (!candidate.trim()) continue;
      const candidateIndent = /^(\s*)/.exec(candidate)?.[1]?.length || 0;
      if (candidateIndent <= indent) break;
    }
    const body = lines.slice(index, endLine).join('\n');
    out.push({ name: match[2], start, end: start + body.length, body });
    for (let consumed = index; consumed < endLine; consumed += 1) offset += lines[consumed].length + 1;
    index = Math.max(index, endLine - 1);
  }
  return out;
}

function declarationsForPath(relPath, text) {
  if (relPath.endsWith('.py')) return pythonFunctionDeclarations(text);
  return [...functionDeclarations(text), ...classMethodDeclarations(text)].sort((left, right) => left.start - right.start);
}

function exportedCallableNames(text) {
  const names = [];
  for (const match of text.matchAll(/(?:^|\n)\s*export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gu)) names.push(match[1]);
  for (const match of text.matchAll(/(?:^|\n)\s*export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/gu)) names.push(match[1]);
  return [...new Set(names.filter(Boolean))];
}

function nameTokens(name) {
  return String(name)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .map((token) => token.toLowerCase())
    .filter(Boolean);
}

function exportFamilies(names) {
  const families = new Set();
  for (const name of names) {
    const tokens = new Set(nameTokens(name));
    for (const candidate of EXPORT_NAME_FAMILIES) {
      if (candidate.pattern.test(name) || [...tokens].some((token) => candidate.pattern.test(token))) families.add(candidate.family);
    }
  }
  return [...families];
}

function onlyReexports(text) {
  const meaningful = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//'));
  return meaningful.length > 0 && meaningful.every((line) => /^export\s+.*\s+from\s+['"][^'"]+['"];?$/.test(line));
}

export function scanSingleResponsibility(relPath, text, rawSettings = {}) {
  if (!isSourceCodePath(relPath)) return [];
  if (/(^|\/)scripts\/smoke\/|fixtures-test\.mjs$/.test(relPath)) return [];
  const ext = path.extname(relPath).toLowerCase();
  if (!['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py'].includes(ext)) return [];
  const settings = settingsOrDefault(rawSettings);
  const out = [];
  const scanText = maskCommentsAndStrings(text);

  for (const fn of declarationsForPath(relPath, scanText)) {
    const lineCount = fn.body.split(/\r?\n/).length;
    const hints = matchingHints(fn.body);
    const scannerLikeFunction = /^scan[A-Z_]/.test(fn.name) || fn.name === 'scanMixedResponsibilities';
    const optionNormalizer = /^normalize/.test(fn.name) && hints.every((hint) => ['input parsing', 'validation', 'filesystem IO'].includes(hint));
    if (lineCount >= settings.function_review_lines) {
      out.push(violation({
        ruleId: 'srp.function.length',
        severity: 'warning',
        relPath,
        line: lineAt(text, fn.start),
        symbol: fn.name,
        message: `${fn.name} is ${lineCount} lines; name its one responsibility and consider whether a real boundary would improve locality.`,
        confidence: 'medium',
      }));
    }
    if ((fn.name === 'main' && lineCount < settings.function_review_lines) || scannerLikeFunction || optionNormalizer) continue;
    if (hints.length >= settings.mixed_responsibility_hints) {
      out.push(violation({
        ruleId: 'srp.function.mixed_responsibility',
        severity: 'warning',
        relPath,
        line: lineAt(text, fn.start),
        symbol: fn.name,
        message: `${fn.name} appears to mix ${hints.slice(0, 5).join(', ')}; review whether one responsibility can move behind a named boundary without creating pass-through wrappers.`,
        confidence: 'low',
      }));
    }
  }

  if (!onlyReexports(text)) {
    const families = exportFamilies(exportedCallableNames(scanText));
    if (families.length >= settings.module_export_family_hints) {
      out.push(violation({
        ruleId: 'srp.module.mixed_exports',
        severity: 'warning',
        relPath,
        symbol: 'module-exports',
        message: `Module exports span ${families.slice(0, 6).join(', ')}; review whether this is a cohesive deep module or a shared utility bucket.`,
        confidence: 'low',
      }));
    }
  }

  return out;
}
