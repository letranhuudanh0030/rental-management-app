import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'
import { correctInvoiceSchema, getInvoiceValidationMessage } from '@/lib/validation/invoices'

type Context = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Context) {
  const { supabase, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const body = await request.json().catch(() => null)
  const parsed = correctInvoiceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: getInvoiceValidationMessage(parsed.error) }, { status: 400 })
  }

  const { id } = await params
  const { invoice, lines, reason } = parsed.data
  const { data, error } = await supabase.rpc('correct_invoice', {
    p_invoice_id: id,
    p_invoice: invoice,
    p_lines: lines,
    p_reason: reason,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 409 })
  return NextResponse.json(data, { status: 201 })
}
