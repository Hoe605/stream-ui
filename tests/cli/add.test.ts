import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

describe('runAdd', () => {
  let tmpDir: string
  let logs: string[]

  const collectLogs = (...args: unknown[]) => {
    logs.push(args.map(String).join(' '))
  }

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'stream-ui-add-'))
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

  it('adds think component', async () => {
    const { runAdd } = await import('../../cli/commands/add.js')
    await runAdd(['think'], tmpDir, { yes: true })

    const thinkPath = join(tmpDir, 'src', 'components', 'ui', 'think.vue')
    expect(existsSync(thinkPath)).toBe(true)
    const content = await readFile(thinkPath, 'utf8')
    expect(content).toContain('s-think')
    expect(content).toContain('defineOptions')
  })

  it('adds text component', async () => {
    const { runAdd } = await import('../../cli/commands/add.js')
    await runAdd(['text'], tmpDir, { yes: true })

    const textPath = join(tmpDir, 'src', 'components', 'ui', 'text.vue')
    expect(existsSync(textPath)).toBe(true)
    const content = await readFile(textPath, 'utf8')
    expect(content).toContain('s-text')
  })

  it('adds multiple components at once', async () => {
    const { runAdd } = await import('../../cli/commands/add.js')
    await runAdd(['think', 'text'], tmpDir, { yes: true })

    expect(existsSync(join(tmpDir, 'src', 'components', 'ui', 'think.vue'))).toBe(true)
    expect(existsSync(join(tmpDir, 'src', 'components', 'ui', 'text.vue'))).toBe(true)
  })

  it('rejects unknown component names', async () => {
    const { runAdd } = await import('../../cli/commands/add.js')
    await runAdd(['nonexistent'], tmpDir, { yes: true })

    const joined = logs.join(' ')
    expect(joined).toContain('Unknown component')
    expect(joined).toContain('nonexistent')
  })

  it('deduplicates duplicate names', async () => {
    const { runAdd } = await import('../../cli/commands/add.js')
    await runAdd(['think', 'think'], tmpDir, { yes: true })

    expect(existsSync(join(tmpDir, 'src', 'components', 'ui', 'think.vue'))).toBe(true)
  })

  it('skips existing file without --overwrite (non-TTY defaults to keep existing)', async () => {
    const uiDir = join(tmpDir, 'src', 'components', 'ui')
    await mkdir(uiDir, { recursive: true })
    await writeFile(join(uiDir, 'think.vue'), 'custom content')

    const { runAdd } = await import('../../cli/commands/add.js')
    await runAdd(['think'], tmpDir, { yes: false })

    const content = await readFile(join(uiDir, 'think.vue'), 'utf8')
    expect(content).toBe('custom content')
  })

  it('overwrites existing file with --overwrite flag', async () => {
    const uiDir = join(tmpDir, 'src', 'components', 'ui')
    await mkdir(uiDir, { recursive: true })
    await writeFile(join(uiDir, 'think.vue'), 'custom content')

    const { runAdd } = await import('../../cli/commands/add.js')
    await runAdd(['think'], tmpDir, { yes: true, overwrite: true })

    const content = await readFile(join(uiDir, 'think.vue'), 'utf8')
    expect(content).toContain('s-think')
  })

  it('shows unchanged when existing file matches source content', async () => {
    const uiDir = join(tmpDir, 'src', 'components', 'ui')
    await mkdir(uiDir, { recursive: true })

    const { runAdd: firstAdd } = await import('../../cli/commands/add.js')
    await firstAdd(['think'], tmpDir, { yes: true, overwrite: true })

    logs = []
    const { runAdd: secondAdd } = await import('../../cli/commands/add.js')
    await secondAdd(['think'], tmpDir, { yes: true, overwrite: true })

    const joined = logs.join(' ')
    expect(joined).toContain('already up to date')
  })
})
