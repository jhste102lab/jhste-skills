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
    command: 'connect',
    cwd: process.cwd(),
    nonInteractive,
  });
  if (options.help) {
    usage('connect');
    return;
  }
  if (options.errors.length > 0) {
    printConfigErrors('connect', options.errors);
    return;
  }

  if (!options.mode && !options.yes) {
    options.mode = 'normal';
  } else if (!options.mode && options.yes) {
    options.mode = 'normal';
  }

  let resolved = await resolvePlan(options);
  if (resolved.cancelled) {
    console.log('연결을 취소했습니다. 변경 없음.');
    return;
  }
  if (resolved.errors?.length) {
    printConfigErrors('connect', resolved.errors);
    return;
  }

  let { plan } = resolved;
  printPlanSummary(plan);

  let confirmation = await confirmPlan(plan);
  if (confirmation === 'cancel') {
    console.log('연결을 취소했습니다. 변경 없음.');
    return;
  }
  if (confirmation === 'custom') {
    resolved = await resolvePlan({ ...options, mode: 'custom', explicitMode: true });
    if (resolved.errors?.length) {
      printConfigErrors('connect', resolved.errors);
      return;
    }
    plan = resolved.plan;
    printPlanSummary(plan);
    confirmation = await confirmPlan(plan);
    if (confirmation !== 'yes') {
      console.log('연결을 취소했습니다. 변경 없음.');
      return;
    }
  }

  const missing = await maybeInstallMissingForConnect(plan);
  if (!missing.ok) {
    printConfigErrors('connect', missing.errors);
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
