import { describe, it, expect } from 'vitest'
import { join, resolve } from 'node:path'
import { normalizeAliasPath, toKebabCase, toPascalCase } from '../../cli/lib/path.js'

describe('normalizeAliasPath', () => {
  it('converts @/ alias to src/ path', () => {
    expect(normalizeAliasPath('@/components/ui')).toBe(join('src', 'components', 'ui'))
  })

  it('strips ./ prefix', () => {
    expect(normalizeAliasPath('./custom/path')).toBe(join('custom', 'path'))
  })

  it('preserves absolute path', () => {
    const abs = resolve('/some/absolute')
    expect(normalizeAliasPath(abs)).toBe(abs)
  })

  it('preserves plain relative path', () => {
    expect(normalizeAliasPath('src/foo')).toBe('src/foo')
  })

  it('returns default for empty or whitespace-only input', () => {
    expect(normalizeAliasPath('')).toBe(join('src', 'components', 'ui'))
    expect(normalizeAliasPath('   ')).toBe(join('src', 'components', 'ui'))
    expect(normalizeAliasPath(undefined as unknown as string)).toBe(join('src', 'components', 'ui'))
  })
})

describe('toKebabCase', () => {
  it('converts PascalCase', () => {
    expect(toKebabCase('ReasoningCard')).toBe('reasoning-card')
  })

  it('converts spaces', () => {
    expect(toKebabCase('hello world')).toBe('hello-world')
  })

  it('handles underscores', () => {
    expect(toKebabCase('my_component')).toBe('my-component')
  })
})

describe('toPascalCase', () => {
  it('converts kebab-case', () => {
    expect(toPascalCase('reasoning-card')).toBe('ReasoningCard')
  })

  it('handles spaces', () => {
    expect(toPascalCase('hello world')).toBe('HelloWorld')
  })
})
