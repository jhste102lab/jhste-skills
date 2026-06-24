import path from 'node:path';
import {
  hasUseClientDirective,
  isRouteLikePath,
  isScriptPipelinePath,
  isSourceCodePath,
  lineAt,
  violation,
} from './utils.mjs';

export function scanSilentFailures(relPath, text) {
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

export function scanWorkflowSecurity(relPath, text) {
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

export function scanFileSizeAdvisory(relPath, text, settings) {
  const ext = path.extname(relPath).toLowerCase();
  if (!['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py'].includes(ext)) return [];
  const lineCount = text.split(/\r?\n/).length;
  if (lineCount >= settings.source_file_review_lines) {
    return [violation({
      ruleId: 'file_size.review',
      severity: 'warning',
      relPath,
      symbol: 'source-file-review',
      message: `${lineCount} lines in source file; limit is ${settings.source_file_review_lines}. Large files are harder to review, test, and safely change.`,
      confidence: 'medium',
    })];
  }
  if (lineCount >= settings.source_file_warning_lines) {
    return [violation({
      ruleId: 'file_size.warning',
      severity: 'info',
      relPath,
      symbol: 'source-file-warning',
      message: `${lineCount} lines in source file; warning threshold is ${settings.source_file_warning_lines}. Watch for responsibility creep.`,
      confidence: 'medium',
    })];
  }
  return [];
}

function matchedResponsibilityHints(text, hintGroups) {
  return hintGroups
    .filter((group) => group.patterns.some((pattern) => pattern.test(text)))
    .map((group) => group.label);
}

function mixedClientResponsibilityHints(text) {
  return matchedResponsibilityHints(text, [
    { label: 'browser storage', patterns: [/\b(localStorage|sessionStorage)\b/] },
    { label: 'network/API', patterns: [/\bfetch\s*\(/, /\baxios\./, /\buse(Query|Mutation)\s*\(/] },
    { label: 'toast/notification', patterns: [/\btoast\b/, /\bnotify\b/] },
    { label: 'modal/dialog state', patterns: [/\b(Dialog|Modal|Sheet)\b/, /\bopen[A-Z]\w*\b/, /\bis[A-Z]\w*Open\b/] },
    { label: 'route navigation', patterns: [/\buseRouter\s*\(/, /\brouter\.(push|replace|refresh)\b/] },
    { label: 'heavy mapping', patterns: [/\.(map|filter|reduce)\s*\(/] },
  ]);
}

function mixedRouteResponsibilityHints(text) {
  return matchedResponsibilityHints(text, [
    { label: 'auth/session', patterns: [/\b(auth|session|permission|currentUser|getUser)\b/i] },
    { label: 'validation', patterns: [/\b(z\.object|safeParse|parseAsync|validate|schema)\b/] },
    { label: 'database', patterns: [/\b(prisma|pool\.query|client\.query|SELECT|INSERT|UPDATE|DELETE|db\.)\b/i] },
    { label: 'response formatting', patterns: [/\b(Response\.json|NextResponse\.json|res\.json)\b/] },
  ]);
}

function mixedScriptResponsibilityHints(text) {
  return matchedResponsibilityHints(text, [
    { label: 'CLI parsing', patterns: [/\b(process\.argv|argparse|ArgumentParser|commander)\b/] },
    { label: 'file IO', patterns: [/\b(readFile|writeFile|open\(|Path\(|fs\.)\b/] },
    { label: 'data transform', patterns: [/\.(map|filter|reduce)\s*\(/, /\bjson\.loads\b/i, /\bJSON\.parse\b/] },
    { label: 'persistence/network', patterns: [/\b(fetch|pool\.query|client\.query|INSERT|UPDATE|DELETE|requests\.)\b/i] },
    { label: 'reporting', patterns: [/\b(console\.|print\(|logger\.)\b/] },
  ]);
}

export function scanResponsibilityBudget(relPath, text, settings) {
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
  const routeLike = isRouteLikePath(relPath);
  if (routeLike && lineCount >= settings.route_review_lines) {
    out.push(violation({ ruleId: 'responsibility.route.budget', severity: 'warning', relPath, symbol: 'route', message: `${lineCount} lines in route/controller-like file; review auth/validation/service/response boundaries.`, confidence: 'medium' }));
  }
  const scriptPipeline = isScriptPipelinePath(relPath);
  if (scriptPipeline && lineCount >= settings.import_ops_script_review_lines) {
    out.push(violation({ ruleId: 'responsibility.script.budget', severity: 'warning', relPath, symbol: 'script-pipeline', message: `${lineCount} lines in import/ops-style script; review CLI/loader/transform/persist/report boundaries.`, confidence: 'medium' }));
  }
  if (ext === '.py' && /(^|\/)(main|.*orchestrator|.*runner|stage_runner)\.py$/.test(relPath) && lineCount >= settings.python_orchestrator_review_lines) {
    out.push(violation({ ruleId: 'responsibility.python_orchestrator.budget', severity: 'warning', relPath, symbol: 'python-orchestrator', message: `${lineCount} lines in Python orchestrator/runner; review policy/IO/runtime/notification/result boundaries.`, confidence: 'medium' }));
  }
  if (hasUseClientDirective(text)) {
    const hints = mixedClientResponsibilityHints(text);
    if (hints.length >= 3) {
      out.push(violation({ ruleId: 'responsibility.client.mixed', severity: 'warning', relPath, symbol: 'use-client-mixed', message: `client module mixes ${hints.slice(0, 4).join(', ')}; review hook/adapter/presentation split.`, confidence: 'low' }));
    }
  }
  if (routeLike) {
    const hints = mixedRouteResponsibilityHints(text);
    if (hints.length >= 3) {
      out.push(violation({ ruleId: 'responsibility.route.mixed', severity: 'warning', relPath, symbol: 'route-mixed', message: `route/controller mixes ${hints.join(', ')}; review route/service/repository/response split.`, confidence: 'low' }));
    }
  }
  if (scriptPipeline) {
    const hints = mixedScriptResponsibilityHints(text);
    if (hints.length >= 4) {
      out.push(violation({ ruleId: 'responsibility.script.mixed', severity: 'warning', relPath, symbol: 'script-pipeline-mixed', message: `script mixes ${hints.join(', ')}; review CLI/loader/transform/persist/report boundaries.`, confidence: 'low' }));
    }
  }
  return out;
}

export function scanSecretLogging(relPath, text) {
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

export function scanTypeEscapeAdvisory(relPath, text) {
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

export function scanBroadExceptionAdvisory(relPath, text) {
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
