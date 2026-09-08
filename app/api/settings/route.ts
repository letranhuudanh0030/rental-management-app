import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'

export async function GET() {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const { data, error } = await supabase
    .from('landlord_settings')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const body = await request.json()
  const allowed = [
    'property_name',
    'electric_price',
    'water_price',
    'invoice_due_day',
    'garbage_price',
  ]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const numericFields = ['electric_price', 'water_price', 'garbage_price']
  for (const key of numericFields) {
    if (
      updates[key] !== undefined &&
      (!Number.isInteger(updates[key]) || (updates[key] as number) < 0)
    ) {
      return NextResponse.json({ error: `${key} không hợp lệ` }, { status: 400 })
    }
  }

  if (
    updates.invoice_due_day !== undefined &&
    (!Number.isInteger(updates.invoice_due_day) ||
      (updates.invoice_due_day as number) < 1 ||
      (updates.invoice_due_day as number) > 28)
  ) {
    return NextResponse.json({ error: 'Ngày hạn thanh toán không hợp lệ' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('landlord_settings')
    .update(updates)
    .eq('user_id', user!.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
