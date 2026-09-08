import { z } from 'zod'

const isoDate = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return date.toISOString().slice(0, 10) === value
}, 'Ngày không hợp lệ')

const dateRange = <T extends { start_date: string; end_date?: string | null }>(data: T) =>
  !data.end_date || data.end_date > data.start_date

export const contractStatusSchema = z.enum([
  'draft',
  'active',
  'terminated',
  'expired',
  'cancelled',
])

export const createContractSchema = z.object({
  room_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  start_date: isoDate,
  end_date: isoDate.nullable().optional(),
  monthly_rent: z.number().int().nonnegative(),
  deposit: z.number().int().nonnegative().default(0),
  status: contractStatusSchema.default('active'),
}).refine(dateRange, { message: 'end_date phải sau start_date', path: ['end_date'] })

export const terminateContractSchema = z.object({
  termination_date: isoDate,
  termination_reason: z.string().trim().min(1).max(500),
  notice_date: isoDate.optional(),
})

export const renewContractSchema = z.object({
  start_date: isoDate,
  end_date: isoDate.nullable().optional(),
  monthly_rent: z.number().int().nonnegative(),
  deposit: z.number().int().nonnegative().default(0),
}).refine(dateRange, { message: 'end_date phải sau start_date', path: ['end_date'] })
