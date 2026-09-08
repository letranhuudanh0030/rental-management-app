import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'
import { enrichInvoices } from '@/lib/services/invoices'
import { getInvoiceValidationMessage, periodMonthSchema } from '@/lib/validation/invoices'

export async function GET(request: Request) {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period')
  const status = searchParams.get('status')

  let query = supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  if (period) {
    const parsedPeriod = periodMonthSchema.safeParse(period)
    if (!parsedPeriod.success) {
      return NextResponse.json(
        { error: getInvoiceValidationMessage(parsedPeriod.error) },
        { status: 400 }
      )
    }
    query = query.eq('period_month', parsedPeriod.data)
  }
  if (status === 'unpaid') query = query.eq('payment_status', 'unpaid')
  if (status === 'paid') {
    query = query.in('payment_status', ['paid_cash', 'paid_transfer'])
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: settings } = await supabase
    .from('landlord_settings')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  const enriched = await enrichInvoices(supabase, data ?? [], settings)
  return NextResponse.json(enriched)
}
