import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_DIR = path.join(__dirname, 'registry');
const CORE_SOURCE_PATH = path.join(__dirname, '..', 'src', 'core', 'stream-contains-core.ts');
const DEFAULT_TAG_SOURCE_PATH = path.join(__dirname, '..', 'src', 'core', 'default-tag.ts');
const DEFAULT_TARGET_DIR = path.join('src', 'components', 'ui');
const COMPONENTS_CONFIG_FILE = 'components.json';
const DEFAULT_COMPONENTS_CONFIG = {
  $schema: 'https://huiol.com/schema/stream-ui-components.json',
  style: 'default',
  framework: 'vue',
  typescript: true,
  aliases: {
    ui: '@/components/ui'
  }
};

const colors = {
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  gray: '\x1b[90m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m'
};

const registry = {
  init: {
    files: [
      {
        source: 'generated:stream-contains',
        target: 'stream-contains.ts'
      }
    ]
  },
  components: {
    think: {
      description: 'Collapsible reasoning panel for <think> blocks.',
      files: [
        {
          source: 'templates/think.vue',
          target: 'think.vue'
        }
      ]
    },
    text: {
      description: 'Inline emphasis wrapper for <text> blocks.',
      files: [
        {
          source: 'templates/text.vue',
          target: 'text.vue'
        }
      ]
    }
  }
};

const banner = `
███████╗████████╗██████╗ ███████╗ █████╗ ███╗   ███╗
██╔════╝╚══██╔══╝██╔══██╗██╔════╝██╔══██╗████╗ ████║
███████╗   ██║   ██████╔╝█████╗  ███████║██╔████╔██║
╚════██║   ██║   ██╔══██╗██╔══╝  ██╔══██║██║╚██╔╝██║
███████║   ██║   ██║  ██║███████╗██║  ██║██║ ╚═╝ ██║
╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝

██████╗ ██╗   ██╗██╗
██╔══██╗██║   ██║██║
██████╔╝██║   ██║██║
██╔══██╗██║   ██║██║
██████╔╝╚██████╔╝██║
╚═════╝  ╚═════╝ ╚═╝
`.trim();

function formatInfo(message) {
  return `${colors.cyan}[stream-ui]${colors.reset} ${message}`;
}

function formatSuccess(message) {
  return `${colors.green}[ok]${colors.reset} ${message}`;
}

function formatWarn(message) {
  return `${colors.yellow}[warn]${colors.reset} ${message}`;
}

function formatError(message) {
  return `${colors.red}[error]${colors.reset} ${message}`;
}

function colorizeDiffLine(line) {
  if (line.startsWith('+++') || line.startsWith('---')) return `${colors.dim}${line}${colors.reset}`;
  if (line.startsWith('+')) return `${colors.green}${line}${colors.reset}`;
  if (line.startsWith('-')) return `${colors.red}${line}${colors.reset}`;
  if (line.startsWith('@@')) return `${colors.cyan}${line}${colors.reset}`;
  return line;
}

function printBanner() {
  console.log(`${colors.blue}${banner}${colors.reset}`);
  console.log(`${colors.gray}Local-first stream components for Vue.${colors.reset}`);
  console.log('');
}

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(targetDir) {
  await mkdir(targetDir, { recursive: true });
}

async function isDirectory(targetPath) {
  try {
    const entry = await stat(targetPath);
    return entry.isDirectory();
  } catch {
    return false;
  }
}

async function getRegistryFileContent(file) {
  if (file.source.startsWith('generated:')) {
    if (file.source === 'generated:stream-contains') {
      return buildStreamContainsTemplate();
    }

    throw new Error(`Unknown generated template "${file.source}".`);
  }

  const sourcePath = path.join(REGISTRY_DIR, file.source);
  return readFile(sourcePath, 'utf8');
}

function getDestinationPath(cwd, targetDir, file) {
  const baseTargetDir = path.isAbsolute(targetDir) ? targetDir : path.join(cwd, targetDir);
  return path.join(baseTargetDir, file.target);
}

function createUnifiedDiff(existingContent, nextContent, fileLabel) {
  if (existingContent === nextContent) {
    return '';
  }

  const existingLines = existingContent.split('\n');
  const nextLines = nextContent.split('\n');
  const maxLength = Math.max(existingLines.length, nextLines.length);
  const lines = [
    `--- ${fileLabel} (current)`,
    `+++ ${fileLabel} (incoming)`,
    '@@'
  ];

  for (let index = 0; index < maxLength; index += 1) {
    const currentLine = existingLines[index];
    const incomingLine = nextLines[index];

    if (currentLine === incomingLine) {
      if (currentLine !== undefined) {
        lines.push(` ${currentLine}`);
      }
      continue;
    }

    if (currentLine !== undefined) {
      lines.push(`-${currentLine}`);
    }

    if (incomingLine !== undefined) {
      lines.push(`+${incomingLine}`);
    }
  }

  return lines.join('\n');
}

async function writeGeneratedFile(file, cwd, targetDir, options) {
  const destinationPath = getDestinationPath(cwd, targetDir, file);
  const destinationDir = path.dirname(destinationPath);
  const nextContent = await getRegistryFileContent(file);

  await ensureDirectory(destinationDir);

  const exists = await pathExists(destinationPath);
  if (!exists) {
    await writeFile(destinationPath, nextContent, 'utf8');
    return { destinationPath, status: 'created' };
  }

  const existingContent = await readFile(destinationPath, 'utf8');
  if (existingContent === nextContent) {
    return { destinationPath, status: 'unchanged' };
  }

  if (options.diff) {
    console.log(colorizeDiffLine(`diff -- stream-ui ${path.relative(cwd, destinationPath)}`));
    createUnifiedDiff(existingContent, nextContent, path.relative(cwd, destinationPath))
      .split('\n')
      .forEach((line) => console.log(colorizeDiffLine(line)));
  }

  if (!options.overwrite) {
    const shouldOverwrite = await confirmWithUser(
      `${path.basename(destinationPath)} already exists. Overwrite it? (y/N) `,
      options.yes ? false : false,
      options
    );

    if (!shouldOverwrite) {
      return { destinationPath, status: 'skipped' };
    }
  }

  await writeFile(destinationPath, nextContent, 'utf8');
  return { destinationPath, status: 'updated' };
}

async function buildStreamContainsTemplate() {
  const coreSource = (await readFile(CORE_SOURCE_PATH, 'utf8')).trim();
  const defaultTagSource = (await readFile(DEFAULT_TAG_SOURCE_PATH, 'utf8'))
    .replace("import { defineComponent, h } from 'vue';\n\n", '')
    .trim();

  return `${coreSource}

import { defineComponent, useSlots } from 'vue';

${defaultTagSource}

export const StreamContains = defineComponent({
  name: 'StreamContains',
  props: streamContainsProps,
  setup(props) {
    return createStreamContainsRender(props as StreamContainsProps, useSlots(), {
      DefaultTag
    });
  }
});

export default StreamContains;
`;
}

function getComponentsConfigPath(cwd) {
  return path.join(cwd, COMPONENTS_CONFIG_FILE);
}

function normalizeAliasPath(aliasPath) {
  if (!aliasPath || typeof aliasPath !== 'string') {
    return DEFAULT_TARGET_DIR;
  }

  const trimmed = aliasPath.trim();
  if (!trimmed) {
    return DEFAULT_TARGET_DIR;
  }

  if (trimmed.startsWith('@/')) {
    return path.join('src', trimmed.slice(2));
  }

  if (trimmed.startsWith('./')) {
    return trimmed.slice(2);
  }

  if (path.isAbsolute(trimmed)) {
    return trimmed;
  }

  return trimmed;
}

async function readComponentsConfig(cwd) {
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

async function writeComponentsConfig(cwd, config) {
  const configPath = getComponentsConfigPath(cwd);
  await ensureDirectory(path.dirname(configPath));
  const content = `${JSON.stringify(config, null, 2)}\n`;
  await writeFile(configPath, content, 'utf8');
  return configPath;
}

async function detectPackageManager(cwd) {
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

async function detectTargetDir(cwd) {
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

async function resolveUiAlias(cwd) {
  const componentsConfig = await readComponentsConfig(cwd);
  if (componentsConfig?.aliases?.ui) {
    return componentsConfig.aliases.ui;
  }

  const targetDir = await detectTargetDir(cwd);
  return `@/${targetDir.replace(/^src\//, '')}`;
}

async function confirmWithUser(question, fallback = true, options = {}) {
  if (options.yes) {
    return fallback;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return fallback;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const answer = await rl.question(question);
    const normalized = answer.trim().toLowerCase();
    if (!normalized) return fallback;
    return normalized === 'y' || normalized === 'yes';
  } finally {
    rl.close();
  }
}

function usage() {
  console.log('Usage:');
  console.log('  npx @huiol/stream-ui init [--yes] [--overwrite] [--diff]');
  console.log('  npx @huiol/stream-ui add think [--yes] [--overwrite] [--diff]');
  console.log('  npx @huiol/stream-ui add think text [--yes] [--overwrite] [--diff]');
  console.log('  npx @huiol/stream-ui add text [--yes] [--overwrite] [--diff]');
}

function parseArgs(argv) {
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

async function runInit(cwd, options) {
  printBanner();

  const targetDir = await detectTargetDir(cwd);
  const uiAlias = await resolveUiAlias(cwd);
  const destinationDir = path.join(cwd, targetDir);
  const componentTargetPath = path.join(destinationDir, 'stream-contains.ts');
  const configPath = getComponentsConfigPath(cwd);
  const hasConfig = await pathExists(configPath);

  console.log(formatInfo(`Target directory: ${colors.dim}${targetDir}${colors.reset}`));
  console.log(formatInfo(`UI alias: ${colors.dim}${uiAlias}${colors.reset}`));

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
  console.log(formatInfo(`Import it from ${colors.dim}${uiAlias}/stream-contains${colors.reset} or a relative path.`));
  console.log(formatInfo(`Next: ${colors.dim}npx @huiol/stream-ui add think${colors.reset}`));
  console.log(formatInfo(`Then install Vue peer deps with ${colors.dim}${packageManager} add vue${colors.reset} if the project does not already have it.`));
}

async function runAdd(names, cwd, options) {
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

    console.log(formatInfo(`Adding ${name} to ${colors.dim}${targetDir}${colors.reset}`));

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

export async function run(argv = []) {
  const { positional, flags } = parseArgs(argv);
  const [command, ...rest] = positional;
  const cwd = process.cwd();

  if (!command || command === '--help' || command === '-h') {
    printBanner();
    usage();
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

  throw new Error(`Unknown command "${command}".`);
}
