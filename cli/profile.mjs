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
  source_file_warning_lines: 300,
  source_file_review_lines: 300,
});

const TOP_LEVEL_SECTIONS = new Set(['version', 'mode', 'installed_at', 'adapters', 'packs', 'rules', 'baseline', 'guard', 'deep_scan', 'workflow', 'strict', 'commands', 'recommendations']);
const DOCUMENTATION_ONLY_SECTIONS = new Set(['adapters', 'deep_scan', 'workflow', 'strict', 'recommendations']);
const PACK_KEYS = new Set(['mode']);
const RULE_COMMON_KEYS = new Set(['mode']);
const FILE_SIZE_RULE_KEYS = new Set(['mode', ...Object.keys(DEFAULT_FILE_SIZE)]);
const RESPONSIBILITY_RULE_KEYS = new Set(['mode', ...Object.keys(DEFAULT_RESPONSIBILITY_BUDGET)]);
const BASELINE_KEYS = new Set(['enabled', 'path', 'candidate_report']);
const GUARD_KEYS = new Set(['default_scope', 'default_format', 'fail_on']);
const GUARD_NESTED_KEYS = new Map([
  ['exit_codes', new Set(['pass', 'violation_failure', 'guard_runtime_failure', 'config_failure'])],
]);
const COMMAND_KEYS = new Set(['name', 'cmd', 'args', 'run', 'severity', 'timeout_seconds']);

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
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
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

function parseInlineList(value) {
  const normalized = String(value || '').trim();
  if (!normalized.startsWith('[') || !normalized.endsWith(']')) return null;
  const body = normalized.slice(1, -1).trim();
  if (!body) return [];
  const out = [];
  let current = '';
  let quote = '';
  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    if ((char === '"' || char === "'") && body[index - 1] !== '\\') {
      quote = quote === char ? '' : quote || char;
      current += char;
      continue;
    }
    if (char === ',' && !quote) {
      out.push(parseScalar(current.trim()));
      current = '';
      continue;
    }
    current += char;
  }
  if (quote) return null;
  out.push(parseScalar(current.trim()));
  return out;
}

function parseProfileValue(value) {
  const list = parseInlineList(value);
  return list === null ? parseScalar(value) : list;
}

function assignSectionValue(target, key, value, profile, section, lineNumber, allowedKeys = null) {
  if (allowedKeys && !allowedKeys.has(key)) {
    profile.parse_errors.push(`Unsupported ${section} profile key ${key} at line ${lineNumber}`);
    return;
  }
  if (Object.prototype.hasOwnProperty.call(target, key)) {
    profile.parse_errors.push(`Duplicate ${section} profile key ${key} at line ${lineNumber}`);
    return;
  }
  target[key] = parseProfileValue(value);
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
    recommendations: {},
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
  const seenSections = new Set();

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
      if (seenSections.has(section)) {
        profile.parse_errors.push(`Duplicate top-level profile section ${section} at line ${lineNumber}`);
      }
      seenSections.add(section);
      if (section === 'version' && top[2]) profile.version = parseScalar(top[2]);
      if (section === 'mode' && top[2]) profile.mode = String(parseScalar(top[2]));
      if (section === 'installed_at' && top[2]) profile.installed_at = String(parseScalar(top[2]));
      continue;
    }

    if (DOCUMENTATION_ONLY_SECTIONS.has(section)) {
      const setting = /^\s{2}([A-Za-z0-9_-]+):\s*(.*?)\s*$/.exec(line);
      if (setting && setting[2]) assignSectionValue(profile[section], setting[1], setting[2], profile, section, lineNumber);
      continue;
    }

    if (section === 'packs') {
      const pack = /^\s{2}([A-Za-z0-9_-]+):\s*$/.exec(line);
      if (pack) {
        currentPack = pack[1];
        if (Object.prototype.hasOwnProperty.call(profile.packs, currentPack)) {
          profile.parse_errors.push(`Duplicate pack profile section ${currentPack} at line ${lineNumber}`);
        }
        profile.packs[currentPack] ||= {};
        continue;
      }
      const setting = /^\s{4}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
      if (setting && currentPack) assignSectionValue(profile.packs[currentPack], setting[1], setting[2], profile, `packs.${currentPack}`, lineNumber, PACK_KEYS);
      else profile.parse_errors.push(`Unsupported packs profile syntax at line ${lineNumber}`);
      continue;
    }

    if (section === 'rules') {
      const rule = /^\s{2}([A-Za-z0-9_.-]+):\s*$/.exec(line);
      if (rule) {
        currentRule = rule[1];
        if (Object.prototype.hasOwnProperty.call(profile.rules, currentRule)) {
          profile.parse_errors.push(`Duplicate rule profile section ${currentRule} at line ${lineNumber}`);
        }
        profile.rules[currentRule] ||= {};
        continue;
      }
      const setting = /^\s{4}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
      if (setting && currentRule) {
        const allowed = currentRule === 'file_size_advisory'
          ? FILE_SIZE_RULE_KEYS
          : currentRule === 'responsibility_budget'
            ? RESPONSIBILITY_RULE_KEYS
            : RULE_COMMON_KEYS;
        assignSectionValue(profile.rules[currentRule], setting[1], setting[2], profile, `rules.${currentRule}`, lineNumber, allowed);
      }
      else profile.parse_errors.push(`Unsupported rules profile syntax at line ${lineNumber}`);
      continue;
    }

    if (section === 'baseline') {
      const setting = /^\s{2}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
      if (setting) assignSectionValue(profile.baseline, setting[1], setting[2], profile, 'baseline', lineNumber, BASELINE_KEYS);
      else profile.parse_errors.push(`Unsupported baseline profile syntax at line ${lineNumber}`);
      continue;
    }

    if (section === 'guard') {
      const nested = /^\s{2}([A-Za-z0-9_-]+):\s*$/.exec(line);
      if (nested) {
        guardNested = nested[1];
        if (!GUARD_NESTED_KEYS.has(guardNested)) {
          profile.parse_errors.push(`Unsupported guard profile key ${guardNested} at line ${lineNumber}`);
        }
        if (Object.prototype.hasOwnProperty.call(profile.guard, guardNested)) {
          profile.parse_errors.push(`Duplicate guard profile key ${guardNested} at line ${lineNumber}`);
        }
        profile.guard[guardNested] ||= {};
        continue;
      }
      const nestedSetting = /^\s{4}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
      if (nestedSetting && guardNested) {
        assignSectionValue(profile.guard[guardNested], nestedSetting[1], nestedSetting[2], profile, `guard.${guardNested}`, lineNumber, GUARD_NESTED_KEYS.get(guardNested) || new Set());
        continue;
      }
      const setting = /^\s{2}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
      if (setting) assignSectionValue(profile.guard, setting[1], setting[2], profile, 'guard', lineNumber, GUARD_KEYS);
      else profile.parse_errors.push(`Unsupported guard profile syntax at line ${lineNumber}`);
      continue;
    }

    if (section === 'commands') {
      const command = /^\s{2}-\s+name:\s*(.+?)\s*$/.exec(line);
      if (command) {
        currentCommand = { name: unquote(command[1]) };
        profile.commands.push(currentCommand);
        continue;
      }
      const setting = /^\s{4}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
      if (setting && currentCommand) {
        const key = setting[1];
        if (!COMMAND_KEYS.has(key)) {
          profile.parse_errors.push(`Unsupported commands profile key ${key} at line ${lineNumber}`);
          continue;
        }
        const commandKey = key === 'timeout_seconds' ? 'timeoutSeconds' : key;
        if (Object.prototype.hasOwnProperty.call(currentCommand, commandKey)) {
          profile.parse_errors.push(`Duplicate commands profile key ${key} at line ${lineNumber}`);
          continue;
        }
        const value = parseProfileValue(setting[2]);
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
    if (rule === 'file_size_advisory') {
      for (const key of Object.keys(DEFAULT_FILE_SIZE)) validatePositiveInteger(config[key], `rules.${rule}.${key}`, errors, { min: 1, max: 10000 });
    }
    if (rule === 'responsibility_budget') {
      for (const key of Object.keys(DEFAULT_RESPONSIBILITY_BUDGET)) validatePositiveInteger(config[key], `rules.${rule}.${key}`, errors, { min: 1, max: 10000 });
    }
  }
  if (Object.prototype.hasOwnProperty.call(profile.baseline || {}, 'enabled') && typeof profile.baseline.enabled !== 'boolean') {
    errors.push('baseline.enabled must be true or false.');
  }
  for (const key of ['path', 'candidate_report']) {
    if (Object.prototype.hasOwnProperty.call(profile.baseline || {}, key) && typeof profile.baseline[key] !== 'string') {
      errors.push(`baseline.${key} must be a string path.`);
    }
  }
  if (profile.guard?.default_scope && !['changed', 'staged', 'all', 'files-from'].includes(String(profile.guard.default_scope))) {
    errors.push(`guard.default_scope must be changed, staged, all, or files-from.`);
  }
  if (profile.guard?.default_format && !['text', 'json'].includes(String(profile.guard.default_format))) {
    errors.push('guard.default_format must be text or json.');
  }
  if (profile.guard?.fail_on && !['none', 'warning', 'error'].includes(String(profile.guard.fail_on))) {
    errors.push('guard.fail_on must be none, warning, or error.');
  }
  for (const [key, value] of Object.entries(profile.guard?.exit_codes || {})) {
    validatePositiveInteger(value, `guard.exit_codes.${key}`, errors, { min: 0, max: 255 });
  }
  for (const command of profile.commands || []) {
    if (!command.name || typeof command.name !== 'string') errors.push('Each profile command needs a string name field.');
    const hasCmd = Object.prototype.hasOwnProperty.call(command, 'cmd');
    const hasRun = Object.prototype.hasOwnProperty.call(command, 'run');
    if (!hasCmd && !hasRun) errors.push(`Profile command ${command.name || 'unnamed'} needs cmd/args or legacy run.`);
    if (hasCmd && hasRun) errors.push(`Profile command ${command.name || 'unnamed'} must not combine cmd and run.`);
    if (hasCmd && (typeof command.cmd !== 'string' || !command.cmd.trim())) errors.push(`Profile command ${command.name || 'unnamed'} has invalid cmd; use a non-empty string.`);
    if (hasRun && (typeof command.run !== 'string' || !command.run.trim())) errors.push(`Profile command ${command.name || 'unnamed'} has invalid run; use a non-empty string.`);
    if (Object.prototype.hasOwnProperty.call(command, 'args')) {
      if (!Array.isArray(command.args) || command.args.some((item) => typeof item !== 'string')) {
        errors.push(`Profile command ${command.name || 'unnamed'} args must be an inline string array.`);
      }
    }
    if (command.severity && !['info', 'warning', 'error'].includes(command.severity)) errors.push(`Profile command ${command.name || 'unnamed'} has unsupported severity ${command.severity}.`);
    if (command.timeoutSeconds !== undefined && (!Number.isFinite(command.timeoutSeconds) || command.timeoutSeconds <= 0 || command.timeoutSeconds > 1800)) {
      errors.push(`Profile command ${command.name || 'unnamed'} has invalid timeout_seconds; use 1..1800.`);
    }
  }
  return errors;
}

function validatePositiveInteger(value, label, errors, { min, max }) {
  if (value === undefined) return;
  if (!Number.isInteger(Number(value)) || Number(value) < min || Number(value) > max) {
    errors.push(`${label} must be an integer from ${min} to ${max}.`);
  }
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
