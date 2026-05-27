'use client'

import Link from 'next/link'
import { Building2, Users, AlertTriangle, TrendingUp, ArrowRight, Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useFetch } from '@/hooks/use-fetch'
import type { DashboardSummary } from '@/lib/types/database'
import {
  formatCurrency,
  formatShortCurrency,
  formatMonthLabel,
  getPaymentStatusColor,
  getPaymentStatusText,
} from '@/lib/utils/format'

export default function DashboardPage() {
  const { data, loading, error, refetch } = useFetch<DashboardSummary>('/api/dashboard')

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive mb-4">{error ?? 'Không tải được dữ liệu'}</p>
        <Button onClick={() => refetch()}>Thử lại</Button>
      </div>
    )
  }

  const currentMonth = formatMonthLabel(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
  )

  return (
    <div className="pb-6">
      <header className="bg-primary text-primary-foreground px-4 pt-4 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-foreground/80 text-sm">Xin chào,</p>
            <h1 className="text-xl font-bold">{data.property_name}</h1>
          </div>
          <Link href="/settings">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        <Card className="bg-primary-foreground/10 border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/70 text-sm mb-1">
                  Doanh thu {currentMonth}
                </p>
                <p className="text-2xl font-bold text-primary-foreground">
                  {formatCurrency(data.month_revenue)}
                </p>
              </div>
              <div className="flex items-center gap-1 text-primary-foreground/80">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">{data.occupancy_rate}% lấp</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </header>

      <div className="px-4 -mt-4 grid grid-cols-2 gap-3">
        <Link href="/rooms">
          <Card className="active:scale-[0.98] transition-transform">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {data.occupied_rooms}/{data.total_rooms}
                  </p>
                  <p className="text-xs text-muted-foreground">Phòng đang thuê</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tenants">
          <Card className="active:scale-[0.98] transition-transform">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.tenant_count}</p>
                  <p className="text-xs text-muted-foreground">Khách thuê</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="px-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Tỷ lệ lấp đầy</span>
              <span className="text-lg font-bold text-primary">{data.occupancy_rate}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${data.occupancy_rate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {(data.overdue_count > 0 || data.unpaid_count > 0) && (
        <div className="px-4 mt-4 space-y-3">
          {data.overdue_count > 0 && (
            <Link href="/payments?filter=overdue">
              <Card className="border-destructive/30 bg-destructive/5 active:scale-[0.98]">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-destructive">
                      {data.overdue_count} hóa đơn quá hạn
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tổng: {formatCurrency(data.overdue_total)}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )}
          {data.unpaid_count > 0 && (
            <Link href="/payments">
              <Card className="active:scale-[0.98]">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-amber-800">{data.unpaid_count}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Chờ thu tiền</p>
                    <p className="text-sm text-muted-foreground">
                      Tổng: {formatCurrency(data.unpaid_total)}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}

      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Hóa đơn gần đây</h2>
          <Link href="/bills" className="text-sm text-primary font-medium">
            Xem tất cả
          </Link>
        </div>
        <div className="space-y-2">
          {data.recent_invoices.map((bill) => (
            <Card key={bill.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <span className="font-bold text-sm">{bill.room?.name}</span>
                  </div>
                  <div>
                    <p className="font-medium">{bill.tenant?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatShortCurrency(bill.total_amount)}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(bill.display_status)}`}
                >
                  {getPaymentStatusText(bill.display_status)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 flex gap-2">
        <Link href="/meters" className="flex-1">
          <Button className="w-full h-12">Ghi điện nước</Button>
        </Link>
        <Link href="/bills" className="flex-1">
          <Button variant="outline" className="w-full h-12">
            Tạo hóa đơn
          </Button>
        </Link>
      </div>
    </div>
  )
}
