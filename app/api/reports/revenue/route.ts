import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'
import {
  getReportValidationMessage,
  reportRangeSchema,
} from '@/lib/validation/reports'

export async function GET(request: Request) {
  const { supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const params = Object.fromEntries(new URL(request.url).searchParams.entries())
  const parsed = reportRangeSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: getReportValidationMessage(parsed.error) }, { status: 400 })
  }
  if (parsed.data.from > parsed.data.to) {
    return NextResponse.json({ error: 'Kỳ bắt đầu phải trước hoặc bằng kỳ kết thúc' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('get_revenue_report', {
    p_from_month: parsed.data.from,
    p_to_month: parsed.data.to,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ from: parsed.data.from, to: parsed.data.to, data: data ?? [] })
}
