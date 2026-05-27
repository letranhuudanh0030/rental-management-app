import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'
import { generateInvoicesForPeriod } from '@/lib/services/invoices'
import { currentPeriodMonth } from '@/lib/utils/format'

export async function POST(request: Request) {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const body = await request.json().catch(() => ({}))
  const periodMonth = body.period_month ?? currentPeriodMonth()

  const { data: settings, error: settingsError } = await supabase
    .from('landlord_settings')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  if (settingsError || !settings) {
    return NextResponse.json({ error: 'Không tìm thấy cài đặt' }, { status: 500 })
  }

  try {
    const result = await generateInvoicesForPeriod(
      supabase,
      user!.id,
      periodMonth,
      settings
    )
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Lỗi tạo hóa đơn'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
