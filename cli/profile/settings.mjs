import {
  DEFAULT_FILE_SIZE,
  DEFAULT_PROFILE_MODE,
  DEFAULT_RESPONSIBILITY_BUDGET,
  DEFAULT_SINGLE_RESPONSIBILITY,
} from './schema.mjs';

function numberSetting(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

export function effectiveRuleMode(profile, { family, pack } = {}) {
  let mode = profile?.mode || DEFAULT_PROFILE_MODE;
  if (pack && profile?.packs?.[pack]?.mode) mode = String(profile.packs[pack].mode);
  if (family && profile?.rules?.[family]?.mode) mode = String(profile.rules[family].mode);
  return mode;
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

export function singleResponsibilitySettings(profile) {
  const rule = profile?.rules?.single_responsibility_advisory || {};
  return {
    function_review_lines: numberSetting(rule.function_review_lines, DEFAULT_SINGLE_RESPONSIBILITY.function_review_lines),
    mixed_responsibility_hints: numberSetting(rule.mixed_responsibility_hints, DEFAULT_SINGLE_RESPONSIBILITY.mixed_responsibility_hints),
    module_export_family_hints: numberSetting(rule.module_export_family_hints, DEFAULT_SINGLE_RESPONSIBILITY.module_export_family_hints),
  };
}
