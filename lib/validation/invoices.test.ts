import { describe, expect, it } from 'vitest'
import { periodMonthSchema } from './invoices'

describe('periodMonthSchema', () => {
  it('accepts the first day of a valid month', () => {
    expect(periodMonthSchema.safeParse('2026-09-01').success).toBe(true)
  })

  it('rejects invalid months and non-first days', () => {
    expect(periodMonthSchema.safeParse('2026-13-01').success).toBe(false)
    expect(periodMonthSchema.safeParse('2026-09-02').success).toBe(false)
  })
})
