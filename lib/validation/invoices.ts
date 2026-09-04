import { z } from 'zod'

export const periodMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-01$/, {
  message: 'Kỳ hóa đơn phải có định dạng YYYY-MM-01',
})

const invoiceLineSchema = z.object({
  line_type: z.enum(['rent', 'electricity', 'water', 'garbage', 'other']),
  description: z.string().trim().min(1).max(200),
  quantity: z.number().nonnegative(),
  unit_price: z.number().int().nonnegative(),
  amount: z.number().int().nonnegative(),
})

export const correctInvoiceSchema = z.object({
  reason: z.string().trim().min(1, 'Cần nhập lý do điều chỉnh hóa đơn').max(500),
  invoice: z.object({
    room_id: z.string().uuid(),
    contract_id: z.string().uuid().nullable().optional(),
    period_month: periodMonthSchema,
    rent_amount: z.number().int().nonnegative(),
    electric_usage: z.number().nonnegative(),
    electric_cost: z.number().int().nonnegative(),
    water_usage: z.number().nonnegative(),
    water_cost: z.number().int().nonnegative(),
    other_fees: z.number().int().nonnegative(),
    total_amount: z.number().int().nonnegative(),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày hạn không hợp lệ'),
  }),
  lines: z.array(invoiceLineSchema).min(1),
}).superRefine((value, context) => {
  const invoiceTotal = value.invoice.rent_amount + value.invoice.electric_cost + value.invoice.water_cost + value.invoice.other_fees
  const lineTotal = value.lines.reduce((sum, line) => sum + line.amount, 0)
  if (value.invoice.total_amount !== invoiceTotal || value.invoice.total_amount !== lineTotal) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['invoice', 'total_amount'], message: 'Tổng hóa đơn không khớp chi tiết' })
  }
})

export function getInvoiceValidationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Dữ liệu hóa đơn không hợp lệ'
}
