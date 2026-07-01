#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { installSkills } from './install-actions/skills.mjs';
import { writeManagedGlobalBridge } from './install-actions/bridge-writer.mjs';
import { BRIDGE_END, BRIDGE_START } from './shared.mjs';

const AGENT_TARGETS = {
  claude: path.join(os.homedir(), '.claude', 'CLAUDE.md'),
  codex: path.join(os.homedir(), '.codex', 'AGENTS.md'),
  opencode: path.join(os.homedir(), '.config', 'opencode', 'AGENTS.md'),
};

function isGlobalNpmLifecycle() {
  return process.env.npm_config_global === 'true' || process.env.npm_config_location === 'global';
}

function hasManagedBridge(file) {
  if (!fs.existsSync(file)) return false;
  const text = fs.readFileSync(file, 'utf8');
  return text.includes(BRIDGE_START) && text.includes(BRIDGE_END);
}

function main() {
  if (!isGlobalNpmLifecycle()) return;
  const skillsDir = path.join(os.homedir(), '.jhste', 'skills');
  const manifestExists = fs.existsSync(path.join(skillsDir, '.jhste-skills-manifest.json'));
  const bridgeTargets = Object.entries(AGENT_TARGETS)
    .filter(([, file]) => hasManagedBridge(file))
    .map(([agent, file]) => ({ agent, file }));

  // Do not create a new global setup from an npm lifecycle hook. Only refresh a
  // global setup the user already opted into with `jhste-skills global`.
  if (!manifestExists && bridgeTargets.length === 0) return;

  const skillResults = installSkills(skillsDir, {
    force: true,
    adoptKnownSkills: true,
    allowUnmanagedOverwrite: false,
    skillSet: 'all',
  });
  const blocked = skillResults.filter((item) => ['skipped-unmanaged-different', 'invalid-manifest'].includes(item.status));
  if (blocked.length) {
    console.warn(`jhste-skills postinstall: global skill refresh skipped (${blocked.length} blocked); run jhste-skills global --force after review.`);
    return;
  }

  for (const { file } of bridgeTargets) writeManagedGlobalBridge(file);
  console.log(`jhste-skills postinstall: refreshed global skills${bridgeTargets.length ? ` and ${bridgeTargets.length} global bridge(s)` : ''}.`);
}

try {
  main();
} catch (error) {
  console.warn(`jhste-skills postinstall: global refresh skipped: ${error instanceof Error ? error.message : String(error)}`);
}
