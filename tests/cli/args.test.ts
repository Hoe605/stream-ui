import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseArgs, printUsage } from '../../cli/lib/args.js'

describe('parseArgs', () => {
  it('parses positional args and --yes', () => {
    const { positional, flags } = parseArgs(['init', '--yes'])
    expect(positional).toEqual(['init'])
    expect(flags.yes).toBe(true)
  })

  it('parses --cwd with next arg', () => {
    const { flags } = parseArgs(['init', '--cwd', './my-app'])
    expect(flags.cwd).toBe('./my-app')
  })

  it('parses --cwd=value', () => {
    const { flags } = parseArgs(['init', '--cwd=./my-app'])
    expect(flags.cwd).toBe('./my-app')
  })

  it('parses -o as overwrite', () => {
    const { flags } = parseArgs(['add', 'think', '-o'])
    expect(flags.overwrite).toBe(true)
  })

  it('parses --diff', () => {
    const { flags } = parseArgs(['init', '--diff'])
    expect(flags.diff).toBe(true)
  })

  it('throws when --cwd has no value', () => {
    expect(() => parseArgs(['--cwd'])).toThrow('Missing path after --cwd')
    expect(() => parseArgs(['--cwd', '--yes'])).toThrow('Missing path after --cwd')
  })
})

describe('printUsage', () => {
  let logs: string[]

  beforeEach(() => {
    logs = []
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '))
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('prints usage instructions', () => {
    printUsage()
    expect(logs.join(' ')).toContain('npx @huiol/stream-ui')
    expect(logs).toHaveLength(6)
  })
})
