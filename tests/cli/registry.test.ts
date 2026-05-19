import { describe, it, expect } from 'vitest'
import { createCustomComponentEntry } from '../../cli/lib/registry.js'

describe('createCustomComponentEntry', () => {
  it('returns entry with correct target file', () => {
    const entry = createCustomComponentEntry('reasoning-card')
    expect(entry.description).toContain('reasoning-card')
    expect(entry.files[0].target).toBe('reasoning-card.vue')
    expect(entry.files[0].source).toBe('generated:custom-component')
  })
})
