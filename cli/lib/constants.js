import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const CLI_ROOT = path.join(__dirname, '..');
export const REPO_ROOT = path.join(CLI_ROOT, '..');
export const REGISTRY_DIR = path.join(CLI_ROOT, 'registry');
export const CORE_SOURCE_PATH = path.join(REPO_ROOT, 'src', 'core', 'stream-contains-core.ts');
export const DEFAULT_TAG_SOURCE_PATH = path.join(REPO_ROOT, 'src', 'core', 'default-tag.ts');
export const DEFAULT_TARGET_DIR = path.join('src', 'components', 'ui');
export const COMPONENTS_CONFIG_FILE = 'components.json';
export const DEFAULT_COMPONENTS_CONFIG = {
  $schema: 'https://huiol.com/schema/stream-ui-components.json',
  style: 'default',
  framework: 'vue',
  typescript: true,
  aliases: {
    ui: '@/components/ui'
  }
};

export const colors = {
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  gray: '\x1b[90m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m'
};

export const banner = `
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
