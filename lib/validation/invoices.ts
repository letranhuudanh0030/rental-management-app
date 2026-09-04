import { z } from 'zod'

export const periodMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-01$/, {
  message: 'Kỳ hóa đơn phải có định dạng YYYY-MM-01',
})

export function getInvoiceValidationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Dữ liệu hóa đơn không hợp lệ'
}
