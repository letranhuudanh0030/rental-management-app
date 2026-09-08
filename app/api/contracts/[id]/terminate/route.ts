import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'
import { terminateContractSchema } from '@/lib/validation/contracts'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse
  const { id } = await params
  const parsed = terminateContractSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' }, { status: 400 })
  }
  const { data, error } = await supabase.rpc('terminate_contract', {
    p_contract_id: id,
    p_termination_date: parsed.data.termination_date,
    p_termination_reason: parsed.data.termination_reason,
    p_notice_date: parsed.data.notice_date ?? null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 409 })
  return NextResponse.json(data)
}
