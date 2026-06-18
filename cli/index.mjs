#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cliDir = path.dirname(fileURLToPath(import.meta.url));
const [command, ...rest] = process.argv.slice(2);
const commands = new Set(['install', 'connect', 'deep-scan', 'guard', 'hooks', 'tune', 'baseline']);

if (!command || command === '--help' || command === '-h') {
  console.log(`jhste-skills

Usage:
  jhste-skills install [--mode minimal|normal|full|custom] [--yes] [--repo <path>]
  jhste-skills connect [--mode normal|full|custom] [--repo <path>]
  jhste-skills deep-scan [--repo <path>]
  jhste-skills guard [--repo <path>] [--scope changed|staged|all|files-from] [--format text|json]
  jhste-skills hooks install|uninstall|doctor [--repo <path>]
  jhste-skills tune [--repo <path>]
  jhste-skills baseline [--repo <path>]
`);
  process.exit(0);
}

if (!commands.has(command)) {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

const script = path.join(cliDir, `${command}.mjs`);
const result = spawnSync(process.execPath, [script, ...rest], { stdio: 'inherit' });
process.exit(result.status ?? 1);
