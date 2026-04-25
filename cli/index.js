import { parseArgs, printUsage } from './lib/args.js';
import { formatError, printBanner } from './lib/format.js';
import { runInit } from './commands/init.js';
import { runAdd } from './commands/add.js';
import { runCreate } from './commands/create.js';
import { runList } from './commands/list.js';

export async function run(argv = []) {
  const { positional, flags } = parseArgs(argv);
  const [command, ...rest] = positional;
  const cwd = process.cwd();

  if (!command || command === '--help' || command === '-h') {
    printBanner();
    printUsage();
    return;
  }

  if (command === 'init') {
    await runInit(cwd, flags);
    return;
  }

  if (command === 'add') {
    if (rest.length === 0) {
      throw new Error('Missing component name. Example: npx @huiol/stream-ui add think text');
    }
    await runAdd(rest, cwd, flags);
    return;
  }

  if (command === 'create') {
    const [name] = rest;
    if (!name) {
      throw new Error('Missing component name. Example: npx @huiol/stream-ui create reasoning-card');
    }
    await runCreate(name, cwd, flags);
    return;
  }

  if (command === 'list') {
    runList();
    return;
  }

  console.log(formatError(`Unknown command "${command}".`));
  printUsage();
  process.exitCode = 1;
}
