import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';

export const KIT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const BRIDGE_BLOCK = `## Agent skills
This repo uses jhste skills as shared guidance.
Repo-local instructions in this file remain authoritative.
See \`.jhste/profile.yaml\` for local skill preferences.
Before non-trivial code changes, use the \`jhste-engineering-judgment\` skill to check scope, seams, failure paths, and assumptions.
After code changes, run \`jhste-skills guard --scope changed --format text --fail-on error\` when available.
Report guard warnings/errors; do not treat guard runtime/config failures as validation success.
Before declaring non-trivial code work complete, use the \`jhste-final-review\` skill.
Skip final review for docs-only, comment-only, formatting-only, or trivial rename-only changes.
Do not enter an unbounded fix/review loop; stop after at most two fix + re-review cycles and report remaining risks.`;

export const DEFAULT_PROFILE = `version: 1
mode: advisory
installed_at: "<installed_at>"
adapters:
  codex: auto
  claude: auto
packs:
  core:
    mode: advisory
  web:
    mode: advisory
  api:
    mode: advisory
  database:
    mode: advisory
  crawler:
    mode: advisory
rules:
  file_size_advisory:
    mode: advisory
    source_file_warning_lines: 400
    source_file_review_lines: 600
  responsibility_budget:
    mode: advisory
    next_page_review_lines: 200
    client_module_review_lines: 200
    route_review_lines: 250
    import_ops_script_review_lines: 280
    python_orchestrator_review_lines: 600
  no_silent_failure:
    mode: advisory
  no_secret_logging:
    mode: advisory
  workflow_security:
    mode: advisory
  external_input_validation:
    mode: advisory
  side_effect_boundary:
    mode: advisory
  null_state_safety:
    mode: advisory
  authz_data_isolation:
    mode: advisory
  build_runtime_env_safety:
    mode: advisory
  write_safety_idempotency:
    mode: advisory
  api_contract_compatibility:
    mode: advisory
  performance_duplicate_fetch:
    mode: advisory
  public_safe_error:
    mode: advisory
  sql_parameter_binding:
    mode: advisory
  db_row_validation:
    mode: advisory
  thin_api_route:
    mode: advisory
  component_responsibility:
    mode: advisory
  type_escape_advisory:
    mode: advisory
  broad_exception_advisory:
    mode: advisory
  crawler_producer_boundary:
    mode: advisory
baseline:
  enabled: false
  path: .jhste/baseline.json
guard:
  default_scope: changed
  default_format: text
  fail_on: none
  exit_codes:
    pass: 0
    violation_failure: 1
    guard_runtime_failure: 2
    config_failure: 3
deep_scan:
  last_run: null
  report: .jhste/deep-scan-report.md
  recommended_profile: .jhste/profile.recommended.yaml
workflow:
  final_review:
    auto_for_non_trivial_code_changes: true
    skip_when:
      - docs_only
      - comment_only
      - formatting_only
      - trivial_rename_only
    max_fix_review_cycles: 2
`;

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--') {
      args._.push(...argv.slice(i + 1));
      break;
    }
    if (!value.startsWith('-')) {
      args._.push(value);
      continue;
    }
    if (value.startsWith('--')) {
      const [key, inline] = value.slice(2).split('=', 2);
      if (inline !== undefined) {
        args[key] = inline;
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
        args[key] = argv[i + 1];
        i += 1;
      } else {
        args[key] = true;
      }
      continue;
    }
    if (value === '-y') {
      args.yes = true;
    } else {
      args[value.slice(1)] = true;
    }
  }
  return args;
}

export function nowIso() {
  return new Date().toISOString();
}

export function findGitRoot(startPath) {
  const resolved = path.resolve(startPath || process.cwd());
  try {
    const out = execFileSync('git', ['-C', resolved, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out || resolved;
  } catch {
    return resolved;
  }
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

export function writeFileIfChanged(file, content) {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) {
    return false;
  }
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content);
  return true;
}

export function listDirectories(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function directoryDigest(dir) {
  const hash = crypto.createHash('sha256');
  if (!fs.existsSync(dir)) return null;
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(current, entry.name);
      const rel = path.relative(dir, full).replaceAll(path.sep, '/');
      if (entry.isDirectory()) {
        hash.update(`dir:${rel}\n`);
        walk(full);
      } else if (entry.isFile()) {
        hash.update(`file:${rel}\n`);
        hash.update(fs.readFileSync(full));
        hash.update('\n');
      }
    }
  };
  walk(dir);
  return hash.digest('hex');
}

export function copyDirSafe(source, destination, { force = false } = {}) {
  if (!fs.existsSync(source)) {
    return { status: 'missing-source', source, destination };
  }
  if (!fs.existsSync(destination)) {
    ensureDir(path.dirname(destination));
    fs.cpSync(source, destination, { recursive: true });
    return { status: 'created', source, destination };
  }
  const sourceHash = directoryDigest(source);
  const destinationHash = directoryDigest(destination);
  if (sourceHash === destinationHash) {
    return { status: 'unchanged', source, destination };
  }
  if (!force) {
    return { status: 'skipped-existing-different', source, destination };
  }
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(source, destination, { recursive: true });
  return { status: 'overwritten', source, destination };
}

export async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

export function atomicWrite(file, content) {
  ensureDir(path.dirname(file));
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

export function relativeDisplay(root, file) {
  return path.relative(root, file).replaceAll(path.sep, '/') || '.';
}
