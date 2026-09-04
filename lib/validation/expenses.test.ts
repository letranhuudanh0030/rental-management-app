import { describe, expect, it } from 'vitest'
import { createExpenseSchema, updateExpenseSchema } from './expenses'

describe('expense validation', () => {
  it('accepts a valid expense', () => {
    expect(createExpenseSchema.safeParse({
      category: 'maintenance',
      amount: 150000,
      expense_date: '2026-09-04',
      description: 'Sửa vòi nước',
    }).success).toBe(true)
  })

  it('rejects zero, fractional, and unknown category values', () => {
    expect(createExpenseSchema.safeParse({
      category: 'other',
      amount: 0,
      expense_date: '2026-09-04',
    }).success).toBe(false)
    expect(createExpenseSchema.safeParse({
      category: 'other',
      amount: 10.5,
      expense_date: '2026-09-04',
    }).success).toBe(false)
    expect(createExpenseSchema.safeParse({
      category: 'rent',
      amount: 100,
      expense_date: '2026-09-04',
    }).success).toBe(false)
  })

  it('requires a field for updates', () => {
    expect(updateExpenseSchema.safeParse({}).success).toBe(false)
    expect(updateExpenseSchema.safeParse({ amount: 200000 }).success).toBe(true)
  })
})
