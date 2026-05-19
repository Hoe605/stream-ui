import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('detectPackageManager', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'stream-ui-pm-'))
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('detects pnpm from lockfile', async () => {
    await writeFile(join(tmpDir, 'pnpm-lock.yaml'), '')
    const { detectPackageManager } = await import('../../cli/lib/package-manager.js')
    expect(await detectPackageManager(tmpDir)).toBe('pnpm')
  })

  it('detects npm from lockfile', async () => {
    await writeFile(join(tmpDir, 'package-lock.json'), '')
    const { detectPackageManager } = await import('../../cli/lib/package-manager.js')
    expect(await detectPackageManager(tmpDir)).toBe('npm')
  })

  it('falls back to npm when no lockfile found', async () => {
    const { detectPackageManager } = await import('../../cli/lib/package-manager.js')
    expect(await detectPackageManager(tmpDir)).toBe('npm')
  })
})
