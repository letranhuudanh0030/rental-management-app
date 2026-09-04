import { z } from 'zod'

export const paymentMethodSchema = z.enum(['cash', 'transfer'])

export const recordPaymentSchema = z.object({
  invoice_id: z.string().uuid(),
  method: paymentMethodSchema,
  amount: z.number().int().positive().optional(),
  notes: z.string().nullable().optional(),
})

export const updatePaymentSchema = z.object({
  invoice_id: z.string().uuid(),
  action: z.enum(['undo', 'resubmit']),
  method: paymentMethodSchema.optional(),
  notes: z.string().nullable().optional(),
  amount: z.number().int().positive().optional(),
  reason: z.string().trim().max(500).nullable().optional(),
})

export function getValidationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Dữ liệu không hợp lệ'
}
