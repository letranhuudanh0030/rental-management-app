import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'

export async function GET() {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('user_id', user!.id)
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
