import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'

export async function GET() {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('*')
    .eq('user_id', user!.id)
    .order('name')

  if (tenantsError) {
    return NextResponse.json({ error: tenantsError.message }, { status: 500 })
  }

  const { data: contracts } = await supabase
    .from('contracts')
    .select('tenant_id, room_id, is_active, rooms(name)')
    .eq('user_id', user!.id)
    .eq('is_active', true)

  const enriched =
    tenants?.map((tenant) => ({
      ...tenant,
      contracts: (contracts ?? []).filter((c) => c.tenant_id === tenant.id),
    })) ?? []

  return NextResponse.json(enriched)
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

export async function PATCH(request: Request) {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const body = await request.json()
  const {
    tenant_id,
    name,
    phone,
    id_number,
    notes,
    room_id,
  }: {
    tenant_id: string
    name?: string
    phone?: string
    id_number?: string | null
    notes?: string | null
    /** optional. Use null to unassign room */
    room_id?: string | null
  } = body

  if (!tenant_id) {
    return NextResponse.json({ error: 'Thiếu tenant_id' }, { status: 400 })
  }

  if (!name || !phone) {
    return NextResponse.json(
      { error: 'Nhập tên và SĐT' },
      { status: 400 }
    )
  }

  // 1) Update tenant basic info
  const { data: updatedTenant, error: tenantError } = await supabase
    .from('tenants')
    .update({
      name,
      phone,
      id_number: id_number ?? null,
      notes: notes ?? null,
    })
    .eq('id', tenant_id)
    .eq('user_id', user!.id)
    .select()
    .single()

  if (tenantError) {
    return NextResponse.json({ error: tenantError.message }, { status: 500 })
  }

  // 2) Optional room assignment update (contracts + room status)
  if (room_id !== undefined) {
    const { data: activeContracts, error: activeContractsError } =
      await supabase
        .from('contracts')
        .select('id, room_id')
        .eq('user_id', user!.id)
        .eq('tenant_id', tenant_id)
        .eq('is_active', true)

    if (activeContractsError) {
      return NextResponse.json(
        { error: activeContractsError.message },
        { status: 500 }
      )
    }

    const currentRoomId = activeContracts?.[0]?.room_id ?? null
    const nextRoomId = room_id ? room_id : null

    // Unassign: tenant no longer occupies any room
    if (!nextRoomId) {
      if (currentRoomId) {
        await supabase
          .from('contracts')
          .update({ is_active: false })
          .eq('user_id', user!.id)
          .eq('tenant_id', tenant_id)
          .eq('is_active', true)

        await supabase
          .from('rooms')
          .update({ status: 'vacant' })
          .eq('user_id', user!.id)
          .eq('id', currentRoomId)
          .eq('status', 'occupied')
      }

      return NextResponse.json({ tenant: updatedTenant })
    }

    // No-op if same room
    if (currentRoomId && currentRoomId === nextRoomId) {
      return NextResponse.json({ tenant: updatedTenant })
    }

    // Deactivate any active contract for the target room (avoid 2 active contracts)
    await supabase
      .from('contracts')
      .update({ is_active: false })
      .eq('user_id', user!.id)
      .eq('room_id', nextRoomId)
      .eq('is_active', true)

    // Deactivate active contract(s) for this tenant
    await supabase
      .from('contracts')
      .update({ is_active: false })
      .eq('user_id', user!.id)
      .eq('tenant_id', tenant_id)
      .eq('is_active', true)

    const { data: room } = await supabase
      .from('rooms')
      .select('base_rent')
      .eq('id', nextRoomId)
      .eq('user_id', user!.id)
      .single()

    if (!room) {
      return NextResponse.json({ error: 'Không tìm thấy phòng' }, { status: 404 })
    }

    const startDate = new Date().toISOString().slice(0, 10)

    await supabase.from('contracts').insert({
      user_id: user!.id,
      room_id: nextRoomId,
      tenant_id,
      start_date: startDate,
      monthly_rent: room.base_rent,
      deposit: 0,
      is_active: true,
    })

    await supabase
      .from('rooms')
      .update({ status: 'occupied' })
      .eq('user_id', user!.id)
      .eq('id', nextRoomId)

    if (currentRoomId) {
      await supabase
        .from('rooms')
        .update({ status: 'vacant' })
        .eq('user_id', user!.id)
        .eq('id', currentRoomId)
        .eq('status', 'occupied')
    }
  }

  return NextResponse.json({ tenant: updatedTenant })
}

export async function DELETE(request: Request) {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const body = await request.json()
  const { tenant_id }: { tenant_id: string } = body

  if (!tenant_id) {
    return NextResponse.json({ error: 'Thiếu tenant_id' }, { status: 400 })
  }

  // Find the rooms to restore (before deleting contracts)
  const { data: activeContracts } = await supabase
    .from('contracts')
    .select('room_id')
    .eq('user_id', user!.id)
    .eq('tenant_id', tenant_id)
    .eq('is_active', true)

  const roomIds = [...new Set((activeContracts ?? []).map((c) => c.room_id))]

  // Remove contracts first (tenant has delete restrict constraint)
  const { error: deleteContractsError } = await supabase
    .from('contracts')
    .delete()
    .eq('user_id', user!.id)
    .eq('tenant_id', tenant_id)

  if (deleteContractsError) {
    return NextResponse.json(
      { error: deleteContractsError.message },
      { status: 500 }
    )
  }

  const { error: deleteTenantError } = await supabase
    .from('tenants')
    .delete()
    .eq('user_id', user!.id)
    .eq('id', tenant_id)

  if (deleteTenantError) {
    return NextResponse.json(
      { error: deleteTenantError.message },
      { status: 500 }
    )
  }

  if (roomIds.length) {
    await supabase
      .from('rooms')
      .update({ status: 'vacant' })
      .eq('user_id', user!.id)
      .in('id', roomIds)
      .eq('status', 'occupied')
  }

  return NextResponse.json({ deleted: true })
}
