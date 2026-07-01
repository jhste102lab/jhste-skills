import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const KIT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const BRIDGE_START = '<!-- jhste-skills:start -->';
export const BRIDGE_END = '<!-- jhste-skills:end -->';

export const BRIDGE_BLOCK = `## Agent skills
This repo uses jhste skills as installed workflow guidance.
Repo-local instructions in this file remain authoritative.
Use \`ask-jhste\` as the router for jhste coding, review, setup, and workstate workflows; detailed policy lives in the installed skills and their \`_shared\` docs, not this block.
For non-trivial code changes: run \`jhste-preflight\` before editing, \`jhste-skills guard --scope changed\` and \`jhste-change-review\` on the changed path, then \`jhste-redteam\` before completion.
Before destructive, irreversible, production, secret-bearing, cost-bearing, commit, push, release, publish, or broad out-of-scope actions, follow repo-local instructions and the side-effect policy in the installed skills directory's \`_shared/side-effect-policy.md\`.
See \`.jhste/profile.yaml\` for local skill preferences.`;

export const MANAGED_BRIDGE_BLOCK = `${BRIDGE_START}\n${BRIDGE_BLOCK}\n${BRIDGE_END}`;

// Agent-neutral variant written to a global instruction file (e.g. Claude
// ~/.claude/CLAUDE.md, Codex ~/.codex/AGENTS.md, OpenCode
// ~/.config/opencode/AGENTS.md). Shares the same markers so it is
// marker-managed (idempotent update/removal), but omits repo-only wording and the
// repo profile reference, and frames guard as advisory (no per-repo hooks).
export const GLOBAL_BRIDGE_BLOCK = `## Agent skills (jhste, global)
jhste skills are installed globally as shared engineering guidance for this agent.
Repo-local AGENTS.md, CLAUDE.md, and docs remain authoritative when present.
Use \`ask-jhste\` as the router for jhste coding, review, setup, and workstate workflows; detailed policy lives in the installed skills and their \`_shared\` docs.
For non-trivial code changes: run \`jhste-preflight\` before editing, \`jhste-skills guard --scope changed\` (advisory) and \`jhste-change-review\` on the changed path, then \`jhste-redteam\` before completion.
Before destructive, irreversible, production, secret-bearing, cost-bearing, commit, push, release, publish, or broad out-of-scope actions, follow repo-local instructions and the side-effect policy in the installed skills directory's \`_shared/side-effect-policy.md\`.`;

export const MANAGED_GLOBAL_BRIDGE_BLOCK = `${BRIDGE_START}\n${GLOBAL_BRIDGE_BLOCK}\n${BRIDGE_END}`;

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
  extension_seam_advisory:
    mode: advisory
  dependency_boundary_advisory:
    mode: advisory
baseline:
  enabled: false
  path: .jhste/baseline.json
guard:
  default_scope: changed
  default_format: text
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
