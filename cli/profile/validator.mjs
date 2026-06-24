import {
  DEFAULT_FILE_SIZE,
  DEFAULT_RESPONSIBILITY_BUDGET,
  DEFAULT_SINGLE_RESPONSIBILITY,
  KNOWN_PACK_IDS,
  KNOWN_RULE_IDS,
  PROFILE_MODES,
} from './schema.mjs';

function validatePositiveInteger(value, label, errors, { min, max }) {
  if (value === undefined) return;
  if (!Number.isInteger(Number(value)) || Number(value) < min || Number(value) > max) {
    errors.push(`${label} must be an integer from ${min} to ${max}.`);
  }
}

function validateRuleSettings(rule, config, errors) {
  if (rule === 'file_size_advisory') {
    for (const key of Object.keys(DEFAULT_FILE_SIZE)) validatePositiveInteger(config[key], `rules.${rule}.${key}`, errors, { min: 1, max: 10000 });
  }
  if (rule === 'responsibility_budget') {
    for (const key of Object.keys(DEFAULT_RESPONSIBILITY_BUDGET)) validatePositiveInteger(config[key], `rules.${rule}.${key}`, errors, { min: 1, max: 10000 });
  }
  if (rule === 'single_responsibility_advisory') {
    for (const key of Object.keys(DEFAULT_SINGLE_RESPONSIBILITY)) validatePositiveInteger(config[key], `rules.${rule}.${key}`, errors, { min: 1, max: 10000 });
  }
}

function validateBaseline(profile, errors) {
  if (Object.prototype.hasOwnProperty.call(profile.baseline || {}, 'enabled') && typeof profile.baseline.enabled !== 'boolean') {
    errors.push('baseline.enabled must be true or false.');
  }
  for (const key of ['path', 'candidate_report']) {
    if (Object.prototype.hasOwnProperty.call(profile.baseline || {}, key) && typeof profile.baseline[key] !== 'string') {
      errors.push(`baseline.${key} must be a string path.`);
    }
  }
}

function validateGuard(profile, errors) {
  if (profile.guard?.default_scope && !['changed', 'staged', 'all', 'files-from'].includes(String(profile.guard.default_scope))) {
    errors.push(`guard.default_scope must be changed, staged, all, or files-from.`);
  }
  if (profile.guard?.default_format && !['text', 'json'].includes(String(profile.guard.default_format))) errors.push('guard.default_format must be text or json.');
  if (profile.guard?.fail_on && !['none', 'warning', 'error'].includes(String(profile.guard.fail_on))) errors.push('guard.fail_on must be none, warning, or error.');
}

function validateCommands(commands, errors) {
  for (const command of commands || []) {
    if (!command.name || typeof command.name !== 'string') errors.push('Each profile command needs a string name field.');
    const hasCmd = Object.prototype.hasOwnProperty.call(command, 'cmd');
    const hasRun = Object.prototype.hasOwnProperty.call(command, 'run');
    if (!hasCmd && !hasRun) errors.push(`Profile command ${command.name || 'unnamed'} needs cmd/args or legacy run.`);
    if (hasCmd && hasRun) errors.push(`Profile command ${command.name || 'unnamed'} must not combine cmd and run.`);
    if (hasCmd && (typeof command.cmd !== 'string' || !command.cmd.trim())) errors.push(`Profile command ${command.name || 'unnamed'} has invalid cmd; use a non-empty string.`);
    if (hasRun && (typeof command.run !== 'string' || !command.run.trim())) errors.push(`Profile command ${command.name || 'unnamed'} has invalid run; use a non-empty string.`);
    if (Object.prototype.hasOwnProperty.call(command, 'args') && (!Array.isArray(command.args) || command.args.some((item) => typeof item !== 'string'))) {
      errors.push(`Profile command ${command.name || 'unnamed'} args must be an inline string array.`);
    }
    if (command.severity && !['info', 'warning', 'error'].includes(command.severity)) errors.push(`Profile command ${command.name || 'unnamed'} has unsupported severity ${command.severity}.`);
    if (command.timeoutSeconds !== undefined && (!Number.isFinite(command.timeoutSeconds) || command.timeoutSeconds <= 0 || command.timeoutSeconds > 1800)) {
      errors.push(`Profile command ${command.name || 'unnamed'} has invalid timeout_seconds; use 1..1800.`);
    }
  }
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
    validateRuleSettings(rule, config, errors);
  }
  validateBaseline(profile, errors);
  validateGuard(profile, errors);
  validateCommands(profile.commands, errors);
  return errors;
}
