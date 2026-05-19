import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('runList', () => {
  let tmpDir: string
  let logs: string[]

  const collectLogs = (...args: unknown[]) => {
    logs.push(args.map(String).join(' '))
  }

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'stream-ui-list-'))
    logs = []
    vi.spyOn(console, 'log').mockImplementation(collectLogs)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('prints available components', async () => {
    const { runList } = await import('../../cli/commands/list.js')
    runList()

    const joined = logs.join(' ')
    expect(joined).toContain('think')
    expect(joined).toContain('text')
    expect(joined).toContain('create')
  })
})
