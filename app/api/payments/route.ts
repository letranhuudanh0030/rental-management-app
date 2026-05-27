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

export async function PATCH(request: Request) {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const body = await request.json()
  const {
    invoice_id,
    action,
    method,
    notes,
    amount,
  }: {
    invoice_id: string
    action: 'undo' | 'resubmit'
    method?: 'cash' | 'transfer'
    notes?: string | null
    amount?: number
  } = body

  if (!invoice_id || !action) {
    return NextResponse.json(
      { error: 'Thiếu thông tin thanh toán' },
      { status: 400 }
    )
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

  const paidAt = new Date().toISOString()

  if (action === 'undo') {
    const { error: deletePaymentError } = await supabase
      .from('payments')
      .delete()
      .eq('invoice_id', invoice_id)
      .eq('user_id', user!.id)

    if (deletePaymentError) {
      return NextResponse.json(
        { error: deletePaymentError.message },
        { status: 500 }
      )
    }

    const { error: updateInvoiceError } = await supabase
      .from('invoices')
      .update({ payment_status: 'unpaid', paid_at: null })
      .eq('id', invoice_id)
      .eq('user_id', user!.id)

    if (updateInvoiceError) {
      return NextResponse.json(
        { error: updateInvoiceError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, payment_status: 'unpaid' })
  }

  if (action === 'resubmit') {
    const nextMethod = method ?? 'cash'
    const paymentStatus =
      nextMethod === 'cash' ? 'paid_cash' : 'paid_transfer'

    // Remove existing payments and re-insert with chosen method.
    await supabase
      .from('payments')
      .delete()
      .eq('invoice_id', invoice_id)
      .eq('user_id', user!.id)

    const insertAmount = amount ?? invoice.total_amount

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user!.id,
        invoice_id,
        amount: insertAmount,
        method: nextMethod,
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

  return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 })
}
