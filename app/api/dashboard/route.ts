import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api/auth'
import { enrichInvoices } from '@/lib/services/invoices'
import type { DashboardSummary } from '@/lib/types/database'

export async function GET() {
  const { supabase, user, errorResponse } = await requireUser()
  if (errorResponse) return errorResponse

  const now = new Date()
  const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [
    { data: settings },
    { data: totals },
    { data: invoices },
  ] = await Promise.all([
    supabase
      .from('landlord_settings')
      .select('*')
      .eq('user_id', user!.id)
      .single(),
    supabase.rpc('get_dashboard_totals', { p_period_month: periodMonth }),
    supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const dashboardTotals = (totals ?? {}) as Record<string, number>
  const totalRooms = dashboardTotals.total_rooms ?? 0
  const occupiedRooms = dashboardTotals.occupied_rooms ?? 0
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

  const recent = settings
    ? await enrichInvoices(supabase, (invoices ?? []).slice(0, 6), settings)
    : []

  const summary: DashboardSummary = {
    property_name: settings?.property_name ?? 'Nhà trọ',
    occupied_rooms: occupiedRooms,
    total_rooms: totalRooms,
    tenant_count: dashboardTotals.tenant_count ?? 0,
    occupancy_rate: occupancyRate,
    month_revenue: dashboardTotals.month_revenue ?? 0,
    unpaid_count: dashboardTotals.unpaid_count ?? 0,
    unpaid_total: dashboardTotals.unpaid_total ?? 0,
    overdue_count: dashboardTotals.overdue_count ?? 0,
    overdue_total: dashboardTotals.overdue_total ?? 0,
    recent_invoices: recent,
  }

  return NextResponse.json(summary)
}
