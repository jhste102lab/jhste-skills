#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  atomicWrite,
  ensureDir,
  findGitRoot,
  nowIso,
  parseArgs,
  relativeDisplay,
} from './shared.mjs';
import {
  DEFAULT_FILE_SIZE,
  DEFAULT_RESPONSIBILITY_BUDGET,
  fileSizeSettings,
  loadProfileConfig,
  responsibilityBudgetSettings,
} from './profile.mjs';

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.sql', '.md', '.mdx', '.json']);
const TEXT_EXTENSIONS = new Set([...SOURCE_EXTENSIONS, '.yaml', '.yml', '.toml']);
const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  'vendor',
  'dist',
  'build',
  '.next',
  'out',
  'coverage',
  '.turbo',
  '.cache',
  '__pycache__',
]);
const EXCLUDED_FILE_NAMES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'bun.lock',
  'poetry.lock',
  'Pipfile.lock',
]);
const SECRET_FILE_RE = /(^|\/)(\.env(\..*)?|.*\.(pem|key|p12|pfx|crt)|id_rsa|id_ed25519)$/i;
const MAX_FILE_BYTES = 1024 * 1024;
let responsibilityThresholds = { ...DEFAULT_RESPONSIBILITY_BUDGET };
let fileSizeThresholds = { ...DEFAULT_FILE_SIZE };

function readGitignoreRoots(repoRoot) {
  const gitignore = path.join(repoRoot, '.gitignore');
  if (!fs.existsSync(gitignore)) return new Set();
  const roots = new Set();
  for (const raw of fs.readFileSync(gitignore, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.includes('*') || line.startsWith('!')) continue;
    const normalized = line.replace(/^\//, '').replace(/\/$/, '');
    if (normalized && !normalized.includes('/')) roots.add(normalized);
  }
  return roots;
}

function collectFiles(repoRoot) {
  const gitignoreRoots = readGitignoreRoots(repoRoot);
  const files = [];
  const skipped = [];
  function skip(reason, fullPath) {
    skipped.push({ reason, path: relativeDisplay(repoRoot, fullPath) });
  }
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = relativeDisplay(repoRoot, full);
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name) || gitignoreRoots.has(entry.name)) {
          skip('excluded directory', full);
          continue;
        }
        walk(full);
        continue;
      }
      if (!entry.isFile()) {
        skip('non-file', full);
        continue;
      }
      if (EXCLUDED_FILE_NAMES.has(entry.name) || SECRET_FILE_RE.test(rel)) {
        skip('excluded sensitive or lock file', full);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext)) {
        skip('non-source extension', full);
        continue;
      }
      const stat = fs.statSync(full);
      if (stat.size > MAX_FILE_BYTES) {
        skip('large file', full);
        continue;
      }
      files.push({ full, rel, ext, size: stat.size });
    }
  }
  walk(repoRoot);
  return { files, skipped };
}

function detectStack(repoRoot, files) {
  const rels = files.map((file) => file.rel);
  const packageJsonPath = path.join(repoRoot, 'package.json');
  const packageText = fs.existsSync(packageJsonPath) ? fs.readFileSync(packageJsonPath, 'utf8') : '';
  return {
    typescript: rels.some((rel) => /\.(ts|tsx)$/.test(rel)) || /typescript/.test(packageText),
    react: rels.some((rel) => /\.(jsx|tsx)$/.test(rel)) || /"react"\s*:/.test(packageText),
    nextjs: rels.some((rel) => /(^|\/)(next\.config\.|app\/.*route\.(js|ts)|pages\/api\/)/.test(rel)) || /"next"\s*:/.test(packageText),
    python: rels.some((rel) => rel.endsWith('.py')),
    postgresql: /postgres|pg\b|postgresql/i.test(packageText) || rels.some((rel) => /migrations?|sql|database|db/i.test(rel)),
    crawler: rels.some((rel) => /crawler|scraper|automation|playwright|puppeteer|worker|scheduler/i.test(rel)) || /playwright|puppeteer|scrap/i.test(packageText),
  };
}

function detectInstructions(repoRoot) {
  return {
    agents: fs.existsSync(path.join(repoRoot, 'AGENTS.md')),
    claude: fs.existsSync(path.join(repoRoot, 'CLAUDE.md')),
    docs: fs.existsSync(path.join(repoRoot, 'docs')),
  };
}

function candidate(list, kind, file, line, detail, severity = 'advisory') {
  list.push({ kind, file: file.rel, line, detail, severity });
}

function hasUseClientDirective(text) {
  return /^\s*(?:"use client"|'use client')\s*;?/u.test(text);
}

function isNextPage(file) {
  return file.rel.endsWith('/page.tsx') && /(^|\/)(app|src\/app|apps\/[^/]+\/src\/app)\//.test(file.rel);
}

function isScriptPipeline(file) {
  return /(^|\/)scripts\/(data|ops|import|imports|backfill|repair|migrate|migration)\//.test(file.rel)
    && /\.(ts|tsx|js|jsx|mjs|cjs|py)$/.test(file.rel);
}

function isPythonOrchestrator(file) {
  return file.ext === '.py' && /(^|\/)(main|.*orchestrator|.*runner|stage_runner)\.py$/.test(file.rel);
}

function isRouteLike(file) {
  return /(^|\/)(api|routes?|controllers?|pages\/api)\//i.test(file.rel) || /route\.(ts|js)$/.test(file.rel);
}

function hasRuntimeImportFromClient(text) {
  if (!hasUseClientDirective(text)) return false;
  const runtimeImport = /^\s*import\s+(?!type\b)[^;\n]*\sfrom\s+['"]([^'"]+)['"]/gmu;
  for (const match of text.matchAll(runtimeImport)) {
    const source = match[1] || '';
    if (
      /^(fs|path|crypto|child_process|server-only|next\/headers|next\/cookies|next\/server)$/.test(source)
      || /(^|\/)(server|db|database|repositories?|prisma|postgres)(\/|$)/i.test(source)
    ) {
      return true;
    }
  }
  return false;
}

function matchedResponsibilityHints(text, hintGroups) {
  return hintGroups
    .filter((group) => group.patterns.some((pattern) => pattern.test(text)))
    .map((group) => group.label);
}

function scanResponsibilityBudget(file, text, lineCount, findings) {
  if (isNextPage(file) && lineCount > responsibilityThresholds.next_page_review_lines) {
    candidate(
      findings.responsibilityBudget,
      'responsibility budget candidate',
      file,
      1,
      `${lineCount} lines in Next page; consider moving loading/model code to a loader and UI to route-local view/components`,
      'review',
    );
  }

  if (hasUseClientDirective(text) && lineCount > responsibilityThresholds.client_module_review_lines) {
    candidate(
      findings.responsibilityBudget,
      'responsibility budget candidate',
      file,
      1,
      `${lineCount} lines in client module; consider splitting state/API/storage hooks from leaf and presentation components`,
      'review',
    );
  }

  const routeLike = /(^|\/)(api|routes?|controllers?|pages\/api)\//i.test(file.rel) || /route\.(ts|js)$/.test(file.rel);
  if (routeLike && lineCount >= responsibilityThresholds.route_review_lines) {
    candidate(
      findings.responsibilityBudget,
      'responsibility budget candidate',
      file,
      1,
      `${lineCount} lines in route/controller-like file; keep auth, validation, domain work, persistence, and response formatting in clear seams`,
      'review',
    );
  }

  if (isScriptPipeline(file) && lineCount >= responsibilityThresholds.import_ops_script_review_lines) {
    candidate(
      findings.responsibilityBudget,
      'responsibility budget candidate',
      file,
      1,
      `${lineCount} lines in import/ops-style script; consider separating CLI parse, artifact loading, transform plan, persistence, and reporting`,
      'review',
    );
  }

  if (isPythonOrchestrator(file) && lineCount >= responsibilityThresholds.python_orchestrator_review_lines) {
    candidate(
      findings.responsibilityBudget,
      'responsibility budget candidate',
      file,
      1,
      `${lineCount} lines in Python orchestrator/runner; consider splitting policy, IO, runtime services, notification, and result contract seams`,
      'review',
    );
  }
}

function scanMixedResponsibilities(file, text, findings) {
  if (hasUseClientDirective(text)) {
    const hints = matchedResponsibilityHints(text, [
      { label: 'browser storage', patterns: [/\b(localStorage|sessionStorage)\b/] },
      { label: 'network/API', patterns: [/\bfetch\s*\(/, /\baxios\./, /\buse(Query|Mutation)\s*\(/] },
      { label: 'toast/notification', patterns: [/\btoast\b/, /\bnotify\b/] },
      { label: 'modal/dialog state', patterns: [/\b(Dialog|Modal|Sheet)\b/, /\bopen[A-Z]\w*\b/, /\bis[A-Z]\w*Open\b/] },
      { label: 'route navigation', patterns: [/\buseRouter\s*\(/, /\brouter\.(push|replace|refresh)\b/] },
      { label: 'heavy mapping', patterns: [/\.(map|filter|reduce)\s*\(/] },
    ]);
    if (hints.length >= 3) {
      candidate(
        findings.responsibilityBudget,
        'mixed client responsibility candidate',
        file,
        1,
        `client module mixes ${hints.slice(0, 4).join(', ')}; review hook/adapter/presentation split`,
        'warning',
      );
    }
  }

  const routeLike = /(^|\/)(api|routes?|controllers?|pages\/api)\//i.test(file.rel) || /route\.(ts|js)$/.test(file.rel);
  if (routeLike) {
    const hints = matchedResponsibilityHints(text, [
      { label: 'auth/session', patterns: [/\b(auth|session|permission|currentUser|getUser)\b/i] },
      { label: 'validation', patterns: [/\b(z\.object|safeParse|parseAsync|validate|schema)\b/] },
      { label: 'database', patterns: [/\b(prisma|pool\.query|client\.query|SELECT|INSERT|UPDATE|DELETE|db\.)\b/i] },
      { label: 'response formatting', patterns: [/\b(Response\.json|NextResponse\.json|res\.json)\b/] },
    ]);
    if (hints.length >= 3) {
      candidate(
        findings.responsibilityBudget,
        'mixed route responsibility candidate',
        file,
        1,
        `route/controller mixes ${hints.join(', ')}; review route/service/repository/response split`,
        'warning',
      );
    }
  }

  if (isScriptPipeline(file)) {
    const hints = matchedResponsibilityHints(text, [
      { label: 'CLI parsing', patterns: [/\b(process\.argv|argparse|ArgumentParser|commander)\b/] },
      { label: 'file IO', patterns: [/\b(readFile|writeFile|open\(|Path\(|fs\.)\b/] },
      { label: 'data transform', patterns: [/\.(map|filter|reduce)\s*\(/, /\bjson\.loads\b/i, /\bJSON\.parse\b/] },
      { label: 'persistence/network', patterns: [/\b(fetch|pool\.query|client\.query|INSERT|UPDATE|DELETE|requests\.)\b/i] },
      { label: 'reporting', patterns: [/\b(console\.|print\(|logger\.)\b/] },
    ]);
    if (hints.length >= 4) {
      candidate(
        findings.responsibilityBudget,
        'mixed script responsibility candidate',
        file,
        1,
        `script mixes ${hints.join(', ')}; review CLI/loader/transform/persist/report seams`,
        'warning',
      );
    }
  }
}

function scanFinalReviewFamilies(file, text, findings) {
  const lines = text.split(/\r?\n/);

  if (/\.(tsx?|jsx?)$/.test(file.rel)) {
    if (/\b[A-Za-z_$][\w$]*!\s*(?:\.|\[|\()/.test(text)) {
      candidate(findings.stateSafety, 'null/state safety candidate', file, 1, 'non-null assertion detected on a likely UI path; review null and empty-state handling', 'warning');
    }
    if ((hasUseClientDirective(text) || /page\.(tsx|jsx)$/.test(file.rel))
      && /\b(useQuery|useSuspenseQuery|fetch\s*\(|axios\.)\b/.test(text)
      && !/\b(isLoading|loading|isError|error|notFound|empty|Empty|skeleton|placeholder)\b/.test(text)) {
      candidate(findings.stateSafety, 'null/state safety candidate', file, 1, 'async UI path has data-loading hints but no obvious loading, empty, or error fallback', 'warning');
    }
    const fetchCount = [...text.matchAll(/\b(fetch\s*\(|axios\.|useQuery\s*\(|useSuspenseQuery\s*\()/g)].length;
    if (fetchCount >= 2) {
      candidate(findings.performanceDuplication, 'performance duplicate-fetch candidate', file, 1, `file appears to trigger ${fetchCount} fetch paths; review duplicate requests or split caches`, 'warning');
    }
    if (hasUseClientDirective(text) && /useEffect\s*\([\s\S]{0,500}\b(fetch\s*\(|axios\.)/su.test(text)) {
      candidate(findings.performanceDuplication, 'performance duplicate-fetch candidate', file, 1, 'client module fetches inside useEffect; review cached loader or shared data hook alternatives', 'warning');
    }
  }

  if (isRouteLike(file)) {
    const hasDbAccess = /\b(prisma\.\w+\.(find|create|update|delete|upsert)|pool\.query|client\.query|db\.|database\.|SELECT|INSERT|UPDATE|DELETE)\b/i.test(text);
    const hasAuthContext = /\b(auth\s*\(|session|currentUser|getUser|permission|requireUser|requireAuth)\b/i.test(text);
    const hasScopeHint = /\b(userId|accountId|orgId|tenantId|ownerId|workspaceId|teamId|projectId|where\s*:|filter\s*:)\b/i.test(text);
    if (hasDbAccess && hasAuthContext && !hasScopeHint) {
      candidate(findings.authzIsolation, 'auth/data isolation candidate', file, 1, 'route uses auth context and persistence but no obvious owner or tenant filter is visible', 'warning');
    }
    if (hasDbAccess
      && /\b(export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)|router\.(post|put|patch|delete)|app\.(post|put|patch|delete))\b/i.test(text)
      && !hasAuthContext) {
      candidate(findings.authzIsolation, 'auth/data isolation candidate', file, 1, 'mutation path touches persistence without obvious auth or permission context', 'warning');
    }
    if (/\b(request\.json\(|req\.body\b|params\.[A-Za-z_$]|\bsearchParams\.get\(|new URLSearchParams\b)/.test(text)
      && !/\b(safeParse|parseAsync|schema|z\.object|validate|validator|assert)\b/.test(text)) {
      candidate(findings.apiContract, 'API contract candidate', file, 1, 'route reads request body, params, or search params without an obvious schema or validator', 'warning');
    }
    if (/\b(Response\.json|NextResponse\.json|res\.json)\(\s*await\s+(?:prisma|db|client|pool)|\breturn\s+(?:await\s+)?(?:prisma|db|client|pool)\./.test(text)) {
      candidate(findings.apiContract, 'API contract candidate', file, 1, 'route appears to expose storage-shaped data directly; review DTO mapping and caller compatibility', 'warning');
    }
    if (hasDbAccess
      && /\b(export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)|router\.(post|put|patch|delete)|app\.(post|put|patch|delete))\b/i.test(text)
      && !/\b(idempotenc|dedup|dedupe|upsert|transaction|ON CONFLICT|on conflict)\b/i.test(text)) {
      candidate(findings.writeSafety, 'write safety candidate', file, 1, 'mutation route has no obvious idempotency, dedupe, or transaction marker', 'warning');
    }
  }

  if ((isRouteLike(file) || isScriptPipeline(file))
    && /\b(prisma\.\w+\.(create|update|delete|upsert)|pool\.query|client\.query|db\.|INSERT|UPDATE|DELETE)\b/i.test(text)
    && /(forEach\s*\(|for\s*\([^)]*;|for\s*\(\s*const\s+.+\s+of\s+|\.map\s*\(|while\s*\()/i.test(text)
    && !/\b(transaction|batch|Promise\.allSettled|idempotenc|dedup|dedupe|upsert|ON CONFLICT|on conflict)\b/i.test(text)) {
    candidate(findings.writeSafety, 'write safety candidate', file, 1, 'repeated writes appear inside a loop without an obvious transaction, batch, or dedupe strategy', 'warning');
  }

  lines.forEach((lineText, index) => {
    const lineNo = index + 1;
    if (/\bprocess\.env\.(?!NODE_ENV\b)[A-Z0-9_]+\b/.test(lineText) && !/\?\?|\|\||default|safeParse|parseEnv|assertEnv|requiredEnv|validate|schema/i.test(lineText)) {
      candidate(findings.runtimeEnv, 'runtime/env safety candidate', file, lineNo, 'env var is read directly without an obvious validation or fallback path', 'warning');
    }
    if (/\bimport\.meta\.env\.(?!MODE\b|DEV\b|PROD\b|SSR\b)[A-Z0-9_]+\b/.test(lineText) && !/\?\?|\|\||default|safeParse|validate|schema/i.test(lineText)) {
      candidate(findings.runtimeEnv, 'runtime/env safety candidate', file, lineNo, 'client env var is read directly without an obvious fallback or validation', 'warning');
    }
    if (/\bos\.getenv\(['"][A-Z0-9_]+['"]\)/.test(lineText) && !/\bor\b|\bif\b|default|validate|schema/i.test(lineText)) {
      candidate(findings.runtimeEnv, 'runtime/env safety candidate', file, lineNo, 'Python env lookup has no obvious fallback or validation', 'warning');
    }
  });
}

function scanFile(file, text, findings) {
  const lines = text.split(/\r?\n/);
  const lineCount = lines.length;
  const isSource = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py'].includes(file.ext);
  if (isSource && lineCount >= fileSizeThresholds.source_file_warning_lines) {
    candidate(findings.largeFiles, 'large file', file, 1, `${lineCount} lines`, lineCount >= fileSizeThresholds.source_file_review_lines ? 'review' : 'warning');
  }

  lines.forEach((lineText, index) => {
    const lineNo = index + 1;
    if (/catch\s*(\([^)]*\))?\s*{\s*}/.test(lineText) || /\.catch\s*\(\s*(async\s*)?\(?\s*[^)]*\)?\s*=>\s*{\s*}\s*\)/.test(lineText)) {
      candidate(findings.silentFailures, 'silent failure candidate', file, lineNo, 'empty JavaScript/TypeScript catch or promise rejection handler');
    }
    if (/except\s+(Exception|BaseException)\s*:\s*pass\b/.test(lineText) || /^\s*except\s*:\s*pass\b/.test(lineText)) {
      candidate(findings.silentFailures, 'silent failure candidate', file, lineNo, 'broad Python exception handler with pass');
    }
    if (/\bas\s+any\b|:\s*any\b|@ts-ignore/.test(lineText)) {
      candidate(findings.typeEscapes, 'type escape candidate', file, lineNo, 'broad TypeScript escape');
    }
    if (/console\.(log|warn|error)|logger\.(info|warn|error|debug)|print\(/.test(lineText) && /secret|token|password|authorization|cookie|session/i.test(lineText)) {
      candidate(findings.secretLogging, 'secret-like logging candidate', file, lineNo, 'redacted line contains sensitive keyword');
    }
  });

  if (/`[^`]*(SELECT|INSERT|UPDATE|DELETE)[^`]*\$\{[^`]+`/is.test(text) || /f["'][^"']*(SELECT|INSERT|UPDATE|DELETE)[^"']*\{[^"']+["']/is.test(text)) {
    candidate(findings.rawSql, 'raw SQL interpolation candidate', file, 1, 'SQL-like string interpolation detected');
  }

  const routeLike = /(^|\/)(api|routes?|controllers?|pages\/api)\//i.test(file.rel) || /route\.(ts|js)$/.test(file.rel);
  if (routeLike && /(prisma|sql`|SELECT|INSERT|UPDATE|DELETE|db\.|database)/i.test(text)) {
    candidate(findings.dbInRoutes, 'DB/API seam candidate', file, 1, 'route/controller appears to contain direct database access');
  }
  if (routeLike && lineCount >= responsibilityThresholds.route_review_lines) {
    candidate(findings.routeResponsibility, 'route responsibility candidate', file, 1, `${lineCount} lines in route/controller-like file`);
  }
  if (hasRuntimeImportFromClient(text)) {
    candidate(findings.clientServerSeam, 'client/server seam candidate', file, 1, 'client file imports a server-like module');
  }
  if (/function\s+(format|helper|build|make|map)\w*\s*\([^)]*\)\s*{[\s\S]{0,1200}\b(fetch|writeFile|readFile|exec|spawn|setTimeout)\b/.test(text)) {
    candidate(findings.hiddenSideEffects, 'hidden side-effect candidate', file, 1, 'generic helper appears to perform side effects');
  }

  scanResponsibilityBudget(file, text, lineCount, findings);
  scanMixedResponsibilities(file, text, findings);
}

function scanFiles(files) {
  const findings = {
    largeFiles: [],
    silentFailures: [],
    typeEscapes: [],
    rawSql: [],
    dbInRoutes: [],
    routeResponsibility: [],
    responsibilityBudget: [],
    clientServerSeam: [],
    hiddenSideEffects: [],
    secretLogging: [],
    stateSafety: [],
    authzIsolation: [],
    runtimeEnv: [],
    writeSafety: [],
    apiContract: [],
    performanceDuplication: [],
    scanWarnings: [],
  };
  for (const file of files) {
    try {
      const text = fs.readFileSync(file.full, 'utf8');
      scanFile(file, text, findings);
      scanFinalReviewFamilies(file, text, findings);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      candidate(
        findings.scanWarnings,
        'scan warning',
        file,
        1,
        `file could not be scanned and was omitted from rule candidates: ${message}`,
        'warning',
      );
    }
  }
  return findings;
}

function tableRows(rows) {
  if (rows.length === 0) return '- None found in scanned files.\n';
  return rows.slice(0, 50).map((row) => `- \`${row.file}:${row.line}\` — ${row.detail}`).join('\n') + (rows.length > 50 ? `\n- ... ${rows.length - 50} more candidates omitted from summary` : '') + '\n';
}

function yesNo(value) {
  return value ? 'yes' : 'no';
}

function recommendedPacks(stack, findings) {
  return [
    ['core', 'advisory', 'Safe default for all repositories'],
    ['web', stack.react || stack.nextjs ? 'advisory' : 'off', stack.react || stack.nextjs ? 'React or web stack detected' : 'No web stack detected'],
    ['api', stack.nextjs || findings.dbInRoutes.length || findings.routeResponsibility.length ? 'changed-files' : 'advisory', 'API boundary candidates can start with changed files only'],
    ['database', stack.postgresql || findings.rawSql.length ? 'advisory' : 'off', stack.postgresql || findings.rawSql.length ? 'Database or SQL hints detected' : 'No database hints detected'],
    ['crawler', stack.crawler ? 'advisory' : 'off', stack.crawler ? 'Crawler or automation hints detected' : 'No crawler hints detected'],
  ];
}

function renderReport({ repoRoot, files, skipped, stack, instructions, findings }) {
  const packRows = recommendedPacks(stack, findings);
  return `# Deep Scan Report

## Summary
- Scan time: ${nowIso()}
- Repository: ${path.basename(repoRoot)}
- Files inspected: ${files.length}
- Files skipped: ${skipped.length}
- Recommended packs: ${packRows.filter((row) => row[1] !== 'off').map((row) => row[0]).join(', ') || 'core'}
- Suggested default mode: advisory
- Code modified: no

## Detected stack
- TypeScript: ${yesNo(stack.typescript)}
- React: ${yesNo(stack.react)}
- Next.js: ${yesNo(stack.nextjs)}
- Python: ${yesNo(stack.python)}
- PostgreSQL: ${yesNo(stack.postgresql)}
- Crawler/automation: ${yesNo(stack.crawler)}

## Existing local instructions
- AGENTS.md: ${instructions.agents ? 'found' : 'not found'}
- CLAUDE.md: ${instructions.claude ? 'found' : 'not found'}
- docs guidance: ${instructions.docs ? 'found' : 'not found'}
- Conflict policy: repo-local instructions remain authoritative

## Recommended rule modes
| Pack | Recommended mode | Reason |
|---|---|---|
${packRows.map((row) => `| ${row[0]} | ${row[1]} | ${row[2]} |`).join('\n')}

## Existing debt candidates

### Existing large files
${tableRows(findings.largeFiles)}
### Existing silent failure candidates
${tableRows(findings.silentFailures)}
### Existing type escape candidates
${tableRows(findings.typeEscapes)}
### Existing raw SQL candidates
${tableRows(findings.rawSql)}
### Existing DB/API seam candidates
${tableRows([...findings.dbInRoutes, ...findings.routeResponsibility])}
### Existing responsibility budget candidates
${tableRows(findings.responsibilityBudget)}
### Existing client/server seam candidates
${tableRows(findings.clientServerSeam)}
### Existing hidden side-effect candidates
${tableRows(findings.hiddenSideEffects)}
### Existing null/state safety candidates
${tableRows(findings.stateSafety)}
### Existing auth/data isolation candidates
${tableRows(findings.authzIsolation)}
### Existing runtime/env safety candidates
${tableRows(findings.runtimeEnv)}
### Existing write safety candidates
${tableRows(findings.writeSafety)}
### Existing API contract candidates
${tableRows(findings.apiContract)}
### Existing performance duplication candidates
${tableRows(findings.performanceDuplication)}
### Secret-like logging candidates
${tableRows(findings.secretLogging)}
### Scan warnings
${tableRows(findings.scanWarnings)}

## New-code guard candidates
- Start with changed-files mode for no_silent_failure and no_secret_logging after human review.
- Consider baseline-new-only only after accepting a baseline generated from this report.
- Keep strict disabled unless a user explicitly opts in.

## Skipped file summary
- Excluded generated/vendor/build/dependency folders, lockfiles, large files, binary-like extensions, and secret/env-like files.
- Skipped entries recorded: ${skipped.length}
- Per-file scan warnings: ${findings.scanWarnings.length}

## Risks
- Static analysis can produce false positives and cannot prove runtime behavior.
- This report redacts secret-like content and does not include raw sensitive values.
- Human review is needed before enabling strict mode or CI enforcement.
`;
}

function renderRecommendedProfile({ stack, findings }) {
  const apiMode = stack.nextjs || findings.dbInRoutes.length || findings.routeResponsibility.length ? 'changed-files' : 'advisory';
  const databaseMode = stack.postgresql || findings.rawSql.length ? 'advisory' : 'off';
  const crawlerMode = stack.crawler ? 'advisory' : 'off';
  return `version: 1
mode: advisory
recommendations:
  generated_by: deep-scan
  generated_at: "${nowIso()}"
  apply_requires_user_approval: true
packs:
  core:
    mode: advisory
  web:
    mode: ${stack.react || stack.nextjs ? 'advisory' : 'off'}
  api:
    mode: ${apiMode}
  database:
    mode: ${databaseMode}
  crawler:
    mode: ${crawlerMode}
rules:
  no_silent_failure:
    mode: changed-files
  no_secret_logging:
    mode: changed-files
  workflow_security:
    mode: advisory
  file_size_advisory:
    mode: advisory
    source_file_warning_lines: ${fileSizeThresholds.source_file_warning_lines}
    source_file_review_lines: ${fileSizeThresholds.source_file_review_lines}
  responsibility_budget:
    mode: advisory
    next_page_review_lines: ${responsibilityThresholds.next_page_review_lines}
    client_module_review_lines: ${responsibilityThresholds.client_module_review_lines}
    route_review_lines: ${responsibilityThresholds.route_review_lines}
    import_ops_script_review_lines: ${responsibilityThresholds.import_ops_script_review_lines}
    python_orchestrator_review_lines: ${responsibilityThresholds.python_orchestrator_review_lines}
  external_input_validation:
    mode: advisory
  null_state_safety:
    mode: advisory
  authz_data_isolation:
    mode: advisory
  build_runtime_env_safety:
    mode: advisory
  write_safety_idempotency:
    mode: advisory
  api_contract_compatibility:
    mode: advisory
  performance_duplicate_fetch:
    mode: advisory
  public_safe_error:
    mode: advisory
  sql_parameter_binding:
    mode: ${databaseMode}
  db_row_validation:
    mode: ${databaseMode}
  type_escape_advisory:
    mode: advisory
  thin_api_route:
    mode: ${apiMode}
  component_responsibility:
    mode: ${stack.react || stack.nextjs ? 'advisory' : 'off'}
  side_effect_boundary:
    mode: advisory
  broad_exception_advisory:
    mode: ${stack.python ? 'advisory' : 'off'}
  crawler_producer_boundary:
    mode: ${crawlerMode}
baseline:
  enabled: false
  candidate_report: .jhste/deep-scan-report.md
strict:
  enabled: false
  requires_explicit_opt_in: true
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = findGitRoot(args.repo || process.cwd());
  const profileState = loadProfileConfig(repoRoot);
  responsibilityThresholds = responsibilityBudgetSettings(profileState.profile);
  fileSizeThresholds = fileSizeSettings(profileState.profile);
  const { files, skipped } = collectFiles(repoRoot);
  const stack = detectStack(repoRoot, files);
  const instructions = detectInstructions(repoRoot);
  const findings = scanFiles(files);
  const jhsteDir = path.join(repoRoot, '.jhste');
  ensureDir(jhsteDir);
  const reportPath = path.join(jhsteDir, 'deep-scan-report.md');
  const recommendedPath = path.join(jhsteDir, 'profile.recommended.yaml');
  atomicWrite(reportPath, renderReport({ repoRoot, files, skipped, stack, instructions, findings }));
  atomicWrite(recommendedPath, renderRecommendedProfile({ stack, findings }));

  console.log('Deep scan이 끝났습니다. 코드는 수정하지 않았습니다.');
  console.log(`- 감지된 stack: ${Object.entries(stack).filter(([, value]) => value).map(([key]) => key).join(', ') || 'none'}`);
  console.log(`- Files inspected: ${files.length}`);
  console.log(`- Files skipped: ${skipped.length}`);
  console.log('- 추천: advisory default, changed-files 후보는 사용자 승인 후 적용');
  console.log('\n결과 파일:');
  console.log(`- ${relativeDisplay(repoRoot, reportPath)}`);
  console.log(`- ${relativeDisplay(repoRoot, recommendedPath)}`);
  console.log('\n추천 설정을 적용하려면:');
  console.log('  npx jhste-skills tune');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
