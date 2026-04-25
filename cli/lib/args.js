export function parseArgs(argv) {
  const flags = {
    yes: false,
    overwrite: false,
    diff: false
  };
  const positional = [];

  argv.forEach((arg) => {
    if (arg === '--yes' || arg === '-y') {
      flags.yes = true;
      return;
    }
    if (arg === '--overwrite' || arg === '-o') {
      flags.overwrite = true;
      return;
    }
    if (arg === '--diff') {
      flags.diff = true;
      return;
    }
    positional.push(arg);
  });

  return { positional, flags };
}

export function printUsage() {
  console.log('Usage:');
  console.log('  npx @huiol/stream-ui init [--yes] [--overwrite] [--diff]');
  console.log('  npx @huiol/stream-ui add think [--yes] [--overwrite] [--diff]');
  console.log('  npx @huiol/stream-ui add think text [--yes] [--overwrite] [--diff]');
  console.log('  npx @huiol/stream-ui create my-block [--yes] [--overwrite] [--diff]');
  console.log('  npx @huiol/stream-ui list');
}
