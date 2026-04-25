export function parseArgs(argv) {
  const flags = {
    yes: false,
    overwrite: false,
    diff: false,
    cwd: null
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--yes' || arg === '-y') {
      flags.yes = true;
      continue;
    }
    if (arg === '--overwrite' || arg === '-o') {
      flags.overwrite = true;
      continue;
    }
    if (arg === '--diff') {
      flags.diff = true;
      continue;
    }
    if (arg === '--cwd') {
      const nextArg = argv[index + 1];
      if (!nextArg || nextArg.startsWith('-')) {
        throw new Error('Missing path after --cwd');
      }
      flags.cwd = nextArg;
      index += 1;
      continue;
    }
    if (arg.startsWith('--cwd=')) {
      flags.cwd = arg.slice('--cwd='.length);
      continue;
    }
    positional.push(arg);
  }

  return { positional, flags };
}

export function printUsage() {
  console.log('Usage:');
  console.log('  npx @huiol/stream-ui init [--cwd <path>] [--yes] [--overwrite] [--diff]');
  console.log('  npx @huiol/stream-ui add think [--cwd <path>] [--yes] [--overwrite] [--diff]');
  console.log('  npx @huiol/stream-ui add think text [--cwd <path>] [--yes] [--overwrite] [--diff]');
  console.log('  npx @huiol/stream-ui create my-block [--cwd <path>] [--yes] [--overwrite] [--diff]');
  console.log('  npx @huiol/stream-ui list');
}
