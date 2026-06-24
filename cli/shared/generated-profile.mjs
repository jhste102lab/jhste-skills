import { DEFAULT_PROFILE } from './templates.mjs';

const FILE_SIZE_ADVISORY_BLOCK_PATTERN = /  file_size_advisory:\n    mode: advisory\n    source_file_warning_lines: \d+\n    source_file_review_lines: \d+\n/;
const FILE_SIZE_OFF_BLOCK_PATTERN = /  file_size_advisory:\n    mode: off\n/;

const LEGACY_GUARD_EXIT_CODES_BLOCK = `  exit_codes:
    pass: 0
    violation_failure: 1
    guard_runtime_failure: 2
    config_failure: 3
`;

function normalizeGeneratedProfileText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/^installed_at:.*$/m, 'installed_at: "<installed_at>"')
    .replace(FILE_SIZE_ADVISORY_BLOCK_PATTERN, '  file_size_advisory:\n    <line-limit-block>\n')
    .replace(FILE_SIZE_OFF_BLOCK_PATTERN, '  file_size_advisory:\n    <line-limit-block>\n')
    .replace(`\n${LEGACY_GUARD_EXIT_CODES_BLOCK}`, '\n')
    .trim();
}

export function generatedProfileShape(text) {
  return normalizeGeneratedProfileText(text) === normalizeGeneratedProfileText(DEFAULT_PROFILE);
}

export function classifyGeneratedProfile(text) {
  return generatedProfileShape(text) ? 'managed' : 'modified';
}
