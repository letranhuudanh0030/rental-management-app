'use client'

import { useMemo, useState } from 'react'
import { BarChart3, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFetch } from '@/hooks/use-fetch'
import { currentPeriodMonth, formatCurrency, formatMonthLabel, shiftPeriodMonth } from '@/lib/utils/format'

type RevenueRow = { period_month: string; invoice_count: number; revenue: number }
type RevenueResponse = { data: RevenueRow[] }
type OutstandingRow = { total_amount: number; debt_status: 'unpaid' | 'overdue' }
type OutstandingResponse = { data: OutstandingRow[] }
type OccupancyResponse = {
  total_rooms?: number
  occupied_rooms?: number
  vacant_rooms?: number
  maintenance_rooms?: number
}

export default function ReportsPage() {
  const currentMonth = currentPeriodMonth()
  const [toMonth, setToMonth] = useState(currentMonth)
  const [fromMonth, setFromMonth] = useState(shiftPeriodMonth(currentMonth, -5))
  const revenueUrl = `/api/reports/revenue?from=${fromMonth}&to=${toMonth}`
  const { data: revenue, loading: revenueLoading } = useFetch<RevenueResponse>(revenueUrl, [fromMonth, toMonth])
  const { data: outstanding, loading: outstandingLoading } = useFetch<OutstandingResponse>('/api/reports/outstanding')
  const { data: occupancy, loading: occupancyLoading } = useFetch<OccupancyResponse>('/api/reports/occupancy')

  const revenueTotal = useMemo(
    () => (revenue?.data ?? []).reduce((sum, row) => sum + Number(row.revenue), 0),
    [revenue]
  )
  const debtTotal = useMemo(
    () => (outstanding?.data ?? []).reduce((sum, row) => sum + Number(row.total_amount), 0),
    [outstanding]
  )
  const overdueTotal = useMemo(
    () => (outstanding?.data ?? [])
      .filter((row) => row.debt_status === 'overdue')
      .reduce((sum, row) => sum + Number(row.total_amount), 0),
    [outstanding]
  )
  const occupancyRate = occupancy?.total_rooms
    ? Math.round(((occupancy.occupied_rooms ?? 0) / occupancy.total_rooms) * 100)
    : 0
  const loading = revenueLoading || outstandingLoading || occupancyLoading

  return (
    <div className="pb-6">
      <header className="px-4 pt-4 pb-3 border-b">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">Báo cáo</h1>
        </div>
        <div className="flex items-center justify-between gap-2 mt-4">
          <Button variant="outline" size="icon" onClick={() => setFromMonth(shiftPeriodMonth(fromMonth, -1))} aria-label="Kỳ trước">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-center">{formatMonthLabel(fromMonth)} - {formatMonthLabel(toMonth)}</span>
          <Button variant="outline" size="icon" onClick={() => setToMonth(shiftPeriodMonth(toMonth, 1))} aria-label="Kỳ sau">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {loading && <div className="px-4 pt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải báo cáo...</div>}

      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Doanh thu kỳ chọn</p><p className="text-xl font-bold text-primary mt-1">{formatCurrency(revenueTotal)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Tổng công nợ</p><p className="text-xl font-bold mt-1">{formatCurrency(debtTotal)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Nợ quá hạn</p><p className="text-xl font-bold text-destructive mt-1">{formatCurrency(overdueTotal)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Tỷ lệ lấp đầy</p><p className="text-xl font-bold mt-1">{occupancyRate}%</p><p className="text-xs text-muted-foreground">{occupancy?.occupied_rooms ?? 0}/{occupancy?.total_rooms ?? 0} phòng</p></CardContent></Card>
      </div>

      <section className="px-4">
        <h2 className="font-semibold mb-2">Doanh thu theo tháng</h2>
        <Card><CardContent className="p-0 divide-y">
          {(revenue?.data ?? []).map((row) => (
            <div key={row.period_month} className="p-3 flex items-center justify-between">
              <div><p className="font-medium">{formatMonthLabel(row.period_month)}</p><p className="text-xs text-muted-foreground">{row.invoice_count} hóa đơn đã thu</p></div>
              <p className="font-semibold">{formatCurrency(Number(row.revenue))}</p>
            </div>
          ))}
          {!revenueLoading && revenue?.data.length === 0 && <p className="p-4 text-sm text-muted-foreground">Chưa có doanh thu trong khoảng này</p>}
        </CardContent></Card>
      </section>
    </div>
  )
}
