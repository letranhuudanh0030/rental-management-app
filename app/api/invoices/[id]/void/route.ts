import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'

type Context = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Context) {
  const { supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const body = await request.json().catch(() => null)
  const reason = typeof body?.reason === 'string' ? body.reason : ''
  if (!reason.trim()) return NextResponse.json({ error: 'Cần nhập lý do hủy hóa đơn' }, { status: 400 })

  const { id } = await params
  const { data, error } = await supabase.rpc('void_invoice', { p_invoice_id: id, p_reason: reason })
  if (error) return NextResponse.json({ error: error.message }, { status: 409 })
  return NextResponse.json(data)
}
