import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const KIT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const BRIDGE_START = '<!-- jhste-skills:start -->';
export const BRIDGE_END = '<!-- jhste-skills:end -->';

export const BRIDGE_BLOCK = `## Agent skills
This repo uses jhste skills as shared guidance.
Repo-local instructions in this file remain authoritative.
See \`.jhste/profile.yaml\` for local skill preferences.
Before non-trivial code changes, use the \`jhste-engineering-judgment\` skill to check scope, seams, failure paths, and assumptions.
For changed code, name the one main responsibility of each changed class, module, and function, and reject adjacent responsibilities unless they are on the changed execution path and prevent a concrete failure.
After code changes, run \`jhste-skills guard --scope changed --format text --fail-on error\` when available.
Report guard warnings/errors; do not treat guard runtime/config failures as validation success.
If guard or red-team review reports new warnings on changed files, attempt a bounded fix before declaring completion, then rerun guard. Do not commit automatically.
Before declaring non-trivial code work complete, use the \`jhste-red-team-review\` skill.
Skip red-team review for docs-only, comment-only, formatting-only, or trivial rename-only changes.
Do not enter an unbounded fix/review loop; stop after at most two fix + re-review cycles and report remaining risks.`;

export const MANAGED_BRIDGE_BLOCK = `${BRIDGE_START}\n${BRIDGE_BLOCK}\n${BRIDGE_END}`;

export const DEFAULT_PROFILE = `version: 1
mode: advisory
installed_at: "<installed_at>"
adapters:
  codex: auto
  claude: auto
rules:
  file_size_advisory:
    mode: advisory
    source_file_warning_lines: 300
    source_file_review_lines: 300
  responsibility_budget:
    next_page_review_lines: 200
    client_module_review_lines: 200
    route_review_lines: 250
    import_ops_script_review_lines: 280
    python_orchestrator_review_lines: 600
  single_responsibility_advisory:
    mode: advisory
    function_review_lines: 80
    mixed_responsibility_hints: 3
    module_export_family_hints: 4
baseline:
  enabled: false
  path: .jhste/baseline.json
guard:
  default_scope: changed
  default_format: text
  exit_codes:
    pass: 0
    violation_failure: 1
    guard_runtime_failure: 2
    config_failure: 3
deep_scan:
  last_run: null
  report: .jhste/deep-scan-report.md
  recommended_profile: .jhste/profile.recommended.yaml
workflow:
  final_review:
    auto_for_non_trivial_code_changes: true
    skip_when:
      - docs_only
      - comment_only
      - formatting_only
      - trivial_rename_only
    max_fix_review_cycles: 2
`;
