import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'
import { previousPeriodMonth } from '@/lib/utils/billing'
import type { MeterBulkRow } from '@/lib/types/database'

export async function GET(request: Request) {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const { searchParams } = new URL(request.url)
  const periodMonth =
    searchParams.get('period') ?? new Date().toISOString().slice(0, 7) + '-01'

  const prevMonth = previousPeriodMonth(periodMonth)

  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('id, name')
    .eq('user_id', user!.id)
    .eq('status', 'occupied')
    .order('sort_order')
    .order('name')

  if (roomsError) {
    return NextResponse.json({ error: roomsError.message }, { status: 500 })
  }

  const roomIds = rooms?.map((r) => r.id) ?? []

  const [{ data: contracts }, { data: currentReadings }, { data: prevReadings }] =
    await Promise.all([
      supabase
        .from('contracts')
        .select('room_id, tenants(name, phone)')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .in('room_id', roomIds),
      supabase
        .from('meter_readings')
        .select('*')
        .eq('user_id', user!.id)
        .eq('period_month', periodMonth)
        .in('room_id', roomIds),
      supabase
        .from('meter_readings')
        .select('room_id, electric_current, water_current')
        .eq('user_id', user!.id)
        .eq('period_month', prevMonth)
        .in('room_id', roomIds),
    ])

  const rows: MeterBulkRow[] =
    rooms?.map((room) => {
      const contract = contracts?.find((c) => c.room_id === room.id)
      const tenant = contract?.tenants as { name: string; phone: string } | null
      const current = currentReadings?.find((r) => r.room_id === room.id)
      const prev = prevReadings?.find((r) => r.room_id === room.id)

      return {
        room_id: room.id,
        room_name: room.name,
        tenant_name: tenant?.name ?? null,
        tenant_phone: tenant?.phone ?? null,
        electric_previous: Number(
          current?.electric_previous ?? prev?.electric_current ?? 0
        ),
        water_previous: Number(current?.water_previous ?? prev?.water_current ?? 0),
        electric_current: current ? Number(current.electric_current) : null,
        water_current: current ? Number(current.water_current) : null,
        reading_id: current?.id ?? null,
      }
    }) ?? []

  const { data: settings } = await supabase
    .from('landlord_settings')
    .select('electric_price, water_price')
    .eq('user_id', user!.id)
    .single()

  return NextResponse.json({
    period_month: periodMonth,
    rows,
    settings: settings ?? { electric_price: 4000, water_price: 15000 },
  })
}

export async function POST(request: Request) {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const body = await request.json()
  const { period_month, readings } = body as {
    period_month: string
    readings: Array<{
      room_id: string
      electric_current: number
      water_current: number
      electric_previous?: number
      water_previous?: number
    }>
  }

  if (!period_month || !readings?.length) {
    return NextResponse.json({ error: 'Thiếu dữ liệu' }, { status: 400 })
  }

  const results = []

  for (const row of readings) {
    const { data: existing } = await supabase
      .from('meter_readings')
      .select('id')
      .eq('room_id', row.room_id)
      .eq('period_month', period_month)
      .maybeSingle()

    const payload = {
      user_id: user!.id,
      room_id: row.room_id,
      period_month,
      electric_previous: row.electric_previous ?? 0,
      electric_current: row.electric_current,
      water_previous: row.water_previous ?? 0,
      water_current: row.water_current,
    }

    if (existing) {
      const { data, error } = await supabase
        .from('meter_readings')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      results.push(data)
    } else {
      const { data, error } = await supabase
        .from('meter_readings')
        .insert(payload)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      results.push(data)
    }
  }

  return NextResponse.json({ saved: results.length, readings: results })
}
