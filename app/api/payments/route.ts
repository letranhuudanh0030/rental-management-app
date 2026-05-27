import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'

export async function POST(request: Request) {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const body = await request.json()
  const { invoice_id, method, amount, notes } = body

  if (!invoice_id || !method) {
    return NextResponse.json({ error: 'Thiếu thông tin thanh toán' }, { status: 400 })
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoice_id)
    .eq('user_id', user!.id)
    .single()

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: 'Không tìm thấy hóa đơn' }, { status: 404 })
  }

  const paymentStatus = method === 'cash' ? 'paid_cash' : 'paid_transfer'
  const paidAt = new Date().toISOString()

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: user!.id,
      invoice_id,
      amount: amount ?? invoice.total_amount,
      method,
      paid_at: paidAt,
      notes: notes ?? null,
    })
    .select()
    .single()

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 })
  }

  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      payment_status: paymentStatus,
      paid_at: paidAt,
    })
    .eq('id', invoice_id)
    .eq('user_id', user!.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ payment, payment_status: paymentStatus })
}
