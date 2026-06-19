import { ask } from '../shared.mjs';
import { DEFAULT_LINE_LIMIT, MODE_ALIASES } from './options.mjs';
import {
  applyLineLimitToHooks,
  defaultLineLimit,
  disabledLineLimit,
  hookActions,
} from './plan-helpers.mjs';

function parseLineLimitAnswer(value) {
  const normalized = String(value).trim();
  if (!normalized) return DEFAULT_LINE_LIMIT;
  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed >= 50 && parsed <= 5000 ? parsed : null;
}

function applyLineLimitOptions(plan, options) {
  if (options.noLineLimit || options.lineLimitMode === 'off') {
    plan.lineLimit = { enabled: false, maxLines: options.lineLimit, enforcement: 'off' };
    plan.overrides?.push(options.noLineLimit ? '--no-line-limit' : '--line-limit-mode off');
    return;
  }
  if (!plan.lineLimit) plan.lineLimit = defaultLineLimit();
  if (options.explicitLineLimit) {
    plan.lineLimit.maxLines = options.lineLimit;
    plan.overrides?.push(`--line-limit ${options.lineLimit}`);
  }
  if (options.lineLimitMode) {
    plan.lineLimit.enforcement = options.lineLimitMode;
    plan.overrides?.push(`--line-limit-mode ${options.lineLimitMode}`);
  }
  if (options.explicitLineLimit || options.explicitLineLimitMode) applyLineLimitToHooks(plan, options);
}

export async function askLineLimitPolicy(plan, options) {
  if (!plan.connectRepo || !plan.writeProfile) return;
  applyLineLimitOptions(plan, options);
  if (options.yes || options.noLineLimit || options.explicitLineLimit || options.explicitLineLimitMode) return;
  const answer = await ask(`Configure a file length limit?
Large files make review, edits, and test boundaries harder to reason about.

1) Warn only at ${DEFAULT_LINE_LIMIT} lines
2) Block commits at ${DEFAULT_LINE_LIMIT} lines
3) Do not use a line limit
4) Enter a custom line count

Choice [Enter=1]: `);
  const choice = String(answer).trim();
  if (choice === '3') {
    plan.lineLimit = disabledLineLimit();
    return;
  }
  let enforcement = choice === '2' ? 'blocking' : 'advisory';
  let maxLines = DEFAULT_LINE_LIMIT;
  if (choice === '4') {
    const limitAnswer = await ask(`Line limit [Enter=${DEFAULT_LINE_LIMIT}]: `);
    const parsed = parseLineLimitAnswer(limitAnswer);
    if (parsed === null) {
      console.log(`Expected an integer between ${DEFAULT_LINE_LIMIT} and 5000. Using the default ${DEFAULT_LINE_LIMIT}-line limit.`);
    } else {
      maxLines = parsed;
    }
    const blockAnswer = await ask('Block commits when this limit is exceeded? [y=block / Enter=warn only] ');
    if (String(blockAnswer).trim().toLowerCase() === 'y') enforcement = 'blocking';
  }
  plan.lineLimit = { enabled: true, maxLines, enforcement };
  applyLineLimitToHooks(plan, options);
}

export async function chooseMode(options) {
  if (options.mode) return options.mode;
  if (options.yes) return 'normal';
  while (true) {
    const answer = await ask(`Choose an install mode.

1) Minimal - Install the lightest setup
2) Normal  - Use the recommended setup
3) Full    - Install every safe optional feature
4) Custom  - Choose settings manually

Choice [Enter=Normal / q=cancel]: `);
    const normalized = String(answer).trim().toLowerCase();
    if (!normalized) return 'normal';
    if (normalized === 'q' || normalized === 'quit' || normalized === 'n' || normalized === 'no') return 'cancel';
    const selected = MODE_ALIASES.get(normalized);
    if (selected) return selected;
    console.log('Unknown choice. Enter 1, 2, 3, 4, or q.');
  }
}

export async function customInstallPlan(command) {
  const plan = {
    mode: 'custom',
    installSkills: command === 'install',
    skillSet: 'core',
    connectRepo: true,
    writeProfile: true,
    writeBridge: true,
    hooks: hookActions(['pre-commit'], 'advisory'),
    deepScan: false,
    lineLimit: defaultLineLimit(),
  };
  await askCustomScope(plan, command);
  if (plan.connectRepo) await askCustomProjectSettings(plan);
  return plan;
}

async function askCustomScope(plan, command) {
  if (command === 'install') {
    const scope = await ask(`Where should this apply?

1) This computer and the current project
2) This computer only
3) The current project only

Choice [Enter=1]: `);
    const normalizedScope = String(scope).trim();
    if (normalizedScope === '2') {
      plan.installSkills = true;
      plan.connectRepo = false;
      plan.writeProfile = false;
      plan.writeBridge = false;
      plan.hooks = [];
      plan.deepScan = false;
      plan.lineLimit = disabledLineLimit();
    } else if (normalizedScope === '3') {
      plan.installSkills = false;
      plan.connectRepo = true;
    }

    if (plan.installSkills) {
      const featureRange = await ask(`Choose the feature set to install.

1) Core features
2) Core features + all optional features

Choice [Enter=1]: `);
      if (String(featureRange).trim() === '2') plan.skillSet = 'all';
    }
    return;
  }

  plan.installSkills = false;
  plan.connectRepo = true;
  const featureRange = await ask(`Choose the feature set for the current project.

1) Core features
2) Core features + all optional features

Choice [Enter=1]: `);
  if (String(featureRange).trim() === '2') plan.skillSet = 'all';
}

async function askCustomProjectSettings(plan) {
  const guidance = await ask(`Write project configuration files?

1) Add the config file and AI bridge text
2) Add the config file only
3) Add nothing

Choice [Enter=1]: `);
  if (String(guidance).trim() === '2') {
    plan.writeProfile = true;
    plan.writeBridge = false;
  } else if (String(guidance).trim() === '3') {
    plan.writeProfile = false;
    plan.writeBridge = false;
  }

  const checks = await ask(`Run automatic checks at commit time?

1) Show warnings only
2) Do not run checks
3) Block the commit when clearly risky issues are detected

Choice [Enter=1]: `);
  if (String(checks).trim() === '2') plan.hooks = [];
  if (String(checks).trim() === '3') plan.hooks = hookActions(['pre-commit'], 'blocking');

  const scan = await ask(`Run a deep scan on the current project?
This can take a few minutes and does not modify code.

1) Later
2) Run now

Choice [Enter=1]: `);
  if (String(scan).trim() === '2') plan.deepScan = true;
}

export async function askFullEnforcement(plan, options) {
  if (options.yes || options.explicitHooks || options.explicitHookTargets || options.skipHooks) return;
  if (plan.mode !== 'full' || !plan.connectRepo || plan.hooks.length === 0) return;
  const answer = await ask(`Full mode preserves existing files and installs every safe optional feature.
How should automatic check results be handled?

1) Show warnings only - surface problems but do not block commit or push
2) Block at commit time - stop the commit on clear errors
3) Block at commit and push time - stricter enforcement

Choice [Enter=1]: `);
  const normalized = String(answer).trim();
  if (normalized === '2') {
    plan.hooks = [
      ...hookActions(['pre-commit'], 'blocking'),
      ...hookActions(['pre-push'], 'advisory'),
    ];
  } else if (normalized === '3') {
    plan.hooks = hookActions(['pre-commit', 'pre-push'], 'blocking');
  }
}
