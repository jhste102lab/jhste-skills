import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { parseJsonText, validateJsonObject } from '../../cli/json-file.mjs';

export function fail(message) {
  console.error(`smoke-test failed: ${message}`);
  process.exit(1);
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    fail(`${command} ${args.join(' ')} exited ${result.status}`);
  }
  return result;
}

export function runAny(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', ...options });
}

export function parseJsonOutput(text, description) {
  try {
    return parseJsonText(text, { description, validate: validateJsonObject });
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
  return null;
}

export function hashFile(file) {
  return fs.existsSync(file) ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null;
}

export function skillDirs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function assertNoInstallSideEffects({ repo, skillsDir, agentsBefore, label }) {
  if (fs.existsSync(path.join(repo, '.jhste'))) fail(`${label} created .jhste`);
  if (fs.existsSync(skillsDir)) fail(`${label} touched skills directory`);
  if (fs.readFileSync(path.join(repo, 'AGENTS.md'), 'utf8') !== agentsBefore) fail(`${label} modified AGENTS.md`);
  if (fs.existsSync(path.join(repo, '.git', 'hooks', 'pre-commit'))) fail(`${label} created pre-commit hook`);
}
