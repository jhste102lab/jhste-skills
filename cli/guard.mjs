#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { findGitRoot, nowIso, parseArgs, relativeDisplay } from './shared.mjs';

const TEXT_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.yml', '.yaml']);
const EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'vendor', 'dist', 'build', '.next', 'out', 'coverage', '.turbo', '.cache', '__pycache__']);
const EXCLUDED_FILE_NAMES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'bun.lock', 'poetry.lock', 'Pipfile.lock']);
const SECRET_FILE_RE = /(^|\/)(\.env(\..*)?|.*\.(pem|key|p12|pfx|crt)|id_rsa|id_ed25519)$/i;
const EXIT_VIOLATION = 1;
const EXIT_GUARD_FAILURE = 2;
const EXIT_CONFIG_FAILURE = 3;
const SEVERITIES = ['info', 'warning', 'error'];
const DEFAULT_BASELINE = '.jhste/baseline.json';
let currentFormat = 'text';

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

function uniqueScannableExisting(repoRoot, relPaths) {
  return [...new Set(relPaths.map(normalizePath))]
    .filter(isScannablePath)
    .filter((rel) => fs.existsSync(path.join(repoRoot, rel)))
    .sort();
}

function resolveScopeFiles(repoRoot, args) {
  const scope = String(args.scope || 'changed');
  if (!['changed', 'staged', 'all', 'files-from'].includes(scope)) {
    failConfig(`Unsupported --scope ${scope}. Use changed, staged, all, or files-from.`);
  }
  if (scope === 'all') return listAllFiles(repoRoot).sort();
  if (scope === 'files-from') {
    if (!args['files-from']) failConfig('--scope files-from requires --files-from <nul-delimited-file>.');
    return uniqueScannableExisting(repoRoot, readNulFile(path.resolve(String(args['files-from']))));
  }
  if (scope === 'staged') {
    try {
      return uniqueScannableExisting(repoRoot, readGitPathList(repoRoot, ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMRTUX', '--']));
    } catch (error) {
      failGuard('Failed to resolve staged files.', [error instanceof Error ? error.message : String(error)]);
    }
  }

  try {
    const headRef = String(args.head || 'HEAD');
    const baseRef = resolveBaseRef(repoRoot, args.base ? String(args.base) : '', headRef);
    const files = [
      ...readGitPathList(repoRoot, ['diff', '--name-only', '-z', '--diff-filter=ACMRTUX', baseRef, headRef, '--']),
      ...readGitPathList(repoRoot, ['diff', '--name-only', '-z', '--diff-filter=ACMRTUX', '--']),
      ...readGitPathList(repoRoot, ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMRTUX', '--']),
      ...readGitPathList(repoRoot, ['ls-files', '--others', '--exclude-standard', '-z']),
    ];
    return uniqueScannableExisting(repoRoot, files);
  } catch (error) {
    failGuard('Failed to resolve changed files.', [error instanceof Error ? error.message : String(error)]);
  }
  return [];
}

function lineAt(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function hasUseClientDirective(text) {
  return /^\s*(?:"use client"|'use client')\s*;?/u.test(text);
}

function fingerprintFor(ruleId, relPath, symbol, message) {
  const stable = `${ruleId}|${normalizePath(relPath)}|${symbol || ''}|${message.replace(/\d+/g, '#')}`;
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
    fingerprint: fingerprintFor(ruleId, relPath, symbol, message),
    source,
    confidence,
  };
}

function scanSilentFailures(relPath, text) {
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

function scanResponsibilityBudget(relPath, text) {
  const ext = path.extname(relPath).toLowerCase();
  if (!['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py'].includes(ext)) return [];
  const lineCount = text.split(/\r?\n/).length;
  const out = [];
  const nextPage = relPath.endsWith('/page.tsx') && /(^|\/)(app|src\/app|apps\/[^/]+\/src\/app)\//.test(relPath);
  if (nextPage && lineCount > 200) {
    out.push(violation({ ruleId: 'responsibility.page.budget', severity: 'warning', relPath, symbol: 'next-page', message: `${lineCount} lines in Next page; review loader/model/view split.`, confidence: 'medium' }));
  }
  if (hasUseClientDirective(text) && lineCount > 200) {
    out.push(violation({ ruleId: 'responsibility.client.budget', severity: 'warning', relPath, symbol: 'use-client', message: `${lineCount} lines in client module; review hook/adapter/presentation split.`, confidence: 'medium' }));
  }
  const routeLike = /(^|\/)(api|routes?|controllers?|pages\/api)\//i.test(relPath) || /route\.(ts|js)$/.test(relPath);
  if (routeLike && lineCount >= 250) {
    out.push(violation({ ruleId: 'responsibility.route.budget', severity: 'warning', relPath, symbol: 'route', message: `${lineCount} lines in route/controller-like file; review auth/validation/service/response seams.`, confidence: 'medium' }));
  }
  const scriptPipeline = /(^|\/)scripts\/(data|ops|import|imports|backfill|repair|migrate|migration)\//.test(relPath);
  if (scriptPipeline && lineCount >= 280) {
    out.push(violation({ ruleId: 'responsibility.script.budget', severity: 'warning', relPath, symbol: 'script-pipeline', message: `${lineCount} lines in import/ops-style script; review CLI/loader/transform/persist/report seams.`, confidence: 'medium' }));
  }
  if (ext === '.py' && /(^|\/)(main|.*orchestrator|.*runner|stage_runner)\.py$/.test(relPath) && lineCount >= 600) {
    out.push(violation({ ruleId: 'responsibility.python_orchestrator.budget', severity: 'warning', relPath, symbol: 'python-orchestrator', message: `${lineCount} lines in Python orchestrator/runner; review policy/IO/runtime/notification/result seams.`, confidence: 'medium' }));
  }
  return out;
}

function scanFile(repoRoot, relPath) {
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
    violations: [
      ...scanSilentFailures(relPath, text),
      ...scanClientServerBoundary(relPath, text),
      ...scanWorkflowSecurity(relPath, text),
      ...scanResponsibilityBudget(relPath, text),
    ],
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
      console.log(`- [${item.severity}] ${item.rule_id} ${item.path}:${item.line} — ${item.message}`);
    }
    if (result.violations.length > visible.length) console.log(`- ... ${result.violations.length - visible.length} more omitted from text output`);
  }
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
      current = { name: name[1].replace(/^['"]|['"]$/g, ''), run: '' };
      commands.push(current);
      continue;
    }
    const run = /^\s+run:\s*(.+?)\s*$/.exec(line);
    if (run && current) current.run = run[1].replace(/^['"]|['"]$/g, '');
  }
  return commands.filter((item) => item.name && item.run);
}

function runProfileCommands(repoRoot) {
  const commands = parseProfileCommands(repoRoot);
  const failures = [];
  for (const command of commands) {
    const result = spawnSync(command.run, [], { cwd: repoRoot, shell: true, encoding: 'utf8' });
    if (result.status !== 0) {
      failures.push({
        code: 'profile.command.failed',
        message: `Profile command failed: ${command.name}`,
        details: [`exit=${result.status}`, command.run],
      });
    }
  }
  return failures;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = findGitRoot(args.repo || process.cwd());
  const format = String(args.format || 'text');
  if (!['text', 'json'].includes(format)) failConfig('--format must be text or json.');
  currentFormat = format;
  const failOn = String(args['fail-on'] || 'none');
  if (!['none', 'warning', 'error'].includes(failOn)) failConfig('--fail-on must be none, warning, or error.');
  const baselineMode = String(args.baseline || 'off');
  const baselinePath = path.resolve(repoRoot, String(args['baseline-path'] || DEFAULT_BASELINE));
  const scopeFiles = resolveScopeFiles(repoRoot, args);
  const violations = [];
  const failures = [];
  for (const relPath of scopeFiles) {
    const result = scanFile(repoRoot, relPath);
    violations.push(...result.violations);
    if (result.failure) failures.push(result.failure);
  }
  if (args['run-profile-commands']) failures.push(...runProfileCommands(repoRoot));
  const baselineMap = loadBaseline(repoRoot, baselinePath);
  if (baselineMode === 'update') writeBaseline(baselinePath, violations);
  const managed = applyBaseline(violations, baselineMap, baselineMode);
  const result = guardResult(managed, failures, {
    scope: String(args.scope || 'changed'),
    files_scanned: scopeFiles.length,
    fail_on: failOn,
    baseline_mode: baselineMode,
    baseline_path: relativeDisplay(repoRoot, baselinePath),
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
