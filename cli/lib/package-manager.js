import path from 'node:path';
import { pathExists } from './fs.js';

export async function detectPackageManager(cwd) {
  const lockfiles = [
    { name: 'pnpm', file: 'pnpm-lock.yaml' },
    { name: 'yarn', file: 'yarn.lock' },
    { name: 'npm', file: 'package-lock.json' },
    { name: 'bun', file: 'bun.lockb' }
  ];

  for (const lockfile of lockfiles) {
    if (await pathExists(path.join(cwd, lockfile.file))) {
      return lockfile.name;
    }
  }

  return 'npm';
}
