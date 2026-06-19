import path from 'node:path';
import { relativeDisplay } from '../shared.mjs';

function summarizeStatuses(results) {
  return results.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
}

export function printApplyResult(plan, result) {
  const labels = { connect: 'Connection', install: 'Install', sync: 'Sync', update: 'Update' };
  console.log(`\n${labels[plan.command] || 'Run'} completed.`);
  if (result.skillResults.length) {
    const summary = summarizeStatuses(result.skillResults);
    console.log(`- Skills: ${Object.entries(summary).map(([k, v]) => `${k}=${v}`).join(', ') || 'none'}`);
    for (const skill of result.skillResults.filter((item) => item.reason)) console.log(`  - ${skill.status}: ${skill.reason}`);
  } else {
    console.log('- Skills: no changes');
  }
  if (result.profileResult) console.log(`- Profile: ${result.profileResult.status} (${relativeDisplay(plan.repoRoot, result.profileResult.path)})`);
  else console.log('- Profile: no changes');
  for (const bridge of result.bridgeResults) {
    console.log(`- Bridge: ${path.basename(bridge.path)} ${bridge.status}`);
    if (bridge.status === 'manual-review') {
      console.log('  Manual snippet:');
      console.log(bridge.snippet.split('\n').map((line) => `  ${line}`).join('\n'));
    }
  }
  for (const hook of result.hookResults) {
    const reason = hook.reason ? ` - ${hook.reason}` : '';
    const failOn = hook.failOn && hook.failOn !== 'none' ? `, fail-on=${hook.failOn}` : '';
    console.log(`- Hook ${hook.target}: ${hook.status}${hook.mode ? ` (${hook.mode}${failOn})` : ''}${reason}`);
  }
  if (result.deepScanResult) {
    if (result.deepScanResult.status === 'completed') console.log('- Deep scan: completed');
    else console.log(`- Deep scan: warning${result.deepScanResult.reason ? ` (${result.deepScanResult.reason})` : result.deepScanResult.exitCode ? ` (exit ${result.deepScanResult.exitCode})` : ''}`);
  }
  console.log('- CI/package.json/lockfile/source code: unchanged by installer');
  console.log('- Non-managed hooks: never overwritten');
  if (!plan.deepScan) {
    console.log('\nTo run deep scan later:');
    console.log('  npx jhste-skills deep-scan');
  }
}
