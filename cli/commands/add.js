import path from 'node:path';
import { detectTargetDir } from '../lib/config.js';
import { writeGeneratedFile } from '../lib/fs.js';
import { formatError, formatInfo, formatSuccess, formatWarn } from '../lib/format.js';
import { registry } from '../lib/registry.js';

export async function runAdd(names, cwd, options) {
  const uniqueNames = [...new Set(names)];
  const unknownNames = uniqueNames.filter((name) => !registry.components[name]);

  if (unknownNames.length > 0) {
    unknownNames.forEach((name) => {
      console.log(formatError(`Unknown component "${name}".`));
    });
    console.log('');
    console.log('Available components:');
    for (const [key, value] of Object.entries(registry.components)) {
      console.log(`  - ${key}: ${value.description}`);
    }
    process.exitCode = 1;
    return;
  }

  for (const name of uniqueNames) {
    const component = registry.components[name];
    const targetDir = component.targetDir ?? await detectTargetDir(cwd);

    console.log(formatInfo(`Adding ${name} to ${targetDir}`));

    for (const file of component.files) {
      const result = await writeGeneratedFile(file, cwd, targetDir, options);
      if (result.status === 'created') {
        console.log(formatSuccess(`Created ${path.relative(cwd, result.destinationPath)}`));
      } else if (result.status === 'updated') {
        console.log(formatSuccess(`Updated ${path.relative(cwd, result.destinationPath)}`));
      } else if (result.status === 'unchanged') {
        console.log(formatInfo(`${path.relative(cwd, result.destinationPath)} is already up to date.`));
      } else {
        console.log(formatWarn(`Skipped ${name}. Existing file kept.`));
      }
    }
  }
}
