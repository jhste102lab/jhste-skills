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
      if (inline !== undefined) args[key] = inline;
      else if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) args[key] = argv[++i];
      else args[key] = true;
      continue;
    }
    if (value === '-y') args.yes = true;
    else args[value.slice(1)] = true;
  }
  return args;
}

export function isYesArg(args) {
  return args?.yes === true || args?.y === true;
}

export function isDryRunArg(args) {
  return args?.['dry-run'] === true;
}
