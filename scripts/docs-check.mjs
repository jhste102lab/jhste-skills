#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'README.md',
  'LICENSE',
  'package.json',
  'skills/setup/SKILL.md',
  'skills/jhste-code-quality/SKILL.md',
  'skills/jhste-architecture-review/SKILL.md',
  'skills/jhste-db-api-boundary/SKILL.md',
  'skills/jhste-crawler-automation/SKILL.md',
  'rules/core/no_silent_failure.yaml',
  'rules/core/no_secret_logging.yaml',
  'rules/core/file_size_advisory.yaml',
  'rules/core/responsibility_budget.yaml',
  'rules/database/sql_parameter_binding.yaml',
  'rules/crawler/crawler_producer_boundary.yaml',
  'packs/core.yaml',
  'packs/web.yaml',
  'packs/api.yaml',
  'packs/database.yaml',
  'packs/crawler.yaml',
  'adapters/codex/README.md',
  'adapters/claude/README.md',
  'adapters/generic/README.md',
  'cli/install.mjs',
  'cli/deep-scan.mjs',
  'cli/guard.mjs',
  'cli/hooks.mjs',
  'cli/tune.mjs',
  'cli/baseline.mjs',
  'vendor/matt-pocock/allowlist.json',
  'vendor/matt-pocock/source-lock.json',
  'examples/profile.yaml',
  'docs/ACCEPTANCE_CHECK.md',
  'docs/PUBLIC_SAFETY.md',
];

function fail(message) {
  console.error(`docs-check failed: ${message}`);
  process.exit(1);
}

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`);
}

const profile = fs.readFileSync(path.join(root, 'examples/profile.yaml'), 'utf8');
if (!/^mode: advisory$/m.test(profile)) fail('example profile must default to advisory');
if (/mode:\s*strict/.test(profile)) fail('example profile must not enable strict');

const bridgeText = 'Repo-local instructions in this file remain authoritative.';
for (const rel of ['adapters/codex/README.md', 'docs/CONFLICT_RESOLUTION.md', 'cli/shared.mjs']) {
  if (!fs.readFileSync(path.join(root, rel), 'utf8').includes(bridgeText)) {
    fail(`${rel} must include authoritative repo-local bridge wording`);
  }
}

const install = fs.readFileSync(path.join(root, 'cli/install.mjs'), 'utf8');
for (const forbidden of ['.github/workflows', '.git/hooks', 'package-lock.json', 'pnpm-lock.yaml']) {
  if (install.includes(forbidden)) fail(`installer should not target ${forbidden}`);
}
if (/writeFileSync\([^\n]+package\.json/.test(install)) fail('installer must not write target package.json');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const script of ['public-safety:check', 'vendor:check', 'docs:check', 'smoke:test']) {
  if (!pkg.scripts?.[script]) fail(`package script missing: ${script}`);
}

console.log('docs-check passed: required structure, advisory defaults, bridge wording, and scripts are present.');
