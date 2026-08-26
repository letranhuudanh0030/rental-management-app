import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const body = await request.json()

  const { data, error } = await supabase
    .from('rooms')
    .update(body)
    .eq('id', id)
    .eq('user_id', user!.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const { count: historyCount, error: historyError } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('room_id', id)

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 })
  }

  if ((historyCount ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Không thể xoá phòng đã có hóa đơn. Hãy chuyển sang bảo trì hoặc trống.' },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id)
    .eq('user_id', user!.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
