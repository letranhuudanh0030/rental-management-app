import { describe, expect, it } from 'vitest'
import { reportRangeSchema } from './reports'

describe('report range validation', () => {
  it('accepts a valid month range', () => {
    expect(reportRangeSchema.safeParse({ from: '2026-01-01', to: '2026-09-01' }).success).toBe(true)
  })

  it('rejects malformed periods', () => {
    expect(reportRangeSchema.safeParse({ from: '2026-01-02', to: '2026-09-01' }).success).toBe(false)
  })
})
