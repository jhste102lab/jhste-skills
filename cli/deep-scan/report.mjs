import path from 'node:path';
import { nowIso } from '../shared.mjs';

function tableRows(rows) {
  if (rows.length === 0) return '- None found in scanned files.\n';
  return rows.slice(0, 50).map((row) => `- \`${row.file}:${row.line}\` — ${row.detail}`).join('\n') + (rows.length > 50 ? `\n- ... ${rows.length - 50} more candidates omitted from summary` : '') + '\n';
}

function yesNo(value) {
  return value ? 'yes' : 'no';
}

export function recommendedPacks(stack, findings) {
  return [
    ['core', 'advisory', 'Safe default for all repositories'],
    ['web', stack.react || stack.nextjs ? 'advisory' : 'off', stack.react || stack.nextjs ? 'React or web stack detected' : 'No web stack detected'],
    ['api', stack.nextjs || findings.dbInRoutes.length || findings.routeResponsibility.length ? 'changed-files' : 'advisory', 'API boundary candidates can start with changed files only'],
    ['database', stack.postgresql || findings.rawSql.length ? 'advisory' : 'off', stack.postgresql || findings.rawSql.length ? 'Database or SQL hints detected' : 'No database hints detected'],
    ['crawler', stack.crawler ? 'advisory' : 'off', stack.crawler ? 'Crawler or automation hints detected' : 'No crawler hints detected'],
  ];
}

export function renderReport({ repoRoot, files, skipped, source, stack, instructions, findings }) {
  const packRows = recommendedPacks(stack, findings);
  return `# Deep Scan Report

## Summary
- Scan time: ${nowIso()}
- Repository: ${path.basename(repoRoot)}
- Files inspected: ${files.length}
- Files skipped: ${skipped.length}
- File collection source: ${source?.type || 'unknown'}
- File collection fallback: ${source?.fallback ? `yes (${source.fallback_reason || 'unknown reason'})` : 'no'}
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
### Existing single-responsibility candidates
${tableRows(findings.singleResponsibility)}
### Existing extension seam candidates
${tableRows(findings.extensionSeams)}
### Existing dependency boundary candidates
${tableRows(findings.dependencyBoundaries)}
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

export function renderRecommendedProfile({ stack, findings, thresholds }) {
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
    source_file_warning_lines: ${thresholds.fileSize.source_file_warning_lines}
    source_file_review_lines: ${thresholds.fileSize.source_file_review_lines}
  responsibility_budget:
    mode: advisory
    next_page_review_lines: ${thresholds.responsibility.next_page_review_lines}
    client_module_review_lines: ${thresholds.responsibility.client_module_review_lines}
    route_review_lines: ${thresholds.responsibility.route_review_lines}
    import_ops_script_review_lines: ${thresholds.responsibility.import_ops_script_review_lines}
    python_orchestrator_review_lines: ${thresholds.responsibility.python_orchestrator_review_lines}
  single_responsibility_advisory:
    mode: advisory
    function_review_lines: ${thresholds.singleResponsibility.function_review_lines}
    mixed_responsibility_hints: ${thresholds.singleResponsibility.mixed_responsibility_hints}
    module_export_family_hints: ${thresholds.singleResponsibility.module_export_family_hints}
  external_input_validation:
    mode: advisory
  extension_seam_advisory:
    mode: advisory
  dependency_boundary_advisory:
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
