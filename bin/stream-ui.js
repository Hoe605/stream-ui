#!/usr/bin/env node

import { run } from '../cli/index.js';

run(process.argv.slice(2)).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\x1b[31m[stream-ui]\x1b[0m ${message}`);
  process.exit(1);
});
