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
import { scanText as scanSharedGuardText } from './guard/scanners/index.mjs';

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

const SHARED_SCANNER_BUCKETS = new Map([
  ['no_silent_failure', 'silentFailures'],
  ['broad_exception_advisory', 'silentFailures'],
  ['no_secret_logging', 'secretLogging'],
  ['file_size_advisory', 'largeFiles'],
  ['responsibility_budget', 'responsibilityBudget'],
  ['component_responsibility', 'clientServerSeam'],
  ['external_input_validation', 'externalInput'],
  ['null_state_safety', 'stateSafety'],
  ['authz_data_isolation', 'authzIsolation'],
  ['build_runtime_env_safety', 'runtimeEnv'],
  ['write_safety_idempotency', 'writeSafety'],
  ['api_contract_compatibility', 'apiContract'],
  ['public_safe_error', 'apiContract'],
  ['db_row_validation', 'apiContract'],
  ['performance_duplicate_fetch', 'performanceDuplication'],
  ['sql_parameter_binding', 'rawSql'],
  ['thin_api_route', 'dbInRoutes'],
  ['type_escape_advisory', 'typeEscapes'],
  ['side_effect_boundary', 'hiddenSideEffects'],
  ['crawler_producer_boundary', 'hiddenSideEffects'],
]);

function deepScanSeverity(finding) {
  if (finding.rule_id === 'file_size.review' || finding.severity === 'error') return 'review';
  if (finding.severity === 'warning') return 'warning';
  return 'advisory';
}

function addSharedScannerCandidates(file, text, findings) {
  const sharedFindings = scanSharedGuardText(file.rel, text, {
    applyProfile: false,
    fileSize: fileSizeThresholds,
    responsibilityBudget: responsibilityThresholds,
  });
  const seen = new Set();
  for (const finding of sharedFindings) {
    const bucket = SHARED_SCANNER_BUCKETS.get(finding.rule_family);
    if (!bucket || !findings[bucket]) continue;
    const key = `${bucket}:${finding.rule_id}:${finding.line}:${finding.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    candidate(
      findings[bucket],
      `${finding.rule_family} candidate`,
      file,
      finding.line || 1,
      finding.message,
      deepScanSeverity(finding),
    );
    if (finding.rule_id === 'responsibility.route.budget') {
      candidate(
        findings.routeResponsibility,
        `${finding.rule_family} candidate`,
        file,
        finding.line || 1,
        finding.message,
        deepScanSeverity(finding),
      );
    }
  }
}

function hasUseClientDirective(text) {
  return /^\s*(?:"use client"|'use client')\s*;?/u.test(text);
}

function isScriptPipeline(file) {
  return /(^|\/)scripts\/(data|ops|import|imports|backfill|repair|migrate|migration)\//.test(file.rel)
    && /\.(ts|tsx|js|jsx|mjs|cjs|py)$/.test(file.rel);
}

function matchedResponsibilityHints(text, hintGroups) {
  return hintGroups
    .filter((group) => group.patterns.some((pattern) => pattern.test(text)))
    .map((group) => group.label);
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

function scanFile(file, text, findings) {
  addSharedScannerCandidates(file, text, findings);
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
    externalInput: [],
    scanWarnings: [],
  };
  for (const file of files) {
    try {
      const text = fs.readFileSync(file.full, 'utf8');
      scanFile(file, text, findings);
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
### Existing external input validation candidates
${tableRows(findings.externalInput)}
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
- External input validation candidates: ${findings.externalInput.length}
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
