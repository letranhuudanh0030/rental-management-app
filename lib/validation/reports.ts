import { z } from 'zod'

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-01$/, {
  message: 'Kỳ báo cáo phải có định dạng YYYY-MM-01',
})

export const reportRangeSchema = z.object({
  from: monthSchema,
  to: monthSchema,
})

export function getReportValidationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Khoảng thời gian không hợp lệ'
}
