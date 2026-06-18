import fs from 'node:fs';
import path from 'node:path';

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
  'file_size_advisory',
  'no_secret_logging',
  'no_silent_failure',
  'null_state_safety',
  'performance_duplicate_fetch',
  'public_safe_error',
  'responsibility_budget',
  'side_effect_boundary',
  'sql_parameter_binding',
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
  source_file_warning_lines: 400,
  source_file_review_lines: 600,
});

const TOP_LEVEL_SECTIONS = new Set(['version', 'mode', 'installed_at', 'adapters', 'packs', 'rules', 'baseline', 'guard', 'deep_scan', 'workflow', 'strict', 'commands']);
const DOCUMENTATION_ONLY_SECTIONS = new Set(['adapters', 'deep_scan', 'workflow', 'strict']);

function stripInlineComment(raw) {
  let quote = '';
  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    if ((char === '"' || char === "'") && raw[index - 1] !== '\\') {
      quote = quote === char ? '' : quote || char;
      continue;
    }
    if (char === '#' && !quote) return raw.slice(0, index).trimEnd();
  }
  return raw.trimEnd();
}

function unquote(value) {
  const trimmed = String(value ?? '').trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function parseScalar(value) {
  const normalized = unquote(value);
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  if (normalized === 'null') return null;
  if (/^-?\d+(?:\.\d+)?$/.test(normalized)) return Number(normalized);
  return normalized;
}

function assignSectionValue(target, key, value) {
  target[key] = parseScalar(value);
}

function defaultProfile() {
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
    commands: [],
    parse_errors: [],
  };
}

export function parseProfileText(text) {
  const profile = defaultProfile();
  let section = '';
  let currentPack = '';
  let currentRule = '';
  let currentCommand = null;
  let guardNested = '';

  const lines = String(text || '').split(/\r?\n/);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const lineNumber = lineIndex + 1;
    const line = stripInlineComment(lines[lineIndex]);
    if (!line.trim()) continue;

    const top = /^(\w[\w-]*):\s*(.*?)\s*$/.exec(line);
    if (top) {
      section = top[1];
      currentPack = '';
      currentRule = '';
      currentCommand = null;
      guardNested = '';
      if (!TOP_LEVEL_SECTIONS.has(section)) {
        profile.parse_errors.push(`Unsupported top-level profile section ${section} at line ${lineNumber}`);
        continue;
      }
      if (section === 'version' && top[2]) profile.version = parseScalar(top[2]);
      if (section === 'mode' && top[2]) profile.mode = String(parseScalar(top[2]));
      if (section === 'installed_at' && top[2]) profile.installed_at = String(parseScalar(top[2]));
      continue;
    }

    if (DOCUMENTATION_ONLY_SECTIONS.has(section)) {
      const setting = /^\s{2}([A-Za-z0-9_-]+):\s*(.*?)\s*$/.exec(line);
      if (setting && setting[2]) assignSectionValue(profile[section], setting[1], setting[2]);
      continue;
    }

    if (section === 'packs') {
      const pack = /^\s{2}([A-Za-z0-9_-]+):\s*$/.exec(line);
      if (pack) {
        currentPack = pack[1];
        profile.packs[currentPack] ||= {};
        continue;
      }
      const setting = /^\s{4}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
      if (setting && currentPack) assignSectionValue(profile.packs[currentPack], setting[1], setting[2]);
      else profile.parse_errors.push(`Unsupported packs profile syntax at line ${lineNumber}`);
      continue;
    }

    if (section === 'rules') {
      const rule = /^\s{2}([A-Za-z0-9_.-]+):\s*$/.exec(line);
      if (rule) {
        currentRule = rule[1];
        profile.rules[currentRule] ||= {};
        continue;
      }
      const setting = /^\s{4}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
      if (setting && currentRule) assignSectionValue(profile.rules[currentRule], setting[1], setting[2]);
      else profile.parse_errors.push(`Unsupported rules profile syntax at line ${lineNumber}`);
      continue;
    }

    if (section === 'baseline') {
      const setting = /^\s{2}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
      if (setting) assignSectionValue(profile.baseline, setting[1], setting[2]);
      else profile.parse_errors.push(`Unsupported baseline profile syntax at line ${lineNumber}`);
      continue;
    }

    if (section === 'guard') {
      const nested = /^\s{2}([A-Za-z0-9_-]+):\s*$/.exec(line);
      if (nested) {
        guardNested = nested[1];
        profile.guard[guardNested] ||= {};
        continue;
      }
      const nestedSetting = /^\s{4}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
      if (nestedSetting && guardNested) {
        assignSectionValue(profile.guard[guardNested], nestedSetting[1], nestedSetting[2]);
        continue;
      }
      const setting = /^\s{2}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
      if (setting) assignSectionValue(profile.guard, setting[1], setting[2]);
      else profile.parse_errors.push(`Unsupported guard profile syntax at line ${lineNumber}`);
      continue;
    }

    if (section === 'commands') {
      const command = /^\s{2}-\s+name:\s*(.+?)\s*$/.exec(line);
      if (command) {
        currentCommand = { name: unquote(command[1]), run: '', severity: 'error', timeoutSeconds: 120 };
        profile.commands.push(currentCommand);
        continue;
      }
      const setting = /^\s{4}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
      if (setting && currentCommand) {
        const key = setting[1];
        const value = parseScalar(setting[2]);
        if (key === 'timeout_seconds') currentCommand.timeoutSeconds = Number(value);
        else currentCommand[key] = value;
        continue;
      }
      profile.parse_errors.push(`Unsupported commands profile syntax at line ${lineNumber}`);
      continue;
    }

    profile.parse_errors.push(`Unsupported profile indentation or section at line ${lineNumber}`);
  }

  return profile;
}

export function loadProfileConfig(repoRoot) {
  const profilePath = path.join(repoRoot, '.jhste', 'profile.yaml');
  if (!fs.existsSync(profilePath)) {
    return { path: profilePath, exists: false, profile: parseProfileText('') };
  }
  return {
    path: profilePath,
    exists: true,
    profile: parseProfileText(fs.readFileSync(profilePath, 'utf8')),
  };
}

export function validateProfileConfig(profile) {
  const errors = [...(profile.parse_errors || [])];
  if (profile.mode && !PROFILE_MODES.has(profile.mode)) errors.push(`Unsupported root profile mode: ${profile.mode}`);
  for (const [pack, config] of Object.entries(profile.packs || {})) {
    if (!KNOWN_PACK_IDS.has(pack)) errors.push(`Unknown pack id in profile: ${pack}`);
    if (config.mode && !PROFILE_MODES.has(config.mode)) errors.push(`Unsupported pack mode for ${pack}: ${config.mode}`);
  }
  for (const [rule, config] of Object.entries(profile.rules || {})) {
    if (!KNOWN_RULE_IDS.has(rule)) errors.push(`Unknown rule family id in profile: ${rule}`);
    if (config.mode && !PROFILE_MODES.has(config.mode)) errors.push(`Unsupported rule mode for ${rule}: ${config.mode}`);
  }
  for (const command of profile.commands || []) {
    if (!command.name || !command.run) errors.push('Each profile command needs name and run fields.');
    if (command.severity && !['info', 'warning', 'error'].includes(command.severity)) errors.push(`Profile command ${command.name || 'unnamed'} has unsupported severity ${command.severity}.`);
    if (!Number.isFinite(command.timeoutSeconds) || command.timeoutSeconds <= 0 || command.timeoutSeconds > 1800) {
      errors.push(`Profile command ${command.name || 'unnamed'} has invalid timeout_seconds; use 1..1800.`);
    }
  }
  return errors;
}

export function effectiveRuleMode(profile, { family, pack } = {}) {
  let mode = profile?.mode || DEFAULT_PROFILE_MODE;
  if (pack && profile?.packs?.[pack]?.mode) mode = String(profile.packs[pack].mode);
  if (family && profile?.rules?.[family]?.mode) mode = String(profile.rules[family].mode);
  return mode;
}

function numberSetting(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

export function responsibilityBudgetSettings(profile) {
  const rule = profile?.rules?.responsibility_budget || {};
  return {
    next_page_review_lines: numberSetting(rule.next_page_review_lines, DEFAULT_RESPONSIBILITY_BUDGET.next_page_review_lines),
    client_module_review_lines: numberSetting(rule.client_module_review_lines, DEFAULT_RESPONSIBILITY_BUDGET.client_module_review_lines),
    route_review_lines: numberSetting(rule.route_review_lines, DEFAULT_RESPONSIBILITY_BUDGET.route_review_lines),
    import_ops_script_review_lines: numberSetting(rule.import_ops_script_review_lines, DEFAULT_RESPONSIBILITY_BUDGET.import_ops_script_review_lines),
    python_orchestrator_review_lines: numberSetting(rule.python_orchestrator_review_lines, DEFAULT_RESPONSIBILITY_BUDGET.python_orchestrator_review_lines),
  };
}

export function fileSizeSettings(profile) {
  const rule = profile?.rules?.file_size_advisory || {};
  return {
    source_file_warning_lines: numberSetting(rule.source_file_warning_lines, DEFAULT_FILE_SIZE.source_file_warning_lines),
    source_file_review_lines: numberSetting(rule.source_file_review_lines, DEFAULT_FILE_SIZE.source_file_review_lines),
  };
}
