import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import process from 'node:process'

vi.mock('node:readline/promises', () => {
    const createInterface = vi.fn()
    return { createInterface, default: { createInterface } }
})

import { createInterface } from 'node:readline/promises'

describe('confirmWithUser', () => {
  beforeEach(() => {
    vi.mocked(createInterface).mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns fallback when options.yes is true', async () => {
    const { confirmWithUser } = await import('../../cli/lib/prompt.js')
    await expect(confirmWithUser('continue?', true, { yes: true })).resolves.toBe(true)
  })

  it('returns fallback when stdin is not a TTY', async () => {
    const { confirmWithUser } = await import('../../cli/lib/prompt.js')
    await expect(confirmWithUser('continue?', false)).resolves.toBe(false)
  })

  it('returns fallback when stdout is not a TTY (stdin is TTY)', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true })
    Object.defineProperty(process.stdout, 'isTTY', { value: undefined, configurable: true })
    const { confirmWithUser } = await import('../../cli/lib/prompt.js')
    await expect(confirmWithUser('continue?', true)).resolves.toBe(true)
  })

  it('uses readline when TTY and answers y', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true })
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true })

    const mockClose = vi.fn()
    vi.mocked(createInterface).mockReturnValue({
      question: vi.fn().mockResolvedValue('y'),
      close: mockClose,
    } as any)

    const { confirmWithUser } = await import('../../cli/lib/prompt.js')
    const result = await confirmWithUser('continue?', false)

    expect(result).toBe(true)
    expect(vi.mocked(createInterface).mock.calls[0][0].input).toBe(process.stdin)
    expect(mockClose).toHaveBeenCalled()
  })

  it('uses readline when TTY and answers n', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true })
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true })

    vi.mocked(createInterface).mockReturnValue({
      question: vi.fn().mockResolvedValue('n'),
      close: vi.fn(),
    } as any)

    const { confirmWithUser } = await import('../../cli/lib/prompt.js')
    await expect(confirmWithUser('continue?', true)).resolves.toBe(false)
  })

  it('uses readline when TTY and answers empty (returns fallback)', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true })
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true })

    vi.mocked(createInterface).mockReturnValue({
      question: vi.fn().mockResolvedValue(''),
      close: vi.fn(),
    } as any)

    const { confirmWithUser } = await import('../../cli/lib/prompt.js')
    await expect(confirmWithUser('continue?', true)).resolves.toBe(true)
  })
})
