import { spawnSync } from 'node:child_process';
import { violation } from './scanners/index.mjs';

const DEFAULT_COMMAND_TIMEOUT_MS = 120000;
const PROFILE_OUTPUT_LIMIT = 4000;

function redactSecretLike(text) {
  return String(text || '')
    .replace(/sk-(?:proj-)?[A-Za-z0-9_-]{20,}/g, '[REDACTED_OPENAI_KEY]')
    .replace(/gh[pousr]_[A-Za-z0-9_]{20,}/g, '[REDACTED_GITHUB_TOKEN]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/gi, 'Bearer [REDACTED_TOKEN]')
    .replace(/\bAuthorization\s*:\s*(?:Bearer|Basic)\s+[^\r\n'"]+/gi, 'Authorization: [REDACTED_AUTHORIZATION]')
    .replace(/\bCookie\s*:\s*[^\r\n]+/gi, 'Cookie: [REDACTED_COOKIE]')
    .replace(/\b(password|secret|token|api[_-]?key|authorization|cookie|session)\s*[:=]\s*(['"]?)[^\s'"]{8,}\2/gi, '$1=[REDACTED_SECRET]');
}

function compactOutput(text) {
  const value = redactSecretLike(text).trim();
  if (value.length <= PROFILE_OUTPUT_LIMIT) return value;
  return `${value.slice(0, PROFILE_OUTPUT_LIMIT)}\n... truncated ${value.length - PROFILE_OUTPUT_LIMIT} chars`;
}

function safeCommandRuleId(name) {
  const slug = String(name || 'unnamed').toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '');
  return `profile.command.${slug || 'unnamed'}`;
}

export function runProfileCommands(repoRoot, commands) {
  const violations = [];
  const failures = [];
  for (const command of commands || []) {
    const result = spawnSync(command.run, [], {
      cwd: repoRoot,
      shell: true,
      encoding: 'utf8',
      timeout: command.timeoutSeconds ? command.timeoutSeconds * 1000 : DEFAULT_COMMAND_TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
    });
    if (result.error) {
      failures.push({
        code: 'profile.command.runtime',
        message: `Profile command could not run: ${command.name}`,
        details: [redactSecretLike(result.error.message), redactSecretLike(command.run)],
      });
      continue;
    }
    if (result.status !== 0) {
      const output = compactOutput([result.stdout, result.stderr].filter(Boolean).join('\n'));
      violations.push(violation({
        ruleId: safeCommandRuleId(command.name),
        severity: command.severity,
        relPath: '.jhste/profile.yaml',
        line: 1,
        symbol: command.name,
        message: `Profile command failed: ${command.name}`,
        source: 'profile',
        confidence: 'high',
      }));
      if (output) violations[violations.length - 1].details = [`exit=${result.status}`, output];
    }
  }
  return { violations, failures };
}

