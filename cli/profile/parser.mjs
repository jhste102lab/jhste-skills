import {
  BASELINE_KEYS,
  COMMAND_KEYS,
  DOCUMENTATION_ONLY_SECTIONS,
  FILE_SIZE_RULE_KEYS,
  GUARD_KEYS,
  LEGACY_IGNORED_GUARD_NESTED_KEYS,
  PACK_KEYS,
  RESPONSIBILITY_RULE_KEYS,
  RULE_COMMON_KEYS,
  SINGLE_RESPONSIBILITY_RULE_KEYS,
  TOP_LEVEL_SECTIONS,
  defaultProfile,
} from './schema.mjs';

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
    try { return JSON.parse(trimmed); } catch { return trimmed.slice(1, -1); }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1);
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
    } else if (char === ',' && !quote) {
      out.push(parseScalar(current.trim()));
      current = '';
    } else {
      current += char;
    }
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

function allowedRuleKeys(rule) {
  if (rule === 'file_size_advisory') return FILE_SIZE_RULE_KEYS;
  if (rule === 'responsibility_budget') return RESPONSIBILITY_RULE_KEYS;
  if (rule === 'single_responsibility_advisory') return SINGLE_RESPONSIBILITY_RULE_KEYS;
  return RULE_COMMON_KEYS;
}

function handleTopSection(state, match, lineNumber) {
  const section = match[1];
  state.currentPack = '';
  state.currentRule = '';
  state.currentCommand = null;
  state.guardNested = '';
  if (!TOP_LEVEL_SECTIONS.has(section)) {
    state.profile.parse_errors.push(`Unsupported top-level profile section ${section} at line ${lineNumber}`);
    state.section = section;
    return;
  }
  if (state.seenSections.has(section)) state.profile.parse_errors.push(`Duplicate top-level profile section ${section} at line ${lineNumber}`);
  state.seenSections.add(section);
  state.section = section;
  if (section === 'version' && match[2]) state.profile.version = parseScalar(match[2]);
  if (section === 'mode' && match[2]) state.profile.mode = String(parseScalar(match[2]));
  if (section === 'installed_at' && match[2]) state.profile.installed_at = String(parseScalar(match[2]));
}

function handlePackSection(state, line, lineNumber) {
  const pack = /^\s{2}([A-Za-z0-9_-]+):\s*$/.exec(line);
  if (pack) {
    state.currentPack = pack[1];
    if (Object.prototype.hasOwnProperty.call(state.profile.packs, state.currentPack)) state.profile.parse_errors.push(`Duplicate pack profile section ${state.currentPack} at line ${lineNumber}`);
    state.profile.packs[state.currentPack] ||= {};
    return;
  }
  const setting = /^\s{4}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
  if (setting && state.currentPack) assignSectionValue(state.profile.packs[state.currentPack], setting[1], setting[2], state.profile, `packs.${state.currentPack}`, lineNumber, PACK_KEYS);
  else state.profile.parse_errors.push(`Unsupported packs profile syntax at line ${lineNumber}`);
}

function handleRuleSection(state, line, lineNumber) {
  const rule = /^\s{2}([A-Za-z0-9_.-]+):\s*$/.exec(line);
  if (rule) {
    state.currentRule = rule[1];
    if (Object.prototype.hasOwnProperty.call(state.profile.rules, state.currentRule)) state.profile.parse_errors.push(`Duplicate rule profile section ${state.currentRule} at line ${lineNumber}`);
    state.profile.rules[state.currentRule] ||= {};
    return;
  }
  const setting = /^\s{4}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
  if (setting && state.currentRule) assignSectionValue(state.profile.rules[state.currentRule], setting[1], setting[2], state.profile, `rules.${state.currentRule}`, lineNumber, allowedRuleKeys(state.currentRule));
  else state.profile.parse_errors.push(`Unsupported rules profile syntax at line ${lineNumber}`);
}

function handleGuardSection(state, line, lineNumber) {
  const nested = /^\s{2}([A-Za-z0-9_-]+):\s*$/.exec(line);
  if (nested) {
    state.guardNested = nested[1];
    if (!LEGACY_IGNORED_GUARD_NESTED_KEYS.has(state.guardNested)) {
      state.profile.parse_errors.push(`Unsupported guard profile key ${state.guardNested} at line ${lineNumber}`);
      state.profile.guard[state.guardNested] ||= {};
      return;
    }
    return;
  }
  const nestedSetting = /^\s{4}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
  if (nestedSetting && state.guardNested) {
    if (LEGACY_IGNORED_GUARD_NESTED_KEYS.has(state.guardNested)) return;
    assignSectionValue(state.profile.guard[state.guardNested], nestedSetting[1], nestedSetting[2], state.profile, `guard.${state.guardNested}`, new Set());
    return;
  }
  const setting = /^\s{2}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
  if (setting) assignSectionValue(state.profile.guard, setting[1], setting[2], state.profile, 'guard', lineNumber, GUARD_KEYS);
  else state.profile.parse_errors.push(`Unsupported guard profile syntax at line ${lineNumber}`);
}

function handleCommandSection(state, line, lineNumber) {
  const command = /^\s{2}-\s+name:\s*(.+?)\s*$/.exec(line);
  if (command) {
    state.currentCommand = { name: unquote(command[1]) };
    state.profile.commands.push(state.currentCommand);
    return;
  }
  const setting = /^\s{4}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
  if (!setting || !state.currentCommand) {
    state.profile.parse_errors.push(`Unsupported commands profile syntax at line ${lineNumber}`);
    return;
  }
  const key = setting[1];
  if (!COMMAND_KEYS.has(key)) {
    state.profile.parse_errors.push(`Unsupported commands profile key ${key} at line ${lineNumber}`);
    return;
  }
  const commandKey = key === 'timeout_seconds' ? 'timeoutSeconds' : key;
  if (Object.prototype.hasOwnProperty.call(state.currentCommand, commandKey)) {
    state.profile.parse_errors.push(`Duplicate commands profile key ${key} at line ${lineNumber}`);
    return;
  }
  const value = parseProfileValue(setting[2]);
  if (key === 'timeout_seconds') state.currentCommand.timeoutSeconds = Number(value);
  else state.currentCommand[key] = value;
}

function handleSimpleSection(profile, section, line, lineNumber, allowedKeys) {
  const setting = /^\s{2}([A-Za-z0-9_-]+):\s*(.+?)\s*$/.exec(line);
  if (setting) assignSectionValue(profile[section], setting[1], setting[2], profile, section, lineNumber, allowedKeys);
  else profile.parse_errors.push(`Unsupported ${section} profile syntax at line ${lineNumber}`);
}

function routeProfileLine(state, line, lineNumber) {
  if (DOCUMENTATION_ONLY_SECTIONS.has(state.section)) {
    const setting = /^\s{2}([A-Za-z0-9_-]+):\s*(.*?)\s*$/.exec(line);
    if (setting && setting[2]) assignSectionValue(state.profile[state.section], setting[1], setting[2], state.profile, state.section, lineNumber);
    return;
  }
  if (state.section === 'packs') return handlePackSection(state, line, lineNumber);
  if (state.section === 'rules') return handleRuleSection(state, line, lineNumber);
  if (state.section === 'baseline') return handleSimpleSection(state.profile, 'baseline', line, lineNumber, BASELINE_KEYS);
  if (state.section === 'guard') return handleGuardSection(state, line, lineNumber);
  if (state.section === 'commands') return handleCommandSection(state, line, lineNumber);
  state.profile.parse_errors.push(`Unsupported profile indentation or section at line ${lineNumber}`);
}

export function parseProfileText(text) {
  const state = {
    profile: defaultProfile(),
    section: '',
    currentPack: '',
    currentRule: '',
    currentCommand: null,
    guardNested: '',
    seenSections: new Set(),
  };
  String(text || '').split(/\r?\n/).forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = stripInlineComment(rawLine);
    if (!line.trim()) return;
    const top = /^(\w[\w-]*):\s*(.*?)\s*$/.exec(line);
    if (top) handleTopSection(state, top, lineNumber);
    else routeProfileLine(state, line, lineNumber);
  });
  return state.profile;
}
