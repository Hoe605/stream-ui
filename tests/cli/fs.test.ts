import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createUnifiedDiff, pathExists } from '../../cli/lib/fs.js'
import { COMPONENTS_SOURCE_DIR } from '../../cli/lib/constants.js'

describe('createUnifiedDiff', () => {
  it('returns empty for identical content', () => {
    expect(createUnifiedDiff('hello', 'hello', 'f.txt')).toBe('')
  })

  it('produces diff for differing content', () => {
    const diff = createUnifiedDiff('line1\nline2', 'line1\nchanged\nline2', 'f.txt')
    expect(diff).toContain('--- f.txt (current)')
    expect(diff).toContain('+++ f.txt (incoming)')
    expect(diff).toContain('-line2')
    expect(diff).toContain('+changed')
  })

  it('handles added lines at end', () => {
    const diff = createUnifiedDiff('line1', 'line1\nline2\nline3', 'f.txt')
    expect(diff).toContain('+line2')
    expect(diff).toContain('+line3')
  })

  it('handles removed lines at end', () => {
    const diff = createUnifiedDiff('line1\nline2', 'line1', 'f.txt')
    expect(diff).toContain('-line2')
  })
})

describe('pathExists', () => {
  it('returns true for existing files', async () => {
    expect(await pathExists(import.meta.filename)).toBe(true)
  })

  it('returns false for non-existing files', async () => {
    expect(await pathExists('/nonexistent/path')).toBe(false)
  })
})

describe('getRegistryFileContent', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'stream-ui-reg-'))
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('throws for unknown generated template', async () => {
    const { getRegistryFileContent } = await import('../../cli/lib/fs.js')
    await expect(getRegistryFileContent({ source: 'generated:unknown' }))
      .rejects.toThrow('Unknown generated template')
  })

  it('throws for invalid source prefix', async () => {
    const { getRegistryFileContent } = await import('../../cli/lib/fs.js')
    await expect(getRegistryFileContent({ source: 'bad:path' }))
      .rejects.toThrow('Invalid source path')
  })

  it('reads from src: path', async () => {
    const { getRegistryFileContent } = await import('../../cli/lib/fs.js')
    const content = await getRegistryFileContent({ source: 'src:think/Think.vue' })
    expect(content).toContain('s-think')
  })
})

describe('getDestinationPath', () => {
  it('joins paths correctly with relative targetDir', async () => {
    const { getDestinationPath } = await import('../../cli/lib/fs.js')
    const result = getDestinationPath('/project', 'src/ui', { target: 'cmp.vue' })
    expect(result).toBe('/project/src/ui/cmp.vue')
  })

  it('uses absolute targetDir as-is', async () => {
    const { getDestinationPath } = await import('../../cli/lib/fs.js')
    const result = getDestinationPath('/project', '/abs/path', { target: 'cmp.vue' })
    expect(result).toBe('/abs/path/cmp.vue')
  })
})

describe('ensureDirectory / isDirectory', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'stream-ui-dir-'))
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('creates nested directory and confirms it is a directory', async () => {
    const { ensureDirectory, isDirectory } = await import('../../cli/lib/fs.js')
    const nested = join(tmpDir, 'a', 'b', 'c')
    await ensureDirectory(nested)
    expect(await isDirectory(nested)).toBe(true)
  })

  it('returns false for non-existing directory', async () => {
    const { isDirectory } = await import('../../cli/lib/fs.js')
    expect(await isDirectory(join(tmpDir, 'nonexistent'))).toBe(false)
  })
})

describe('writeGeneratedFile', () => {
  let tmpDir: string
  let logs: string[]

  const collectLogs = (...args: unknown[]) => {
    logs.push(args.map(String).join(' '))
  }

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'stream-ui-wgf-'))
    await mkdir(join(tmpDir, 'ui'), { recursive: true })
    logs = []
    vi.spyOn(console, 'log').mockImplementation(collectLogs)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {})
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('creates a new file', async () => {
    const { writeGeneratedFile } = await import('../../cli/lib/fs.js')
    const result = await writeGeneratedFile(
      { source: 'src:think/Think.vue', target: 'think.vue' },
      tmpDir,
      'ui',
      { yes: true },
    )
    expect(result.status).toBe('created')
    expect(result.destinationPath).toContain('think.vue')
  })

  it('returns unchanged when file content matches', async () => {
    const { writeGeneratedFile } = await import('../../cli/lib/fs.js')
    await writeGeneratedFile(
      { source: 'src:think/Think.vue', target: 'same.vue' },
      tmpDir,
      'ui',
      { yes: true },
    )
    const result = await writeGeneratedFile(
      { source: 'src:think/Think.vue', target: 'same.vue' },
      tmpDir,
      'ui',
      { yes: true, overwrite: true },
    )
    expect(result.status).toBe('unchanged')
  })

  it('returns updated when file differs and overwrite is set', async () => {
    const { writeGeneratedFile } = await import('../../cli/lib/fs.js')
    await writeFile(join(tmpDir, 'ui', 'different.vue'), 'old content')
    const result = await writeGeneratedFile(
      { source: 'src:think/Think.vue', target: 'different.vue' },
      tmpDir,
      'ui',
      { yes: true, overwrite: true },
    )
    expect(result.status).toBe('updated')
  })

  it('shows diff when --diff flag is set', async () => {
    const { writeGeneratedFile } = await import('../../cli/lib/fs.js')
    await writeFile(join(tmpDir, 'ui', 'diff-test.vue'), 'old content')
    const result = await writeGeneratedFile(
      { source: 'src:think/Think.vue', target: 'diff-test.vue' },
      tmpDir,
      'ui',
      { yes: true, overwrite: true, diff: true },
    )
    expect(result.status).toBe('updated')
  })

  it('skips when file differs and no overwrite (non-TTY)', async () => {
    const { writeGeneratedFile } = await import('../../cli/lib/fs.js')
    await writeFile(join(tmpDir, 'ui', 'skip-me.vue'), 'custom content')
    const result = await writeGeneratedFile(
      { source: 'src:think/Think.vue', target: 'skip-me.vue' },
      tmpDir,
      'ui',
      {},
    )
    expect(result.status).toBe('skipped')
  })

  it('updates when confirmWithUser returns true (TTY mock)', async () => {
    const promptModule = await import('../../cli/lib/prompt.js')
    const spy = vi.spyOn(promptModule, 'confirmWithUser').mockResolvedValue(true)

    const { writeGeneratedFile } = await import('../../cli/lib/fs.js')
    await writeFile(join(tmpDir, 'ui', 'confirm-yes.vue'), 'old content')
    const result = await writeGeneratedFile(
      { source: 'src:think/Think.vue', target: 'confirm-yes.vue' },
      tmpDir,
      'ui',
      {},
    )

    expect(result.status).toBe('updated')
    spy.mockRestore()
  })
})
