'use client'

import { useState } from 'react'
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useFetch, apiPost } from '@/hooks/use-fetch'
import type { InvoiceWithDetails } from '@/lib/types/database'
import {
  currentPeriodMonth,
  formatCurrency,
  formatMonthLabel,
  getPaymentStatusColor,
  getPaymentStatusText,
  isPaidStatus,
  shiftPeriodMonth,
} from '@/lib/utils/format'

export default function BillsPage() {
  const [periodMonth, setPeriodMonth] = useState(currentPeriodMonth())
  const [selectedBill, setSelectedBill] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const { data: bills, loading, refetch } = useFetch<InvoiceWithDetails[]>(
    `/api/invoices?period=${periodMonth}`,
    [periodMonth]
  )

  const monthBills = bills ?? []
  const totalAmount = monthBills.reduce((sum, b) => sum + b.total_amount, 0)
  const paidAmount = monthBills
    .filter((b) => isPaidStatus(b.payment_status))
    .reduce((sum, b) => sum + b.total_amount, 0)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const result = await apiPost<{ created: number; skipped: number }>(
        '/api/invoices/generate',
        { period_month: periodMonth }
      )
      toast.success(`Tạo ${result.created} hóa đơn (${result.skipped} đã có)`)
      refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-10 bg-background px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Hóa đơn</h1>
          <Button
            size="sm"
            className="gap-1 h-10"
            onClick={handleGenerate}
            disabled={generating}
          >
            <FileText className="w-4 h-4" />
            {generating ? 'Đang tạo...' : 'Tạo HĐ'}
          </Button>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPeriodMonth(shiftPeriodMonth(periodMonth, -1))}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-lg min-w-[150px] text-center">
            {formatMonthLabel(periodMonth)}
          </span>
          <button
            type="button"
            onClick={() => setPeriodMonth(shiftPeriodMonth(periodMonth, 1))}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="px-4 py-4">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-primary-foreground/70 text-sm">Tổng hóa đơn</p>
              <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
            <div>
              <p className="text-primary-foreground/70 text-sm">Đã thu</p>
              <p className="text-xl font-bold">{formatCurrency(paidAmount)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 space-y-2">
        {monthBills.map((bill) => {
          const isSelected = selectedBill === bill.id
          return (
            <Card
              key={bill.id}
              className={`cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedBill(isSelected ? null : bill.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <span className="font-bold">{bill.room?.name}</span>
                    </div>
                    <div>
                      <p className="font-medium">{bill.tenant?.name ?? '—'}</p>
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(bill.total_amount)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(bill.display_status)}`}
                  >
                    {getPaymentStatusText(bill.display_status)}
                  </span>
                </div>
                {isSelected && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    {(bill.lines?.length ? bill.lines : [
                      { line_type: 'rent', description: 'Tiền thuê phòng', quantity: 1, amount: bill.rent_amount },
                      { line_type: 'electricity', description: `Tiền điện (${bill.electric_usage} kWh)`, quantity: bill.electric_usage, amount: bill.electric_cost },
                      { line_type: 'water', description: `Tiền nước (${bill.water_usage} m³)`, quantity: bill.water_usage, amount: bill.water_cost },
                      { line_type: 'garbage', description: 'Tiền rác', quantity: 1, amount: bill.other_fees },
                    ]).map((line) => (
                      <div key={`${bill.id}-${line.line_type}`} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{line.description}</span>
                        <span>{formatCurrency(line.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Tổng cộng</span>
                      <span className="text-primary">{formatCurrency(bill.total_amount)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {monthBills.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">Chưa có hóa đơn tháng này</p>
          <Button className="h-12" onClick={handleGenerate} disabled={generating}>
            Tạo hóa đơn {formatMonthLabel(periodMonth)}
          </Button>
        </div>
      )}
    </div>
  )
}
