import { describe, expect, it } from 'vitest'
import {
  paymentHistoryQuerySchema,
  recordPaymentSchema,
  updatePaymentSchema,
} from './payments'

describe('payment request validation', () => {
  it('accepts supported payment methods and positive amounts', () => {
    const result = recordPaymentSchema.safeParse({
      invoice_id: '00000000-0000-0000-0000-000000000001',
      method: 'cash',
      amount: 100_000,
    })

    expect(result.success).toBe(true)
  })

  it('rejects malformed identifiers, methods, and amounts', () => {
    const result = recordPaymentSchema.safeParse({
      invoice_id: 'invoice-1',
      method: 'card',
      amount: 0,
    })

    expect(result.success).toBe(false)
  })

  it('accepts only the supported payment update actions', () => {
    expect(
      updatePaymentSchema.safeParse({
        invoice_id: '00000000-0000-0000-0000-000000000001',
        action: 'undo',
      }).success
    ).toBe(true)
    expect(
      updatePaymentSchema.safeParse({
        invoice_id: '00000000-0000-0000-0000-000000000001',
        action: 'delete',
      }).success
    ).toBe(false)
  })

  it('applies bounded defaults to payment history queries', () => {
    const result = paymentHistoryQuerySchema.parse({})

    expect(result.page).toBe(1)
    expect(result.page_size).toBe(25)
    expect(paymentHistoryQuerySchema.safeParse({ page_size: 101 }).success).toBe(false)
    expect(paymentHistoryQuerySchema.safeParse({ period: '2026-09-02' }).success).toBe(false)
  })
})
