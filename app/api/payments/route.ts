import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'
import {
  getValidationMessage,
  recordPaymentSchema,
  updatePaymentSchema,
} from '@/lib/validation/payments'

export async function POST(request: Request) {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const body = await request.json().catch(() => null)
  const parsed = recordPaymentSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: getValidationMessage(parsed.error) }, { status: 400 })
  }

  const { invoice_id, method, amount, notes } = parsed.data

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoice_id)
    .eq('user_id', user!.id)
    .single()

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: 'Không tìm thấy hóa đơn' }, { status: 404 })
  }

  const paymentAmount = amount ?? invoice.total_amount
  if (paymentAmount !== invoice.total_amount) {
    return NextResponse.json(
      { error: 'Phase 0 chỉ hỗ trợ thanh toán đủ số tiền hóa đơn' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase.rpc('record_invoice_payment', {
    p_invoice_id: invoice_id,
    p_method: method,
    p_amount: paymentAmount,
    p_notes: notes ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 409 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const body = await request.json().catch(() => null)
  const parsed = updatePaymentSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: getValidationMessage(parsed.error) },
      { status: 400 }
    )
  }

  const { invoice_id, action, method, notes, amount, reason } = parsed.data

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoice_id)
    .eq('user_id', user!.id)
    .single()

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: 'Không tìm thấy hóa đơn' }, { status: 404 })
  }

  if (action === 'undo') {
    const { data, error } = await supabase.rpc('reverse_invoice_payment', {
      p_invoice_id: invoice_id,
      p_reason: reason ?? null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 409 })
    return NextResponse.json(data)
  }

  if (action === 'resubmit') {
    const nextMethod = method ?? 'cash'
    const paymentAmount = amount ?? invoice.total_amount
    if (paymentAmount !== invoice.total_amount) {
      return NextResponse.json(
        { error: 'Phase 0 chỉ hỗ trợ thanh toán đủ số tiền hóa đơn' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.rpc('replace_invoice_payment', {
      p_invoice_id: invoice_id,
      p_method: nextMethod,
      p_amount: paymentAmount,
      p_notes: notes ?? null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 409 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 })
}
