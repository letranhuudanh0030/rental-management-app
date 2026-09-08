import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'

export async function GET() {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('user_id', user!.id)
    .is('archived_at', null)
    .order('sort_order')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: contracts } = await supabase
    .from('contracts')
    .select('*, tenants(*)')
    .eq('user_id', user!.id)
    .eq('is_active', true)

  const enriched = rooms?.map((room) => {
    const contract = contracts?.find((c) => c.room_id === room.id)
    return {
      ...room,
      tenant: contract?.tenants ?? null,
      contract: contract
        ? {
            id: contract.id,
            monthly_rent: contract.monthly_rent,
            deposit: contract.deposit,
            start_date: contract.start_date,
          }
        : null,
    }
  })

  return NextResponse.json(enriched)
}

export async function POST(request: Request) {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const body = await request.json()
  const { name, floor, base_rent, status, notes } = body

  if (!name || base_rent == null) {
    return NextResponse.json({ error: 'Thiếu tên phòng hoặc giá thuê' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      user_id: user!.id,
      name,
      floor: floor ?? 1,
      base_rent,
      status: status ?? 'vacant',
      notes: notes ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const body = await request.json()
  const {
    room_id,
    name,
    floor,
    base_rent,
    status,
    notes,
    sort_order,
    tenant_id,
  }: {
    room_id: string
    name?: string
    floor?: number
    base_rent?: number
    status?: 'occupied' | 'vacant' | 'maintenance'
    notes?: string | null
    sort_order?: number
    /** null = bỏ gán khách; undefined = không đổi */
    tenant_id?: string | null
  } = body

  if (!room_id) {
    return NextResponse.json({ error: 'Thiếu room_id' }, { status: 400 })
  }

  const payload: Record<string, unknown> = {}
  if (name !== undefined) payload.name = name
  if (floor !== undefined) payload.floor = floor
  if (base_rent !== undefined) payload.base_rent = base_rent
  if (status !== undefined) payload.status = status
  if (notes !== undefined) payload.notes = notes
  if (sort_order !== undefined) payload.sort_order = sort_order

  if (Object.keys(payload).length === 0 && tenant_id === undefined) {
    return NextResponse.json({ error: 'Thiếu dữ liệu cập nhật' }, { status: 400 })
  }

  if (Object.keys(payload).length > 0) {
    const { error: updateError } = await supabase
      .from('rooms')
      .update(payload)
      .eq('user_id', user!.id)
      .eq('id', room_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  }

  if (tenant_id !== undefined) {
    const { data: room } = await supabase
      .from('rooms')
      .select('base_rent, status')
      .eq('user_id', user!.id)
      .eq('id', room_id)
      .single()

    if (!room) {
      return NextResponse.json({ error: 'Không tìm thấy phòng' }, { status: 404 })
    }

    const { data: currentContract } = await supabase
      .from('contracts')
      .select('id, tenant_id')
      .eq('user_id', user!.id)
      .eq('room_id', room_id)
      .eq('is_active', true)
      .maybeSingle()

    const currentTenantId = currentContract?.tenant_id ?? null
    const nextTenantId = tenant_id || null

    if (currentTenantId !== nextTenantId) {
      const { error: assignmentError } = await supabase.rpc('assign_tenant_to_room', {
        p_room_id: room_id,
        p_tenant_id: nextTenantId,
        p_start_date: new Date().toISOString().slice(0, 10),
        p_monthly_rent: room.base_rent,
        p_deposit: 0,
      })

      if (assignmentError) {
        const status = assignmentError.message === 'TENANT_NOT_FOUND' ? 404 : 409
        return NextResponse.json({ error: assignmentError.message }, { status })
      }
    }
  }

  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('user_id', user!.id)
    .eq('id', room_id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const body = await request.json()
  const { room_id }: { room_id: string } = body

  if (!room_id) {
    return NextResponse.json({ error: 'Thiếu room_id' }, { status: 400 })
  }

  const { count: historyCount, error: historyError } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('room_id', room_id)

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 })
  }

  if ((historyCount ?? 0) > 0) {
    const { data, error } = await supabase
      .from('rooms')
      .update({ archived_at: new Date().toISOString(), archived_by: user!.id, status: 'maintenance' })
      .eq('user_id', user!.id)
      .eq('id', room_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ archived: true, room: data })
  }

  const { data, error } = await supabase
    .from('rooms')
    .delete()
    .eq('user_id', user!.id)
    .eq('id', room_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true, room: data })
}
