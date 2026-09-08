import { describe, expect, it } from 'vitest'
import { correctInvoiceSchema, periodMonthSchema } from './invoices'

describe('periodMonthSchema', () => {
  it('accepts the first day of a valid month', () => {
    expect(periodMonthSchema.safeParse('2026-09-01').success).toBe(true)
  })

  it('rejects invalid months and non-first days', () => {
    expect(periodMonthSchema.safeParse('2026-13-01').success).toBe(false)
    expect(periodMonthSchema.safeParse('2026-09-02').success).toBe(false)
  })

  it('requires correction totals to match invoice fields and lines', () => {
    const base = {
      reason: 'Điều chỉnh tiền điện',
      invoice: {
        room_id: '00000000-0000-0000-0000-000000000001',
        contract_id: null,
        period_month: '2026-09-01',
        rent_amount: 100,
        electric_usage: 1,
        electric_cost: 20,
        water_usage: 1,
        water_cost: 30,
        other_fees: 10,
        total_amount: 160,
        due_date: '2026-10-05',
      },
      lines: [
        { line_type: 'rent' as const, description: 'Tiền thuê', quantity: 1, unit_price: 100, amount: 100 },
        { line_type: 'electricity' as const, description: 'Tiền điện', quantity: 1, unit_price: 20, amount: 20 },
        { line_type: 'water' as const, description: 'Tiền nước', quantity: 1, unit_price: 30, amount: 30 },
        { line_type: 'garbage' as const, description: 'Tiền rác', quantity: 1, unit_price: 10, amount: 10 },
      ],
    }
    expect(correctInvoiceSchema.safeParse(base).success).toBe(true)
    expect(correctInvoiceSchema.safeParse({ ...base, invoice: { ...base.invoice, total_amount: 999 } }).success).toBe(false)
  })
})
