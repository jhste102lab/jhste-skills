#!/usr/bin/env node
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from './shared.mjs';
import { installSkills, removeManagedSkills } from './install-actions/skills.mjs';
import { removeManagedGlobalBridge, writeManagedGlobalBridge } from './install-actions/bridge-writer.mjs';

// Agent-neutral global setup: one canonical skills dir + a marker-managed bridge in
// each agent's global instruction file. Advisory only — no per-repo files, no git hooks.
const AGENT_TARGETS = {
  claude: path.join(os.homedir(), '.claude', 'CLAUDE.md'),
  codex: path.join(os.homedir(), '.codex', 'AGENTS.md'),
};

function usage() {
  console.log(`jhste-skills global
Install jhste skills once at the user level for Codex and Claude Code. Advisory only.

Usage:
  jhste-skills global [--agents codex,claude] [--skill-set core|vendor|all] [--skills-dir <path>] [--force] [--yes]
  jhste-skills global --uninstall [--agents codex,claude] [--skills-dir <path>] [--keep-skills]

Notes:
  Skills (and shared companion resources) are copied to --skills-dir (default ~/.jhste/skills).
  A marker-managed bridge block is written to each agent's global instruction file:
    claude -> ~/.claude/CLAUDE.md
    codex  -> ~/.codex/AGENTS.md
  Manifest-managed skills are refreshed automatically; --force also overwrites
  unmanaged differing directories after review.
  No git hooks and no per-repo files are written; guard stays advisory.
  Use --claude-file / --codex-file to override a target path.
`);
}

function fail(message) {
  console.error(`jhste-skills global: ${message}`);
  process.exit(1);
}

function parseAgents(value, errors) {
  if (value === undefined) return ['codex', 'claude'];
  const list = String(value).split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
  const unknown = list.filter((name) => !Object.prototype.hasOwnProperty.call(AGENT_TARGETS, name));
  if (unknown.length) errors.push(`--agents supports only codex,claude; unknown: ${unknown.join(', ')}`);
  return list.length ? [...new Set(list)] : ['codex', 'claude'];
}

function agentTargets(agents, args) {
  const overrides = { claude: args['claude-file'], codex: args['codex-file'] };
  return agents.map((agent) => ({
    agent,
    file: typeof overrides[agent] === 'string' ? path.resolve(overrides[agent]) : AGENT_TARGETS[agent],
  }));
}

function run(argv) {
  const args = parseArgs(argv);
  if (args.help || args.h) return usage();
  const errors = [];
  const supported = new Set(['agents', 'skill-set', 'skills-dir', 'claude-file', 'codex-file', 'force', 'yes', 'y', 'uninstall', 'keep-skills', 'help', 'h', '_']);
  for (const key of Object.keys(args)) {
    if (!supported.has(key)) errors.push(`unknown option --${key}.`);
  }
  if (Array.isArray(args._) && args._.length) errors.push(`unexpected positional argument: ${args._[0]}`);

  const uninstall = args.uninstall === true;
  const keepSkills = args['keep-skills'] === true;
  const force = args.force === true;
  const skillSet = args['skill-set'] ? String(args['skill-set']).toLowerCase() : 'all';
  if (!['core', 'vendor', 'all'].includes(skillSet)) errors.push('--skill-set must be core, vendor, or all.');
  const skillsDir = path.resolve(typeof args['skills-dir'] === 'string' ? args['skills-dir'] : path.join(os.homedir(), '.jhste', 'skills'));
  const agents = parseAgents(args.agents, errors);
  if (errors.length) return fail(errors.join('\n'));

  const targets = agentTargets(agents, args);

  if (uninstall) {
    console.log('jhste-skills global uninstall:');
    for (const { agent, file } of targets) {
      const result = removeManagedGlobalBridge(file);
      console.log(`  ${agent}: ${result.status} (${file})`);
    }
    if (keepSkills) {
      console.log(`  skills: kept (${skillsDir})`);
    } else {
      const result = removeManagedSkills(skillsDir);
      const removed = result.skills?.filter((item) => item.status === 'removed').length ?? 0;
      console.log(`  skills: ${result.status}${result.status === 'removed-managed' ? ` (${removed} removed from ${skillsDir})` : ''}`);
    }
    return;
  }

  // `global` owns the canonical skills dir, so it refreshes manifest-managed skills
  // automatically (idempotent: unchanged when identical) and adopts known jhste skills,
  // while still protecting unmanaged differing directories unless --force is given.
  const skillResults = installSkills(skillsDir, { force: true, adoptKnownSkills: true, allowUnmanagedOverwrite: force, skillSet });
  const blocked = skillResults.filter((item) => ['skipped-unmanaged-different', 'invalid-manifest'].includes(item.status));
  const copied = skillResults.filter((item) => ['created', 'overwritten-managed', 'adopted-managed', 'unchanged'].includes(item.status)).length;

  console.log('jhste-skills global install:');
  console.log(`  skills: ${copied} managed under ${skillsDir}${blocked.length ? ` (${blocked.length} skipped; rerun with --force after review)` : ''}`);
  for (const { agent, file } of targets) {
    const result = writeManagedGlobalBridge(file);
    console.log(`  ${agent}: ${result.status} (${file})`);
  }
  console.log('\nAdvisory only: no git hooks and no per-repo files were written.');
  console.log('Run guard manually anytime: jhste-skills guard --scope changed');
  if (blocked.length) process.exitCode = 3;
}

run(process.argv.slice(2));
