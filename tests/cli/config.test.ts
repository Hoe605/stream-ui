import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DEFAULT_COMPONENTS_CONFIG } from '../../cli/lib/constants.js'

describe('readComponentsConfig / writeComponentsConfig', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'stream-ui-config-'))
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('writes and reads config', async () => {
    const { writeComponentsConfig, readComponentsConfig } = await import('../../cli/lib/config.js')
    await writeComponentsConfig(tmpDir, DEFAULT_COMPONENTS_CONFIG)

    const config = await readComponentsConfig(tmpDir)
    expect(config).toMatchObject(DEFAULT_COMPONENTS_CONFIG)
  })

  it('returns null for missing config', async () => {
    const { readComponentsConfig } = await import('../../cli/lib/config.js')
    expect(await readComponentsConfig(tmpDir)).toBeNull()
  })

  it('throws on invalid JSON in config', async () => {
    const { getComponentsConfigPath } = await import('../../cli/lib/config.js')
    const configPath = getComponentsConfigPath(tmpDir)
    await writeFile(configPath, 'not valid json')

    const { readComponentsConfig } = await import('../../cli/lib/config.js')
    await expect(readComponentsConfig(tmpDir)).rejects.toThrow('Failed to parse components.json')
  })
})

describe('detectTargetDir', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'stream-ui-target-'))
    await mkdir(join(tmpDir, 'src'), { recursive: true })
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('returns default when no config or src/components exists', async () => {
    const { detectTargetDir } = await import('../../cli/lib/config.js')
    expect(await detectTargetDir(tmpDir)).toBe(join('src', 'components', 'ui'))
  })

  it('reads from components.json aliases.ui', async () => {
    const { writeComponentsConfig, detectTargetDir } = await import('../../cli/lib/config.js')
    await writeComponentsConfig(tmpDir, {
      $schema: '',
      style: 'default',
      framework: 'vue',
      typescript: true,
      aliases: { ui: '@/custom/path' }
    })
    expect(await detectTargetDir(tmpDir)).toBe(join('src', 'custom', 'path'))
  })

  it('reads from package.json aliases.ui', async () => {
    await writeFile(join(tmpDir, 'package.json'), JSON.stringify({
      aliases: { ui: '@/from-pkg' }
    }))
    const { detectTargetDir } = await import('../../cli/lib/config.js')
    expect(await detectTargetDir(tmpDir)).toBe(join('src', 'from-pkg'))
  })

  it('handles malformed package.json gracefully', async () => {
    await writeFile(join(tmpDir, 'package.json'), 'broken json')
    const { detectTargetDir } = await import('../../cli/lib/config.js')
    expect(await detectTargetDir(tmpDir)).toBe(join('src', 'components', 'ui'))
  })

  it('detects existing src/components/ui directory', async () => {
    await mkdir(join(tmpDir, 'src', 'components', 'ui'), { recursive: true })
    const { detectTargetDir } = await import('../../cli/lib/config.js')
    expect(await detectTargetDir(tmpDir)).toBe(join('src', 'components', 'ui'))
  })

  it('detects existing src/components directory', async () => {
    await mkdir(join(tmpDir, 'src', 'components'), { recursive: true })
    const { detectTargetDir } = await import('../../cli/lib/config.js')
    expect(await detectTargetDir(tmpDir)).toBe(join('src', 'components', 'ui'))
  })
})

describe('resolveUiAlias', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'stream-ui-alias-'))
    await mkdir(join(tmpDir, 'src'), { recursive: true })
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('uses components.json aliases.ui when available', async () => {
    const { writeComponentsConfig } = await import('../../cli/lib/config.js')
    await writeComponentsConfig(tmpDir, {
      $schema: '',
      style: 'default',
      framework: 'vue',
      typescript: true,
      aliases: { ui: '@/my/ui' }
    })
    const { resolveUiAlias } = await import('../../cli/lib/config.js')
    expect(await resolveUiAlias(tmpDir)).toBe('@/my/ui')
  })

  it('derives alias from detected target dir', async () => {
    const { resolveUiAlias } = await import('../../cli/lib/config.js')
    expect(await resolveUiAlias(tmpDir)).toBe('@/components/ui')
  })
})
