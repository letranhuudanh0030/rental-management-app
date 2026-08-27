import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'
import { renewContractSchema } from '@/lib/validation/contracts'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse
  const { id } = await params
  const parsed = renewContractSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' }, { status: 400 })
  }
  const { data, error } = await supabase.rpc('renew_contract', {
    p_contract_id: id,
    p_start_date: parsed.data.start_date,
    p_end_date: parsed.data.end_date ?? null,
    p_monthly_rent: parsed.data.monthly_rent,
    p_deposit: parsed.data.deposit,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 409 })
  return NextResponse.json(data, { status: 201 })
}
