#!/usr/bin/env node
import os from 'node:os';
import path from 'node:path';
import { ask, parseArgs } from './shared.mjs';
import { installSkills, removeManagedSkills } from './install-actions/skills.mjs';
import { removeManagedGlobalBridge, writeManagedGlobalBridge } from './install-actions/bridge-writer.mjs';

// Agent-neutral global setup: one canonical skills dir + a marker-managed bridge in
// each agent's global instruction file. Advisory only — no per-repo files, no git hooks.
const AGENT_TARGETS = {
  claude: path.join(os.homedir(), '.claude', 'CLAUDE.md'),
  codex: path.join(os.homedir(), '.codex', 'AGENTS.md'),
  opencode: path.join(os.homedir(), '.config', 'opencode', 'AGENTS.md'),
};

function usage() {
  console.log(`jhste-skills global
Install jhste skills once at the user level for Codex and Claude Code. Advisory only.

Usage:
  jhste-skills global [--agents codex,claude,opencode] [--skill-set core|all] [--skills-dir <path>] [--force] [--yes]
  jhste-skills global --uninstall [--agents codex,claude,opencode] [--skills-dir <path>] [--keep-skills] [--yes]

Notes:
  Skills (and shared companion resources) are copied to --skills-dir (default ~/.jhste/skills).
  A marker-managed bridge block is written to each agent's global instruction file:
    claude -> ~/.claude/CLAUDE.md
    codex  -> ~/.codex/AGENTS.md
    opencode -> ~/.config/opencode/AGENTS.md
  Manifest-managed skills are refreshed automatically; --force also overwrites
  unmanaged differing directories after review.
  No git hooks and no per-repo files are written; guard stays advisory.
  Use --claude-file / --codex-file / --opencode-file to override a target path.
  --yes skips the confirmation prompt.
`);
}

function fail(message) {
  console.error(`jhste-skills global: ${message}`);
  process.exit(1);
}

function parseAgents(value, errors) {
  if (value === undefined) return ['codex', 'claude', 'opencode'];
  if (typeof value !== 'string') {
    errors.push('--agents requires a comma-separated value.');
    return ['codex', 'claude', 'opencode'];
  }
  const list = String(value).split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
  const unknown = list.filter((name) => !Object.prototype.hasOwnProperty.call(AGENT_TARGETS, name));
  if (unknown.length) errors.push(`--agents supports only codex,claude,opencode; unknown: ${unknown.join(', ')}`);
  return list.length ? [...new Set(list)] : ['codex', 'claude', 'opencode'];
}

function agentTargets(agents, args) {
  const overrides = { claude: args['claude-file'], codex: args['codex-file'], opencode: args['opencode-file'] };
  return agents.map((agent) => ({
    agent,
    file: typeof overrides[agent] === 'string' ? path.resolve(overrides[agent]) : AGENT_TARGETS[agent],
  }));
}

function readBoolean(args, key, errors) {
  if (!Object.prototype.hasOwnProperty.call(args, key)) return false;
  if (args[key] !== true) errors.push(`--${key} does not take a value.`);
  return args[key] === true;
}

function readString(args, key, errors) {
  if (!Object.prototype.hasOwnProperty.call(args, key)) return undefined;
  if (typeof args[key] !== 'string') {
    errors.push(`--${key} requires a value.`);
    return undefined;
  }
  return args[key];
}

async function confirmGlobalWrite(args, action, targets, skillsDir) {
  if (args.yes === true || args.y === true) return true;
  console.log(`jhste-skills global ${action}:`);
  console.log(`  skills: ${skillsDir}`);
  for (const { agent, file } of targets) console.log(`  ${agent}: ${file}`);
  if (!process.stdin.isTTY) {
    console.error(`Non-interactive global ${action} requires explicit --yes or -y; refusing to change files.`);
    process.exit(3);
  }
  const answer = await ask(`Continue global ${action}? [y/N] `);
  if (answer.toLowerCase() === 'y') return true;
  console.log(`Global ${action} cancelled. No changes made.`);
  return false;
}

async function main(argv) {
  const args = parseArgs(argv);
  if (args.help || args.h) return usage();
  const errors = [];
  const supported = new Set(['agents', 'skill-set', 'skills-dir', 'claude-file', 'codex-file', 'opencode-file', 'force', 'yes', 'y', 'uninstall', 'keep-skills', 'help', 'h', '_']);
  for (const key of Object.keys(args)) {
    if (!supported.has(key)) errors.push(`unknown option --${key}.`);
  }
  if (Array.isArray(args._) && args._.length) errors.push(`unexpected positional argument: ${args._[0]}`);

  const uninstall = readBoolean(args, 'uninstall', errors);
  const keepSkills = readBoolean(args, 'keep-skills', errors);
  const force = readBoolean(args, 'force', errors);
  readBoolean(args, 'yes', errors);
  readBoolean(args, 'y', errors);
  const skillSetRaw = readString(args, 'skill-set', errors);
  const skillSet = skillSetRaw ? skillSetRaw.toLowerCase() : 'all';
  if (!['core', 'all'].includes(skillSet)) errors.push('global --skill-set must be core or all because the global bridge requires core workflow skills.');
  const skillsDirInput = readString(args, 'skills-dir', errors);
  readString(args, 'claude-file', errors);
  readString(args, 'codex-file', errors);
  readString(args, 'opencode-file', errors);
  const skillsDir = path.resolve(skillsDirInput || path.join(os.homedir(), '.jhste', 'skills'));
  const agents = parseAgents(args.agents, errors);
  if (errors.length) return fail(errors.join('\n'));

  const targets = agentTargets(agents, args);
  if (!(await confirmGlobalWrite(args, uninstall ? 'uninstall' : 'install', targets, skillsDir))) return;

  if (uninstall) {
    console.log('jhste-skills global uninstall:');
    if (!keepSkills) {
      const result = removeManagedSkills(skillsDir);
      const removed = result.skills?.filter((item) => item.status === 'removed').length ?? 0;
      console.log(`  skills: ${result.status}${result.status === 'removed-managed' ? ` (${removed} removed from ${skillsDir})` : ''}`);
      if (result.status === 'invalid-manifest') {
        console.log(`  blocked: ${result.reason || result.status} (${result.path})`);
        console.log('  bridges: skipped because skills uninstall did not complete');
        process.exitCode = 3;
        return;
      }
    } else {
      console.log(`  skills: kept (${skillsDir})`);
    }
    for (const { agent, file } of targets) {
      const result = removeManagedGlobalBridge(file);
      console.log(`  ${agent}: ${result.status} (${file})`);
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
  if (blocked.length) {
    for (const item of blocked) {
      console.log(`  blocked: ${item.reason || item.status} (${item.destination || item.source})`);
    }
    console.log('  bridges: skipped because skills install did not complete');
    process.exitCode = 3;
    return;
  }
  for (const { agent, file } of targets) {
    const result = writeManagedGlobalBridge(file);
    console.log(`  ${agent}: ${result.status} (${file})`);
  }
  console.log('\nAdvisory only: no git hooks and no per-repo files were written.');
  console.log('Run guard manually anytime: jhste-skills guard --scope changed');
}

main(process.argv.slice(2));
