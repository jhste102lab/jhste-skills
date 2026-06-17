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

function scanFile(file, text, findings) {
  const lines = text.split(/\r?\n/);
  const lineCount = lines.length;
  const isSource = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py'].includes(file.ext);
  if (isSource && lineCount >= 400) {
    candidate(findings.largeFiles, 'large file', file, 1, `${lineCount} lines`, lineCount >= 600 ? 'review' : 'warning');
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
  if (routeLike && lineCount >= 250) {
    candidate(findings.routeResponsibility, 'route responsibility candidate', file, 1, `${lineCount} lines in route/controller-like file`);
  }
  if (/['"]use client['"]/.test(text) && /from ['"](fs|path|server-only|.*db.*|.*database.*|.*prisma.*)['"]/.test(text)) {
    candidate(findings.clientServerSeam, 'client/server seam candidate', file, 1, 'client file imports a server-like module');
  }
  if (/function\s+(format|helper|build|make|map)\w*\s*\([^)]*\)\s*{[\s\S]{0,1200}\b(fetch|writeFile|readFile|exec|spawn|setTimeout)\b/.test(text)) {
    candidate(findings.hiddenSideEffects, 'hidden side-effect candidate', file, 1, 'generic helper appears to perform side effects');
  }
}

function scanFiles(files) {
  const findings = {
    largeFiles: [],
    silentFailures: [],
    typeEscapes: [],
    rawSql: [],
    dbInRoutes: [],
    routeResponsibility: [],
    clientServerSeam: [],
    hiddenSideEffects: [],
    secretLogging: [],
  };
  for (const file of files) {
    try {
      const text = fs.readFileSync(file.full, 'utf8');
      scanFile(file, text, findings);
    } catch {
      // File read failures are represented in summary by omission; scan remains best-effort.
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
### Existing client/server seam candidates
${tableRows(findings.clientServerSeam)}
### Existing hidden side-effect candidates
${tableRows(findings.hiddenSideEffects)}
### Secret-like logging candidates
${tableRows(findings.secretLogging)}

## New-code guard candidates
- Start with changed-files mode for no_silent_failure and no_secret_logging after human review.
- Consider baseline-new-only only after accepting a baseline generated from this report.
- Keep strict disabled unless a user explicitly opts in.

## Skipped file summary
- Excluded generated/vendor/build/dependency folders, lockfiles, large files, binary-like extensions, and secret/env-like files.
- Skipped entries recorded: ${skipped.length}

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
  file_size_advisory:
    mode: advisory
    source_file_warning_lines: 400
    source_file_review_lines: 600
  type_escape_advisory:
    mode: advisory
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
