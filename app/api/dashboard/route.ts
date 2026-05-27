import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'
import { enrichInvoices } from '@/lib/services/invoices'
import { getInvoiceDisplayStatus, isPaidStatus } from '@/lib/utils/format'
import type { DashboardSummary } from '@/lib/types/database'

export async function GET() {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const now = new Date()
  const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [
    { data: settings },
    { data: rooms },
    { count: tenantCount },
    { data: invoices },
  ] = await Promise.all([
    supabase
      .from('landlord_settings')
      .select('property_name')
      .eq('user_id', user!.id)
      .single(),
    supabase.from('rooms').select('id, status').eq('user_id', user!.id),
    supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id),
    supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const totalRooms = rooms?.length ?? 0
  const occupiedRooms = rooms?.filter((r) => r.status === 'occupied').length ?? 0
  const occupancyRate =
    totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

  const monthInvoices = (invoices ?? []).filter((i) =>
    i.period_month.startsWith(periodMonth.slice(0, 7))
  )

  const monthRevenue = monthInvoices
    .filter((i) => isPaidStatus(i.payment_status))
    .reduce((sum, i) => sum + i.total_amount, 0)

  let unpaidCount = 0
  let unpaidTotal = 0
  let overdueCount = 0
  let overdueTotal = 0

  for (const inv of invoices ?? []) {
    if (isPaidStatus(inv.payment_status)) continue
    const display = getInvoiceDisplayStatus(inv.payment_status, inv.due_date)
    if (display === 'overdue') {
      overdueCount++
      overdueTotal += inv.total_amount
    } else {
      unpaidCount++
      unpaidTotal += inv.total_amount
    }
  }

  const recent = await enrichInvoices(supabase, (invoices ?? []).slice(0, 6))

  const summary: DashboardSummary = {
    property_name: settings?.property_name ?? 'Nhà trọ',
    occupied_rooms: occupiedRooms,
    total_rooms: totalRooms,
    tenant_count: tenantCount ?? 0,
    occupancy_rate: occupancyRate,
    month_revenue: monthRevenue,
    unpaid_count: unpaidCount,
    unpaid_total: unpaidTotal,
    overdue_count: overdueCount,
    overdue_total: overdueTotal,
    recent_invoices: recent,
  }

  return NextResponse.json(summary)
}
