import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { COMPONENTS_SOURCE_DIR } from './constants.js';
import { colorizeDiffLine } from './format.js';
import { confirmWithUser } from './prompt.js';
import { buildStreamContainsTemplate, buildCustomComponentTemplate } from './templates.js';

export async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDirectory(targetDir) {
  await mkdir(targetDir, { recursive: true });
}

export async function isDirectory(targetPath) {
  try {
    const entry = await stat(targetPath);
    return entry.isDirectory();
  } catch {
    return false;
  }
}

export function getDestinationPath(cwd, targetDir, file) {
  const baseTargetDir = path.isAbsolute(targetDir) ? targetDir : path.join(cwd, targetDir);
  return path.join(baseTargetDir, file.target);
}

export function createUnifiedDiff(existingContent, nextContent, fileLabel) {
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
      lines.push(` ${currentLine}`);
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

export async function getRegistryFileContent(file, context = {}) {
  if (file.source.startsWith('generated:')) {
    if (file.source === 'generated:stream-contains') {
      return buildStreamContainsTemplate();
    }

    if (file.source === 'generated:custom-component') {
      return buildCustomComponentTemplate(context.componentName);
    }

    throw new Error(`Unknown generated template "${file.source}".`);
  }
  if (file.source.startsWith('src:')) {
    const relativePath = file.source.slice(4);
    const sourcePath = path.join(COMPONENTS_SOURCE_DIR, relativePath);
    return readFile(sourcePath, 'utf8');
  }

  throw new Error(`Invalid source path "${file.source}". All components must be sourced from "src:".`);
}

export async function writeGeneratedFile(file, cwd, targetDir, options, context = {}) {
  const destinationPath = getDestinationPath(cwd, targetDir, file);
  const destinationDir = path.dirname(destinationPath);
  const nextContent = await getRegistryFileContent(file, context);

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
      false,
      options
    );

    if (!shouldOverwrite) {
      return { destinationPath, status: 'skipped' };
    }
  }

  await writeFile(destinationPath, nextContent, 'utf8');
  return { destinationPath, status: 'updated' };
}
