import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'
import { getReportValidationMessage, reportRangeSchema } from '@/lib/validation/reports'
import { toCsv } from '@/lib/utils/csv'

type ExportType = 'revenue' | 'profit'

export async function GET(request: Request) {
  const { supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const searchParams = new URL(request.url).searchParams
  const type = searchParams.get('type') as ExportType | null
  if (type !== 'revenue' && type !== 'profit') {
    return NextResponse.json({ error: 'Loại báo cáo không hợp lệ' }, { status: 400 })
  }

  const parsed = reportRangeSchema.safeParse({
    from: searchParams.get('from'),
    to: searchParams.get('to'),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: getReportValidationMessage(parsed.error) }, { status: 400 })
  }
  if (parsed.data.from > parsed.data.to) {
    return NextResponse.json({ error: 'Kỳ bắt đầu phải trước hoặc bằng kỳ kết thúc' }, { status: 400 })
  }

  const rpcName = type === 'revenue' ? 'get_revenue_report' : 'get_profit_report'
  const { data, error } = await supabase.rpc(rpcName, {
    p_from_month: parsed.data.from,
    p_to_month: parsed.data.to,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = type === 'revenue'
    ? [
        ['Kỳ', 'Số hóa đơn đã thu', 'Doanh thu'],
        ...(data ?? []).map((row: { period_month: string; invoice_count: number; revenue: number }) => [
          row.period_month,
          row.invoice_count,
          row.revenue,
        ]),
      ]
    : [
        ['Kỳ', 'Doanh thu', 'Chi phí', 'Lợi nhuận'],
        ...(data ?? []).map((row: { period_month: string; revenue: number; expenses: number; profit: number }) => [
          row.period_month,
          row.revenue,
          row.expenses,
          row.profit,
        ]),
      ]

  const filename = `${type}-${parsed.data.from}-${parsed.data.to}.csv`
  return new NextResponse(`\uFEFF${toCsv(rows)}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
