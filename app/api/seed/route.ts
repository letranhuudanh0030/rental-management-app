import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'
import { seedDemoData } from '@/lib/seed/demo-data'

export async function POST() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEED) {
    return NextResponse.json({ error: 'Seed disabled in production' }, { status: 403 })
  }

  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  try {
    const result = await seedDemoData(supabase, user!.id)
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Seed failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
