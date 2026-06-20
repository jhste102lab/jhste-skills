export const PROFILE_MODES = new Set(['off', 'advisory', 'changed-files', 'baseline-new-only', 'strict']);
export const KNOWN_PACK_IDS = new Set(['core', 'web', 'api', 'database', 'crawler']);
export const KNOWN_RULE_IDS = new Set([
  'api_contract_compatibility',
  'authz_data_isolation',
  'broad_exception_advisory',
  'build_runtime_env_safety',
  'component_responsibility',
  'crawler_producer_boundary',
  'db_row_validation',
  'external_input_validation',
  'extension_seam_advisory',
  'file_size_advisory',
  'interface_segregation_advisory',
  'no_secret_logging',
  'no_silent_failure',
  'null_state_safety',
  'performance_duplicate_fetch',
  'public_safe_error',
  'responsibility_budget',
  'dependency_boundary_advisory',
  'side_effect_boundary',
  'single_responsibility_advisory',
  'sql_parameter_binding',
  'substitutability_advisory',
  'thin_api_route',
  'type_escape_advisory',
  'workflow_security',
  'write_safety_idempotency',
]);

export const DEFAULT_PROFILE_MODE = 'advisory';
export const DEFAULT_BASELINE_PATH = '.jhste/baseline.json';

export const DEFAULT_RESPONSIBILITY_BUDGET = Object.freeze({
  next_page_review_lines: 200,
  client_module_review_lines: 200,
  route_review_lines: 250,
  import_ops_script_review_lines: 280,
  python_orchestrator_review_lines: 600,
});

export const DEFAULT_FILE_SIZE = Object.freeze({
  source_file_warning_lines: 300,
  source_file_review_lines: 300,
});

export const DEFAULT_SINGLE_RESPONSIBILITY = Object.freeze({
  function_review_lines: 80,
  mixed_responsibility_hints: 3,
  module_export_family_hints: 4,
});

export const TOP_LEVEL_SECTIONS = new Set(['version', 'mode', 'installed_at', 'adapters', 'packs', 'rules', 'baseline', 'guard', 'deep_scan', 'workflow', 'strict', 'commands', 'recommendations']);
export const DOCUMENTATION_ONLY_SECTIONS = new Set(['adapters', 'deep_scan', 'workflow', 'strict', 'recommendations']);
export const PACK_KEYS = new Set(['mode']);
export const RULE_COMMON_KEYS = new Set(['mode']);
export const FILE_SIZE_RULE_KEYS = new Set(['mode', ...Object.keys(DEFAULT_FILE_SIZE)]);
export const RESPONSIBILITY_RULE_KEYS = new Set(['mode', ...Object.keys(DEFAULT_RESPONSIBILITY_BUDGET)]);
export const SINGLE_RESPONSIBILITY_RULE_KEYS = new Set(['mode', ...Object.keys(DEFAULT_SINGLE_RESPONSIBILITY)]);
export const BASELINE_KEYS = new Set(['enabled', 'path', 'candidate_report']);
export const GUARD_KEYS = new Set(['default_scope', 'default_format', 'fail_on']);
export const GUARD_NESTED_KEYS = new Map([
  ['exit_codes', new Set(['pass', 'violation_failure', 'guard_runtime_failure', 'config_failure'])],
]);
export const COMMAND_KEYS = new Set(['name', 'cmd', 'args', 'run', 'severity', 'timeout_seconds']);

export function defaultProfile() {
  return {
    version: null,
    mode: DEFAULT_PROFILE_MODE,
    installed_at: null,
    adapters: {},
    packs: {},
    rules: {},
    baseline: {},
    guard: {},
    deep_scan: {},
    workflow: {},
    strict: {},
    recommendations: {},
    commands: [],
    parse_errors: [],
  };
}
