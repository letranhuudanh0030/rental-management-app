import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'
import { createContractSchema, contractStatusSchema } from '@/lib/validation/contracts'

export async function GET(request: Request) {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const { searchParams } = new URL(request.url)
  const roomId = searchParams.get('room_id')
  const tenantId = searchParams.get('tenant_id')
  const statusParam = searchParams.get('status')
  const includeHistory = searchParams.get('include_history') === 'true'
  const status = statusParam ? contractStatusSchema.safeParse(statusParam) : null
  if (status?.success === false) {
    return NextResponse.json({ error: 'Trạng thái hợp đồng không hợp lệ' }, { status: 400 })
  }

  let query = supabase
    .from('contracts')
    .select('*, rooms(id, name, floor), tenants(id, name, phone)')
    .eq('user_id', user!.id)
    .order('start_date', { ascending: false })
  if (roomId) query = query.eq('room_id', roomId)
  if (tenantId) query = query.eq('tenant_id', tenantId)
  if (status?.success) query = query.eq('status', status.data)
  else if (!includeHistory) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const { supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const parsed = createContractSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('create_contract', {
    p_room_id: parsed.data.room_id,
    p_tenant_id: parsed.data.tenant_id,
    p_start_date: parsed.data.start_date,
    p_end_date: parsed.data.end_date ?? null,
    p_monthly_rent: parsed.data.monthly_rent,
    p_deposit: parsed.data.deposit,
    p_status: parsed.data.status,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 409 })
  return NextResponse.json(data, { status: 201 })
}
