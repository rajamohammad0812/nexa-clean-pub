import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges classes', () => {
    expect(cn('px-2', 'px-4')).toContain('px-4')
  })
})
