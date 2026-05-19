import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { DEFAULT_COMPONENTS_CONFIG } from '../../cli/lib/constants.js'

describe('runInit', () => {
  let tmpDir: string
  let logs: string[]

  const collectLogs = (...args: unknown[]) => {
    logs.push(args.map(String).join(' '))
  }

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'stream-ui-init-'))
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

  it('creates components.json and stream-contains.ts', async () => {
    const { runInit } = await import('../../cli/commands/init.js')
    await runInit(tmpDir, { yes: true })

    expect(existsSync(join(tmpDir, 'components.json'))).toBe(true)
    const config = JSON.parse(await readFile(join(tmpDir, 'components.json'), 'utf8'))
    expect(config).toMatchObject(DEFAULT_COMPONENTS_CONFIG)

    const scPath = join(tmpDir, 'src', 'components', 'ui', 'stream-contains.ts')
    expect(existsSync(scPath)).toBe(true)
    expect(await readFile(scPath, 'utf8')).toContain('export const StreamContains')
  })

  it('does not recreate components.json if already exists', async () => {
    const customConfig = { ...DEFAULT_COMPONENTS_CONFIG, style: 'custom' }
    await writeFile(join(tmpDir, 'components.json'), JSON.stringify(customConfig))

    const { runInit } = await import('../../cli/commands/init.js')
    await runInit(tmpDir, { yes: true })

    const config = JSON.parse(await readFile(join(tmpDir, 'components.json'), 'utf8'))
    expect(config.style).toBe('custom')
  })

  it('cancels when user declines confirmation', async () => {
    const promptModule = await import('../../cli/lib/prompt.js')
    const spy = vi.spyOn(promptModule, 'confirmWithUser').mockResolvedValue(false)

    const { runInit } = await import('../../cli/commands/init.js')
    await runInit(tmpDir, {})

    expect(logs.join(' ')).toContain('Init cancelled')
    expect(existsSync(join(tmpDir, 'components.json'))).toBe(false)

    spy.mockRestore()
  })

  it('updates stream-contains.ts when --overwrite and content differs', async () => {
    const { runInit: firstRun } = await import('../../cli/commands/init.js')
    await firstRun(tmpDir, { yes: true })

    const scPath = join(tmpDir, 'src', 'components', 'ui', 'stream-contains.ts')
    await writeFile(scPath, 'different content')

    logs = []
    const { runInit: secondRun } = await import('../../cli/commands/init.js')
    await secondRun(tmpDir, { yes: true, overwrite: true })

    expect(logs.join(' ')).toContain('Updated')
    expect(await readFile(scPath, 'utf8')).toContain('export const StreamContains')
  })

  it('skips when existing file differs and no overwrite flag', async () => {
    const { runInit: firstRun } = await import('../../cli/commands/init.js')
    await firstRun(tmpDir, { yes: true })

    const scPath = join(tmpDir, 'src', 'components', 'ui', 'stream-contains.ts')
    await writeFile(scPath, 'different content')

    logs = []
    const { runInit: secondRun } = await import('../../cli/commands/init.js')
    await secondRun(tmpDir, {})

    expect(logs.join(' ')).toContain('Nothing changed')
  })

  it('shows unchanged when stream-contains.ts already matches', async () => {
    const { runInit: run } = await import('../../cli/commands/init.js')
    await run(tmpDir, { yes: true })

    logs = []
    await run(tmpDir, { yes: true })

    expect(logs.join(' ')).toContain('already up to date')
  })
})
