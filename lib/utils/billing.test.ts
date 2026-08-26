import { describe, expect, it } from 'vitest'
import {
  calculateElectricUsage,
  calculateInvoiceTotal,
  calculateUtilityCost,
  calculateWaterUsage,
  computeDueDate,
  previousPeriodMonth,
} from './billing'
import { getInvoiceDisplayStatus } from './format'

describe('billing calculations', () => {
  it('calculates utility usage from meter readings', () => {
    expect(calculateElectricUsage(100, 125)).toBe(25)
    expect(calculateWaterUsage(40, 43.5)).toBe(3.5)
  })

  it('does not produce negative usage', () => {
    expect(calculateElectricUsage(125, 100)).toBe(0)
    expect(calculateWaterUsage(43, 40)).toBe(0)
  })

  it('calculates rounded utility costs', () => {
    expect(calculateUtilityCost(12.5, 4_000)).toBe(50_000)
    expect(calculateUtilityCost(1.234, 15_000)).toBe(18_510)
  })

  it('calculates the complete invoice total', () => {
    expect(
      calculateInvoiceTotal({
        rent_amount: 3_000_000,
        electric_cost: 480_000,
        water_cost: 120_000,
        other_fees: 5_000,
      })
    ).toBe(3_605_000)
  })

  it('computes the due date in the following month', () => {
    expect(computeDueDate('2026-01-01', 10)).toBe('2026-02-10')
    expect(computeDueDate('2026-12-01', 10)).toBe('2027-01-10')
  })

  it('clamps due days to the supported range', () => {
    expect(computeDueDate('2026-01-01', 0)).toBe('2026-02-01')
    expect(computeDueDate('2026-01-01', 31)).toBe('2026-02-28')
  })

  it('gets the previous billing period across year boundaries', () => {
    expect(previousPeriodMonth('2026-01-01')).toBe('2025-12-01')
  })

  it('marks unpaid invoices overdue only after the due date', () => {
    expect(getInvoiceDisplayStatus('paid_cash', '2020-01-01')).toBe('paid_cash')
    expect(getInvoiceDisplayStatus('unpaid', '2999-01-01')).toBe('unpaid')
  })
})
