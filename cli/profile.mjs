import fs from 'node:fs';
import path from 'node:path';

export const PROFILE_MODES = new Set(['off', 'advisory', 'changed-files', 'baseline-new-only', 'strict']);
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

export function parseProfileText(text) {
  const profile = {
    mode: DEFAULT_PROFILE_MODE,
    packs: {},
    rules: {},
    baseline: {},
    guard: {},
  };
  let section = '';
  let currentPack = '';
  let currentRule = '';

  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = stripInlineComment(rawLine);
    if (!line.trim()) continue;

    const top = /^(\w[\w-]*):\s*(.*?)\s*$/.exec(line);
    if (top) {
      section = top[1];
      currentPack = '';
      currentRule = '';
      if (section === 'mode' && top[2]) profile.mode = String(parseScalar(top[2]));
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
      continue;
    }

    if (section === 'baseline') {
      const setting = /^\s{2}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
      if (setting) assignSectionValue(profile.baseline, setting[1], setting[2]);
      continue;
    }

    if (section === 'guard') {
      const setting = /^\s{2}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
      if (setting) assignSectionValue(profile.guard, setting[1], setting[2]);
    }
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
  const errors = [];
  if (profile.mode && !PROFILE_MODES.has(profile.mode)) errors.push(`Unsupported root profile mode: ${profile.mode}`);
  for (const [pack, config] of Object.entries(profile.packs || {})) {
    if (config.mode && !PROFILE_MODES.has(config.mode)) errors.push(`Unsupported pack mode for ${pack}: ${config.mode}`);
  }
  for (const [rule, config] of Object.entries(profile.rules || {})) {
    if (config.mode && !PROFILE_MODES.has(config.mode)) errors.push(`Unsupported rule mode for ${rule}: ${config.mode}`);
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
