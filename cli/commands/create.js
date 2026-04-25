import path from 'node:path';
import { detectTargetDir } from '../lib/config.js';
import { writeGeneratedFile } from '../lib/fs.js';
import { formatInfo, formatSuccess, formatWarn } from '../lib/format.js';
import { createCustomComponentEntry } from '../lib/registry.js';
import { toKebabCase } from '../lib/path.js';

export async function runCreate(name, cwd, options) {
  const normalizedName = toKebabCase(name);
  const entry = createCustomComponentEntry(normalizedName);
  const targetDir = await detectTargetDir(cwd);

  console.log(formatInfo(`Creating custom component ${normalizedName} in ${targetDir}`));

  for (const file of entry.files) {
    const result = await writeGeneratedFile(file, cwd, targetDir, options, {
      componentName: normalizedName
    });

    if (result.status === 'created') {
      console.log(formatSuccess(`Created ${path.relative(cwd, result.destinationPath)}`));
    } else if (result.status === 'updated') {
      console.log(formatSuccess(`Updated ${path.relative(cwd, result.destinationPath)}`));
    } else if (result.status === 'unchanged') {
      console.log(formatInfo(`${path.relative(cwd, result.destinationPath)} is already up to date.`));
    } else {
      console.log(formatWarn(`Skipped ${normalizedName}. Existing file kept.`));
    }
  }
}
