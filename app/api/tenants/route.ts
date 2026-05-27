import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'

export async function GET() {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const { data, error } = await supabase
    .from('tenants')
    .select('*, contracts!inner(room_id, is_active, rooms(name))')
    .eq('user_id', user!.id)
    .order('name')

  if (error) {
    const { data: tenants, error: fallbackError } = await supabase
      .from('tenants')
      .select('*')
      .eq('user_id', user!.id)
      .order('name')

    if (fallbackError) {
      return NextResponse.json({ error: fallbackError.message }, { status: 500 })
    }
    return NextResponse.json(tenants)
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const body = await request.json()
  const { name, phone, id_number, notes, room_id, monthly_rent, deposit, start_date } =
    body

  if (!name || !phone) {
    return NextResponse.json({ error: 'Thiếu tên hoặc SĐT' }, { status: 400 })
  }

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      user_id: user!.id,
      name,
      phone,
      id_number: id_number ?? null,
      notes: notes ?? null,
    })
    .select()
    .single()

  if (tenantError) {
    return NextResponse.json({ error: tenantError.message }, { status: 500 })
  }

  if (room_id) {
    const { data: room } = await supabase
      .from('rooms')
      .select('base_rent')
      .eq('id', room_id)
      .eq('user_id', user!.id)
      .single()

    await supabase
      .from('contracts')
      .update({ is_active: false })
      .eq('room_id', room_id)
      .eq('user_id', user!.id)

    await supabase.from('contracts').insert({
      user_id: user!.id,
      room_id,
      tenant_id: tenant.id,
      start_date: start_date ?? new Date().toISOString().slice(0, 10),
      monthly_rent: monthly_rent ?? room?.base_rent ?? 0,
      deposit: deposit ?? 0,
      is_active: true,
    })

    await supabase
      .from('rooms')
      .update({ status: 'occupied' })
      .eq('id', room_id)
      .eq('user_id', user!.id)
  }

  return NextResponse.json(tenant, { status: 201 })
}
