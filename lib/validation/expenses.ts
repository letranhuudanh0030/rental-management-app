import { z } from 'zod'

export const expenseCategories = ['maintenance', 'utilities', 'tax', 'other'] as const

const expenseFields = {
  category: z.enum(expenseCategories, { message: 'Danh mục chi phí không hợp lệ' }),
  amount: z.number().int().positive('Số tiền phải lớn hơn 0'),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày chi phí không hợp lệ'),
  description: z.string().trim().max(200, 'Mô tả tối đa 200 ký tự').optional(),
}

export const createExpenseSchema = z.object(expenseFields)

export const updateExpenseSchema = z
  .object(expenseFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Cần có ít nhất một trường để cập nhật')

export function getExpenseValidationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Dữ liệu chi phí không hợp lệ'
}
