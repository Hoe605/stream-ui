import path from 'node:path';
import { DEFAULT_COMPONENTS_CONFIG } from '../lib/constants.js';
import { writeGeneratedFile, pathExists } from '../lib/fs.js';
import { formatInfo, formatSuccess, formatWarn, printBanner } from '../lib/format.js';
import { detectTargetDir, getComponentsConfigPath, resolveUiAlias, writeComponentsConfig } from '../lib/config.js';
import { detectPackageManager } from '../lib/package-manager.js';
import { confirmWithUser } from '../lib/prompt.js';
import { registry } from '../lib/registry.js';

export async function runInit(cwd, options) {
  printBanner();

  const targetDir = await detectTargetDir(cwd);
  const uiAlias = await resolveUiAlias(cwd);
  const configPath = getComponentsConfigPath(cwd);
  const hasConfig = await pathExists(configPath);

  console.log(formatInfo(`Target directory: ${targetDir}`));
  console.log(formatInfo(`UI alias: ${uiAlias}`));

  const shouldCreate = await confirmWithUser('Create Stream UI core component in this directory? (Y/n) ', true, options);
  if (!shouldCreate) {
    console.log(formatWarn('Init cancelled.'));
    return;
  }

  let wroteConfig = false;
  if (!hasConfig) {
    await writeComponentsConfig(cwd, DEFAULT_COMPONENTS_CONFIG);
    wroteConfig = true;
  }

  const result = await writeGeneratedFile(registry.init.files[0], cwd, targetDir, options);
  const packageManager = await detectPackageManager(cwd);

  if (wroteConfig) {
    console.log(formatSuccess(`Created ${path.relative(cwd, configPath)}`));
  }

  if (result.status === 'created') {
    console.log(formatSuccess(`Created ${path.relative(cwd, result.destinationPath)}`));
  } else if (result.status === 'updated') {
    console.log(formatSuccess(`Updated ${path.relative(cwd, result.destinationPath)}`));
  } else if (result.status === 'unchanged') {
    console.log(formatInfo(`${path.relative(cwd, result.destinationPath)} is already up to date.`));
  } else {
    console.log(formatWarn('Existing file kept. Nothing changed.'));
    return;
  }

  console.log(formatInfo(`Import it from ${uiAlias}/stream-contains or a relative path.`));
  console.log(formatInfo('Next: npx @huiol/stream-ui add think'));
  console.log(formatInfo(`Then install Vue peer deps with ${packageManager} add vue if the project does not already have it.`));
}
