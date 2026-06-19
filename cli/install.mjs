#!/usr/bin/env node
import {
  applyPlan,
  confirmPlan,
  EXIT_CONFIG_FAILURE,
  maybeInstallMissingForConnect,
  normalizeOptions,
  printApplyResult,
  printConfigErrors,
  printPlanSummary,
  resolvePlan,
  usage,
} from './install-flow.mjs';

async function main() {
  const nonInteractive = !process.stdin.isTTY;
  const options = normalizeOptions(process.argv.slice(2), {
    command: 'install',
    cwd: process.cwd(),
    nonInteractive,
  });
  if (options.help) {
    usage('install');
    return;
  }
  if (options.errors.length > 0) {
    printConfigErrors('install', options.errors);
    return;
  }

  let resolved = await resolvePlan(options);
  if (resolved.cancelled) {
    console.log('Install cancelled. No changes made.');
    return;
  }
  if (resolved.errors?.length) {
    printConfigErrors('install', resolved.errors);
    return;
  }
  let { plan } = resolved;
  printPlanSummary(plan);

  let confirmation = await confirmPlan(plan);
  if (confirmation === 'cancel') {
    console.log('Install cancelled. No changes made.');
    return;
  }
  if (confirmation === 'custom') {
    resolved = await resolvePlan({ ...options, mode: 'custom', explicitMode: true });
    if (resolved.errors?.length) {
      printConfigErrors('install', resolved.errors);
      return;
    }
    plan = resolved.plan;
    printPlanSummary(plan);
    confirmation = await confirmPlan(plan);
    if (confirmation !== 'yes') {
      console.log('Install cancelled. No changes made.');
      return;
    }
  }

  const missing = await maybeInstallMissingForConnect(plan);
  if (!missing.ok) {
    printConfigErrors('install', missing.errors);
    return;
  }

  const result = applyPlan(plan);
  printApplyResult(plan, result);
  if (result.exitCode) process.exitCode = result.exitCode;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(EXIT_CONFIG_FAILURE);
});
