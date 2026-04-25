import path from 'node:path';
import { DEFAULT_TARGET_DIR } from './constants.js';

export function normalizeAliasPath(aliasPath) {
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

export function toPascalCase(value) {
  return value
    .replace(/(^\w|[-_\s]\w)/g, (match) => match.replace(/[-_\s]/g, '').toUpperCase());
}

export function toKebabCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .toLowerCase();
}
