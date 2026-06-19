import readline from 'node:readline/promises';
import { isDryRunArg, isYesArg } from './args.mjs';
import { printChangedFiles } from './paths.mjs';

export async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

export async function confirmWriteAction(args, {
  action,
  prompt,
  repoRoot,
  changedFiles = [],
} = {}) {
  printChangedFiles(repoRoot || process.cwd(), changedFiles, { prefix: isDryRunArg(args) ? 'Planned changed files' : 'Changed files' });
  if (isDryRunArg(args)) {
    console.log('Dry run: no changes applied.');
    return false;
  }
  if (isYesArg(args)) return true;
  if (!process.stdin.isTTY) {
    console.error(`Non-interactive ${action || 'write'} requires explicit --yes or -y; refusing to change files.`);
    process.exit(3);
  }
  const answer = await ask(prompt || 'Apply changes? [y/N] ');
  return answer.toLowerCase() === 'y';
}
