#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`smoke-test failed: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    fail(`${command} ${args.join(' ')} exited ${result.status}`);
  }
  return result;
}

function hashFile(file) {
  return fs.existsSync(file) ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null;
}

function hashDir(dir) {
  const hash = crypto.createHash('sha256');
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(current, entry.name);
      const rel = path.relative(dir, full).replaceAll(path.sep, '/');
      if (entry.isDirectory()) {
        hash.update(`dir:${rel}\n`);
        walk(full);
      } else if (entry.isFile()) {
        hash.update(`file:${rel}\n`);
        hash.update(fs.readFileSync(full));
      }
    }
  }
  if (fs.existsSync(dir)) walk(dir);
  return hash.digest('hex');
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jhste-skills-smoke-'));
const repo = path.join(tmp, 'repo');
const skillsDir = path.join(tmp, 'home-skills');
fs.mkdirSync(repo, { recursive: true });
run('git', ['init'], { cwd: repo });
fs.writeFileSync(path.join(repo, 'AGENTS.md'), '# Repo instructions\n\nLocal guidance wins.\n');
fs.writeFileSync(path.join(repo, 'package.json'), '{"name":"smoke-target","scripts":{"test":"echo ok"}}\n');
fs.writeFileSync(path.join(repo, 'package-lock.json'), '{"lockfileVersion":3}\n');
fs.mkdirSync(path.join(repo, 'src'), { recursive: true });
fs.mkdirSync(path.join(repo, 'src', 'app', 'dashboard'), { recursive: true });
fs.writeFileSync(path.join(repo, 'src', 'route.ts'), `export async function GET() {\n  try {\n    return Response.json({ ok: true });\n  } catch {}\n}\n`);
fs.writeFileSync(
  path.join(repo, 'src', 'app', 'dashboard', 'page.tsx'),
  `export default function Page() {\n  return <main>dashboard</main>;\n}\n${Array.from({ length: 205 }, (_, index) => `// page shell line ${index + 1}`).join('\n')}\n`,
);

const packageHashBefore = hashFile(path.join(repo, 'package.json'));
const lockHashBefore = hashFile(path.join(repo, 'package-lock.json'));
const hooksHashBefore = hashDir(path.join(repo, '.git', 'hooks'));
const started = Date.now();
run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', repo, '--skills-dir', skillsDir, '--skip-deep-scan'], { cwd: repo });
const elapsed = Date.now() - started;
if (elapsed > 30000) fail(`install exceeded 30 seconds: ${elapsed}ms`);

const profilePath = path.join(repo, '.jhste', 'profile.yaml');
if (!fs.existsSync(profilePath)) fail('profile was not created');
const profile = fs.readFileSync(profilePath, 'utf8');
if (!/^mode: advisory$/m.test(profile)) fail('profile default mode is not advisory');
if (/mode:\s*strict/.test(profile)) fail('profile enabled strict mode');
if (hashFile(path.join(repo, 'package.json')) !== packageHashBefore) fail('install modified target package.json');
if (hashFile(path.join(repo, 'package-lock.json')) !== lockHashBefore) fail('install modified target lockfile');
if (hashDir(path.join(repo, '.git', 'hooks')) !== hooksHashBefore) fail('install modified git hooks');

const agentsAfterFirst = fs.readFileSync(path.join(repo, 'AGENTS.md'), 'utf8');
const bridgeCount = (agentsAfterFirst.match(/Repo-local instructions in this file remain authoritative\./g) || []).length;
if (bridgeCount !== 1) fail('bridge block was not inserted exactly once');

fs.appendFileSync(profilePath, '# keep-existing-profile-marker\n');
run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', repo, '--skills-dir', skillsDir, '--skip-deep-scan'], { cwd: repo });
const agentsAfterSecond = fs.readFileSync(path.join(repo, 'AGENTS.md'), 'utf8');
const bridgeCountSecond = (agentsAfterSecond.match(/Repo-local instructions in this file remain authoritative\./g) || []).length;
if (bridgeCountSecond !== 1) fail('bridge block is not idempotent');
if (!fs.readFileSync(profilePath, 'utf8').includes('keep-existing-profile-marker')) fail('existing profile was overwritten without force');

const sourceHashBeforeScan = hashFile(path.join(repo, 'src', 'route.ts'));
run(process.execPath, [path.join(root, 'cli/deep-scan.mjs'), '--repo', repo], { cwd: repo });
if (hashFile(path.join(repo, 'src', 'route.ts')) !== sourceHashBeforeScan) fail('deep scan modified source code');
if (hashFile(path.join(repo, 'package.json')) !== packageHashBefore) fail('deep scan modified target package.json');
if (!fs.existsSync(path.join(repo, '.jhste', 'deep-scan-report.md'))) fail('deep scan report missing');
if (!fs.existsSync(path.join(repo, '.jhste', 'profile.recommended.yaml'))) fail('recommended profile missing');
const report = fs.readFileSync(path.join(repo, '.jhste', 'deep-scan-report.md'), 'utf8');
if (!report.includes('Existing responsibility budget candidates')) fail('responsibility budget report section missing');
if (!report.includes('src/app/dashboard/page.tsx:1')) fail('Next page responsibility budget candidate missing');
const recommended = fs.readFileSync(path.join(repo, '.jhste', 'profile.recommended.yaml'), 'utf8');
if (/mode:\s*strict/.test(recommended) || /enabled:\s*true/.test(recommended)) fail('recommended profile enabled strict mode');
if (!recommended.includes('responsibility_budget:')) fail('recommended profile missing responsibility budget rule');

console.log(`smoke-test passed in ${elapsed}ms: install safe defaults, bridge idempotency, overwrite protection, and deep scan read-only behavior verified.`);
