import { describe, expect, it } from 'vitest'
import { createContractSchema, renewContractSchema, terminateContractSchema } from './contracts'

const ids = {
  room_id: '00000000-0000-0000-0000-000000000001',
  tenant_id: '00000000-0000-0000-0000-000000000002',
}

describe('contract validation', () => {
  it('accepts a valid contract and defaults active status', () => {
    const result = createContractSchema.parse({
      ...ids,
      start_date: '2026-09-01',
      end_date: '2027-08-31',
      monthly_rent: 3000000,
    })

    expect(result.status).toBe('active')
    expect(result.deposit).toBe(0)
  })

  it('rejects invalid dates and reversed ranges', () => {
    expect(createContractSchema.safeParse({
      ...ids,
      start_date: '2026-02-30',
      monthly_rent: 1,
    }).success).toBe(false)
    expect(renewContractSchema.safeParse({
      start_date: '2026-09-01',
      end_date: '2026-08-31',
      monthly_rent: 1,
    }).success).toBe(false)
  })

  it('requires a termination reason', () => {
    expect(terminateContractSchema.safeParse({
      termination_date: '2026-09-01',
      termination_reason: ' ',
    }).success).toBe(false)
  })
})
