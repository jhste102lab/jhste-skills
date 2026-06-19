#!/usr/bin/env node
import { runSyncCommand } from './sync-core.mjs';

runSyncCommand('update', process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
