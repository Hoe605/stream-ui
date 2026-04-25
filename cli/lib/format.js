import { banner, colors } from './constants.js';

export function formatInfo(message) {
  return `${colors.cyan}[stream-ui]${colors.reset} ${message}`;
}

export function formatSuccess(message) {
  return `${colors.green}[ok]${colors.reset} ${message}`;
}

export function formatWarn(message) {
  return `${colors.yellow}[warn]${colors.reset} ${message}`;
}

export function formatError(message) {
  return `${colors.red}[error]${colors.reset} ${message}`;
}

export function colorizeDiffLine(line) {
  if (line.startsWith('+++') || line.startsWith('---')) return `${colors.dim}${line}${colors.reset}`;
  if (line.startsWith('+')) return `${colors.green}${line}${colors.reset}`;
  if (line.startsWith('-')) return `${colors.red}${line}${colors.reset}`;
  if (line.startsWith('@@')) return `${colors.cyan}${line}${colors.reset}`;
  return line;
}

export function printBanner() {
  console.log(`${colors.blue}${banner}${colors.reset}`);
  console.log(`${colors.gray}Local-first stream components for Vue.${colors.reset}`);
  console.log('');
}
