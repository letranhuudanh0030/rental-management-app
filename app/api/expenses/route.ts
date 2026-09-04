import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'
import {
  createExpenseSchema,
  getExpenseValidationMessage,
} from '@/lib/validation/expenses'

export async function GET() {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user!.id)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const body = await request.json().catch(() => null)
  const parsed = createExpenseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: getExpenseValidationMessage(parsed.error) }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...parsed.data, user_id: user!.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
