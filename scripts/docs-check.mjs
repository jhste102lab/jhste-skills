#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'AGENTS.md',
  'README.md',
  'LICENSE',
  'package.json',
  'skills/setup/SKILL.md',
  'skills/jhste-engineering-judgment/SKILL.md',
  'skills/jhste-engineering-judgment/references/structure-templates.md',
  'skills/jhste-code-quality/SKILL.md',
  'skills/jhste-architecture-review/SKILL.md',
  'skills/jhste-db-api-boundary/SKILL.md',
  'skills/jhste-crawler-automation/SKILL.md',
  'skills/jhste-final-review/SKILL.md',
  'skills/jhste-final-review/references/final-review.md',
  'rules/core/no_silent_failure.yaml',
  'rules/core/no_secret_logging.yaml',
  'rules/core/workflow_security.yaml',
  'rules/core/file_size_advisory.yaml',
  'rules/core/responsibility_budget.yaml',
  'rules/core/null_state_safety.yaml',
  'rules/core/authz_data_isolation.yaml',
  'rules/core/build_runtime_env_safety.yaml',
  'rules/core/write_safety_idempotency.yaml',
  'rules/core/api_contract_compatibility.yaml',
  'rules/core/performance_duplicate_fetch.yaml',
  'rules/core/public_safe_error.yaml',
  'rules/database/sql_parameter_binding.yaml',
  'rules/database/db_row_validation.yaml',
  'rules/crawler/crawler_producer_boundary.yaml',
  'packs/core.yaml',
  'packs/web.yaml',
  'packs/api.yaml',
  'packs/database.yaml',
  'packs/crawler.yaml',
  'adapters/codex/README.md',
  'adapters/claude/README.md',
  'adapters/generic/README.md',
  'cli/profile.mjs',
  'cli/install.mjs',
  'cli/install-flow.mjs',
  'cli/install-actions.mjs',
  'cli/connect.mjs',
  'cli/deep-scan.mjs',
  'cli/guard.mjs',
  'cli/guard/registry.mjs',
  'cli/guard/scanners/external-input.mjs',
  'cli/hooks.mjs',
  'cli/hook-utils.mjs',
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

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function safeParse(rel) {
  let parsed;
  try {
    parsed = JSON.parse(read(rel));
  } catch (error) {
    fail(`${rel} must be valid JSON: ${error.message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) fail(`${rel} must contain a JSON object`);
  return parsed;
}

function walk(dir, predicate, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, predicate, out);
    } else if (entry.isFile() && predicate(full)) {
      out.push(full);
    }
  }
  return out;
}

function relPath(full) {
  return path.relative(root, full).replaceAll(path.sep, '/');
}

function yamlField(text, field) {
  return new RegExp(`^${field}:\\s*(.+?)\\s*$`, 'm').exec(text)?.[1]?.replace(/^['"]|['"]$/g, '') || '';
}

function indentedBlock(text, field) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^${field}:\\s*$`).test(line));
  if (start === -1) return '';
  const block = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break;
    block.push(line);
  }
  return `${block.join('\n')}\n`;
}

function yamlList(text, field) {
  return [...indentedBlock(text, field).matchAll(/^\s*-\s*(.+?)\s*$/gm)].map((item) => item[1].replace(/^['"]|['"]$/g, ''));
}

function implementationStatus(text) {
  return /^implementation:\n(?:[\s\S]*?)^\s{4}status:\s*(\S+)/m.exec(text)?.[1] || '';
}

function implementationScanner(text) {
  return /^implementation:\n(?:[\s\S]*?)^\s{4}scanner:\s*(\S+)/m.exec(text)?.[1] || '';
}

function implementationFindings(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => /^\s{4}finding_ids:\s*$/.test(line));
  if (start === -1) return [];
  const findings = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\s{0,4}\S/.test(line)) break;
    const match = /^\s*-\s*(.+?)\s*$/.exec(line);
    if (match) findings.push(match[1]);
  }
  return findings;
}

function sectionRefsFromSkill(skillText) {
  const refs = [];
  const searchable = skillText.replace(/```[\s\S]*?```/g, '');
  const section = /^## References\s*\n([\s\S]*?)(?=^##\s|$)/m.exec(searchable)?.[1] || '';
  for (const match of section.matchAll(/^\s*-\s*`([^`]+)`/gm)) refs.push(match[1]);
  for (const match of searchable.matchAll(/\[[^\]]+\]\(([^)]+\.md)\)/g)) {
    const target = match[1];
    if (!/^https?:/.test(target)) refs.push(target);
  }
  return [...new Set(refs)];
}

function isContainedIn(child, parent) {
  const relative = path.relative(parent, child);
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`);
}

const ruleFiles = walk(path.join(root, 'rules'), (file) => file.endsWith('.yaml')).map(relPath).sort();
const ruleById = new Map();
const rulePathById = new Map();
for (const rel of ruleFiles) {
  const text = read(rel);
  const id = yamlField(text, 'id');
  const pack = yamlField(text, 'pack');
  const status = implementationStatus(text);
  const scanner = implementationScanner(text);
  const findings = implementationFindings(text);
  if (!id) fail(`${rel} missing id`);
  if (ruleById.has(id)) fail(`duplicate rule id ${id} in ${rel} and ${rulePathById.get(id)}`);
  if (!pack) fail(`${rel} missing pack`);
  if (!status) fail(`${rel} missing implementation.guard.status`);
  if (!['builtin', 'metadata_only', 'deep_scan_only', 'profile_command'].includes(status)) fail(`${rel} has unsupported implementation.guard.status ${status}`);
  if (status === 'builtin' && findings.length === 0) fail(`${rel} builtin implementation needs finding_ids`);
  if (status === 'builtin' && !scanner) fail(`${rel} builtin implementation needs scanner`);
  ruleById.set(id, { rel, pack, status, scanner, findings });
  rulePathById.set(id, rel);
}

const packFiles = walk(path.join(root, 'packs'), (file) => file.endsWith('.yaml')).map(relPath).sort();
const packIds = new Set();
const packRulesByPack = new Map();
const includedRulePaths = new Set();
for (const rel of packFiles) {
  const text = read(rel);
  const id = yamlField(text, 'id');
  if (!id) fail(`${rel} missing id`);
  if (packIds.has(id)) fail(`duplicate pack id ${id}`);
  packIds.add(id);
  const rules = yamlList(text, 'rules');
  if (!rules.length) fail(`${rel} must reference at least one rule`);
  packRulesByPack.set(id, new Set(rules));
  for (const rulePath of rules) {
    if (!fs.existsSync(path.join(root, rulePath))) fail(`${rel} references missing rule ${rulePath}`);
    includedRulePaths.add(rulePath);
  }
}

for (const [id, meta] of ruleById.entries()) {
  if (!packIds.has(meta.pack)) fail(`${meta.rel} references unknown pack ${meta.pack}`);
  if (!packRulesByPack.get(meta.pack)?.has(meta.rel)) fail(`${meta.rel} declares pack ${meta.pack} but is not included in packs/${meta.pack}.yaml`);
}

for (const rel of ruleFiles) {
  if (!includedRulePaths.has(rel)) fail(`${rel} is not included in any pack`);
}

for (const skillPath of walk(path.join(root, 'skills'), (file) => path.basename(file) === 'SKILL.md')) {
  const rel = relPath(skillPath);
  const baseDir = path.dirname(skillPath);
  for (const ref of sectionRefsFromSkill(fs.readFileSync(skillPath, 'utf8'))) {
    const cleanRef = ref.split('#')[0];
    if (!cleanRef || /^https?:/.test(cleanRef)) continue;
    const resolved = path.resolve(baseDir, cleanRef);
    if (!isContainedIn(resolved, path.join(root, 'skills')) && !isContainedIn(resolved, path.join(root, 'rules'))) fail(`${rel} reference escapes allowed roots: ${ref}`);
    if (!fs.existsSync(resolved)) fail(`${rel} references missing path ${ref}`);
    const referencedRule = relPath(resolved);
    if (referencedRule.startsWith('rules/') && !includedRulePaths.has(referencedRule)) fail(`${rel} references rule not included in a pack: ${ref}`);
  }
}

const profile = read('examples/profile.yaml');
if (!/^mode: advisory$/m.test(profile)) fail('example profile must default to advisory');
if (/mode:\s*strict/.test(profile)) fail('example profile must not enable strict');
const profileRuleSection = indentedBlock(profile, 'rules');
for (const match of profileRuleSection.matchAll(/^\s{2}([A-Za-z0-9_.-]+):\s*$/gm)) {
  if (!ruleById.has(match[1])) fail(`example profile references unknown rule ${match[1]}`);
}

const guardText = `${read('cli/guard.mjs')}\n${read('cli/guard/registry.mjs')}`;
const guardFindingById = new Map();
for (const match of guardText.matchAll(/^\s*'([^']+)':\s*\{\s*family:\s*'([^']+)'\s*,\s*pack:\s*'[^']+'\s*,\s*scanner:\s*'([^']+)'/gm)) {
  const finding = match[1];
  const family = match[2];
  const scanner = match[3];
  const rule = ruleById.get(family);
  if (guardFindingById.has(finding)) fail(`guard metadata has duplicate finding id ${finding}`);
  guardFindingById.set(finding, { family, scanner });
  if (!rule) fail(`guard scanner family missing rule metadata: ${family}`);
  if (rule.status === 'metadata_only') fail(`guard scanner family ${family} points to metadata_only rule`);
  if (!rule.findings.includes(finding)) fail(`guard finding ${finding} is missing from ${rule.rel} implementation finding_ids`);
  if (rule.scanner && scanner !== rule.scanner) fail(`guard finding ${finding} uses scanner ${scanner}, expected ${rule.scanner} from ${rule.rel}`);
}

for (const [ruleId, rule] of ruleById.entries()) {
  if (rule.status !== 'builtin') continue;
  for (const finding of rule.findings) {
    const guard = guardFindingById.get(finding);
    if (!guard) fail(`${rule.rel} builtin finding ${finding} is missing from guard metadata`);
    if (guard.family !== ruleId) fail(`guard finding ${finding} maps to ${guard.family}, expected ${ruleId}`);
    if (guard.scanner !== rule.scanner) fail(`guard finding ${finding} scanner ${guard.scanner} does not match ${rule.rel} scanner ${rule.scanner}`);
  }
}

const bridgeText = 'Repo-local instructions in this file remain authoritative.';
for (const rel of ['adapters/codex/README.md', 'docs/CONFLICT_RESOLUTION.md', 'cli/shared.mjs']) {
  const text = read(rel);
  if (!text.includes(bridgeText)) {
    fail(`${rel} must include authoritative repo-local bridge wording`);
  }
  for (const requiredText of ['jhste-engineering-judgment', 'jhste-final-review']) {
    if (!text.includes(requiredText)) fail(`${rel} must mention ${requiredText} in shared workflow guidance`);
  }
}

const rootAgents = read('AGENTS.md');
for (const requiredText of ['jhste-engineering-judgment', 'jhste-final-review', 'guard --scope changed --format text --fail-on error', 'at most two fix + re-review cycles']) {
  if (!rootAgents.includes(requiredText)) fail(`AGENTS.md must mention ${requiredText}`);
}

const issueCandidateDocs = {
  'skills/jhste-engineering-judgment/SKILL.md': read('skills/jhste-engineering-judgment/SKILL.md'),
  'skills/jhste-final-review/SKILL.md': read('skills/jhste-final-review/SKILL.md'),
  'skills/jhste-final-review/references/final-review.md': read('skills/jhste-final-review/references/final-review.md'),
};
for (const [rel, text] of Object.entries(issueCandidateDocs)) {
  for (const requiredText of ['Issue candidate', 'explicit approval', 'heuristic', 'secret']) {
    if (!text.toLowerCase().includes(requiredText.toLowerCase())) fail(`${rel} must document issue-candidate ${requiredText} handling`);
  }
}

const install = read('cli/install.mjs');
for (const forbidden of ['.github/workflows', '.git/hooks', 'package-lock.json', 'pnpm-lock.yaml']) {
  if (install.includes(forbidden)) fail(`installer should not target ${forbidden}`);
}
if (/writeFileSync\([^\n]+package\.json/.test(install)) fail('installer must not write target package.json');

const pkg = safeParse('package.json');
for (const script of ['public-safety:check', 'vendor:check', 'docs:check', 'guard-fixtures:test', 'smoke:test']) {
  if (!pkg.scripts?.[script]) fail(`package script missing: ${script}`);
}

console.log('docs-check passed: structure, profile/rule references, guard metadata links, bridge wording, issue-candidate protocol, and scripts are valid.');
