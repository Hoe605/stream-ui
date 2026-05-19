import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

describe('runCreate', () => {
  let tmpDir: string
  let logs: string[]

  const collectLogs = (...args: unknown[]) => {
    logs.push(args.map(String).join(' '))
  }

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'stream-ui-create-'))
    await mkdir(join(tmpDir, 'src'), { recursive: true })
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

  it('scaffolds a custom component (created)', async () => {
    const { runCreate } = await import('../../cli/commands/create.js')
    await runCreate('reasoning-card', tmpDir, { yes: true })

    const filePath = join(tmpDir, 'src', 'components', 'ui', 'reasoning-card.vue')
    expect(existsSync(filePath)).toBe(true)
    const content = await readFile(filePath, 'utf8')
    expect(content).toContain('reasoning-card')
    expect(content).toContain('ReasoningCard')
    expect(content).toContain('defineOptions')
    expect(logs.join(' ')).toContain('Created')
  })

  it('normalizes PascalCase input to kebab-case file', async () => {
    const { runCreate } = await import('../../cli/commands/create.js')
    await runCreate('ReasoningCard', tmpDir, { yes: true })

    const filePath = join(tmpDir, 'src', 'components', 'ui', 'reasoning-card.vue')
    expect(existsSync(filePath)).toBe(true)
  })

  it('overwrites existing file with --overwrite (updated)', async () => {
    const uiDir = join(tmpDir, 'src', 'components', 'ui')
    await mkdir(uiDir, { recursive: true })
    await writeFile(join(uiDir, 'custom-block.vue'), 'old content')

    const { runCreate } = await import('../../cli/commands/create.js')
    await runCreate('custom-block', tmpDir, { yes: true, overwrite: true })

    const content = await readFile(join(uiDir, 'custom-block.vue'), 'utf8')
    expect(content).not.toBe('old content')
    expect(content).toContain('custom-block')
    expect(logs.join(' ')).toContain('Updated')
  })

  it('shows unchanged status when file content is identical', async () => {
    const uiDir = join(tmpDir, 'src', 'components', 'ui')
    await mkdir(uiDir, { recursive: true })

    const { runCreate } = await import('../../cli/commands/create.js')
    await runCreate('duplicate-block', tmpDir, { yes: true, overwrite: true })
    const firstContent = await readFile(join(uiDir, 'duplicate-block.vue'), 'utf8')

    logs = []
    await runCreate('duplicate-block', tmpDir, { yes: true, overwrite: true })

    expect(logs.join(' ')).toContain('already up to date')
  })

  it('skips when existing file differs and no overwrite (non-TTY)', async () => {
    const uiDir = join(tmpDir, 'src', 'components', 'ui')
    await mkdir(uiDir, { recursive: true })
    await writeFile(join(uiDir, 'keep-block.vue'), 'pre-existing content')

    const { runCreate } = await import('../../cli/commands/create.js')
    await runCreate('keep-block', tmpDir, { yes: false })

    const content = await readFile(join(uiDir, 'keep-block.vue'), 'utf8')
    expect(content).toBe('pre-existing content')
    expect(logs.join(' ')).toContain('Skipped')
  })
})
