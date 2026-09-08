import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'

export async function GET() {
  const { supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const { data, error } = await supabase.rpc('get_occupancy_report')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? {})
}
