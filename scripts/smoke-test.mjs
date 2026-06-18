#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPrimaryTarget } from './smoke/fixture.mjs';
import { runGuardAndHookScenarios } from './smoke/guard-and-hook-scenarios.mjs';
import { runInstallScenarios } from './smoke/install-scenarios.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jhste-skills-smoke-'));
const context = createPrimaryTarget({ root, tmp });

runInstallScenarios(context);
runGuardAndHookScenarios(context);

console.log(`smoke-test passed in ${context.elapsed}ms: install/connect modes, hook safety, bridge idempotency, overwrite protection, deep scan read-only behavior, and guard contract verified.`);
