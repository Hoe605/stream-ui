import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { COMPONENTS_CONFIG_FILE, DEFAULT_COMPONENTS_CONFIG, DEFAULT_TARGET_DIR } from './constants.js';
import { isDirectory, pathExists, ensureDirectory } from './fs.js';
import { normalizeAliasPath } from './path.js';

export function getComponentsConfigPath(cwd) {
  return path.join(cwd, COMPONENTS_CONFIG_FILE);
}

export async function readComponentsConfig(cwd) {
  const configPath = getComponentsConfigPath(cwd);
  if (!(await pathExists(configPath))) {
    return null;
  }

  try {
    return JSON.parse(await readFile(configPath, 'utf8'));
  } catch {
    throw new Error(`Failed to parse ${COMPONENTS_CONFIG_FILE}.`);
  }
}

export async function writeComponentsConfig(cwd, config = DEFAULT_COMPONENTS_CONFIG) {
  const configPath = getComponentsConfigPath(cwd);
  await ensureDirectory(path.dirname(configPath));
  const content = `${JSON.stringify(config, null, 2)}\n`;
  await writeFile(configPath, content, 'utf8');
  return configPath;
}

export async function detectTargetDir(cwd) {
  const componentsConfig = await readComponentsConfig(cwd);
  if (componentsConfig?.aliases?.ui) {
    return normalizeAliasPath(componentsConfig.aliases.ui);
  }

  const packageJsonPath = path.join(cwd, 'package.json');
  const srcDir = path.join(cwd, 'src');

  if (await pathExists(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
      if (packageJson?.aliases?.ui) {
        return normalizeAliasPath(packageJson.aliases.ui);
      }
    } catch {
      // Ignore parse errors and fall back to defaults.
    }
  }

  if (await isDirectory(path.join(srcDir, 'components', 'ui'))) {
    return path.join('src', 'components', 'ui');
  }

  if (await isDirectory(path.join(srcDir, 'components'))) {
    return path.join('src', 'components', 'ui');
  }

  return DEFAULT_TARGET_DIR;
}

export async function resolveUiAlias(cwd) {
  const componentsConfig = await readComponentsConfig(cwd);
  if (componentsConfig?.aliases?.ui) {
    return componentsConfig.aliases.ui;
  }

  const targetDir = await detectTargetDir(cwd);
  return `@/${targetDir.replace(/^src\//, '')}`;
}
