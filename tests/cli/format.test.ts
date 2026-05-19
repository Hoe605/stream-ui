import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatInfo, formatSuccess, formatWarn, formatError, colorizeDiffLine, printBanner } from '../../cli/lib/format.js'

describe('formatInfo', () => {
  it('wraps message with prefix', () => {
    expect(formatInfo('test')).toContain('test')
  })
})

describe('formatSuccess', () => {
  it('wraps message with prefix', () => {
    expect(formatSuccess('ok')).toContain('ok')
  })
})

describe('formatWarn', () => {
  it('wraps message with prefix', () => {
    expect(formatWarn('careful')).toContain('careful')
  })
})

describe('formatError', () => {
  it('wraps message with prefix', () => {
    expect(formatError('fail')).toContain('fail')
  })
})

describe('colorizeDiffLine', () => {
  it('dims +++ lines', () => {
    const result = colorizeDiffLine('+++ b/file.txt')
    expect(result).toContain('+++ b/file.txt')
  })

  it('dims --- lines', () => {
    const result = colorizeDiffLine('--- a/file.txt')
    expect(result).toContain('--- a/file.txt')
  })

  it('greens + lines', () => {
    const result = colorizeDiffLine('+added line')
    expect(result).toContain('+added line')
  })

  it('reds - lines', () => {
    const result = colorizeDiffLine('-removed line')
    expect(result).toContain('-removed line')
  })

  it('cyans @@ lines', () => {
    const result = colorizeDiffLine('@@ -1,3 +1,4 @@')
    expect(result).toContain('@@ -1,3 +1,4 @@')
  })

  it('passes through other lines unchanged', () => {
    expect(colorizeDiffLine(' normal line ')).toBe(' normal line ')
  })
})

describe('printBanner', () => {
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

  it('prints banner and tagline', () => {
    printBanner()
    expect(logs).toHaveLength(3)
    expect(logs.some(l => l.includes('Vue'))).toBe(true)
  })
})
