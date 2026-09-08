'use client'

import { useState } from 'react'
import { FileText, ChevronLeft, ChevronRight, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  const [correctionBill, setCorrectionBill] = useState<InvoiceWithDetails | null>(null)
  const [correctionReason, setCorrectionReason] = useState('')
  const [correctionForm, setCorrectionForm] = useState({ rent: 0, electric: 0, water: 0, other: 0 })
  const [correcting, setCorrecting] = useState(false)
  const [generating, setGenerating] = useState(false)

  const { data: bills, loading, refetch } = useFetch<InvoiceWithDetails[]>(
    `/api/invoices?period=${periodMonth}`,
    [periodMonth]
  )

  const monthBills = bills ?? []
  const totalAmount = monthBills
    .filter((b) => b.payment_status !== 'void')
    .reduce((sum, b) => sum + b.total_amount, 0)
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

  const handleVoid = async (invoiceId: string) => {
    const reason = window.prompt('Lý do hủy hóa đơn')
    if (!reason?.trim()) return

    try {
      await apiPost(`/api/invoices/${invoiceId}/void`, { reason })
      await refetch()
      toast.success('Đã hủy hóa đơn')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không thể hủy hóa đơn')
    }
  }

  const openCorrection = (bill: InvoiceWithDetails) => {
    setCorrectionBill(bill)
    setCorrectionReason('')
    setCorrectionForm({ rent: bill.rent_amount, electric: bill.electric_cost, water: bill.water_cost, other: bill.other_fees })
  }

  const handleCorrection = async () => {
    if (!correctionBill || !correctionReason.trim()) return
    const total = correctionForm.rent + correctionForm.electric + correctionForm.water + correctionForm.other
    const lines = [
      { line_type: 'rent', description: 'Tiền thuê phòng', quantity: 1, unit_price: correctionForm.rent, amount: correctionForm.rent },
      { line_type: 'electricity', description: `Tiền điện (${correctionBill.electric_usage} kWh)`, quantity: correctionBill.electric_usage, unit_price: correctionBill.electric_usage ? Math.round(correctionForm.electric / correctionBill.electric_usage) : 0, amount: correctionForm.electric },
      { line_type: 'water', description: `Tiền nước (${correctionBill.water_usage} m³)`, quantity: correctionBill.water_usage, unit_price: correctionBill.water_usage ? Math.round(correctionForm.water / correctionBill.water_usage) : 0, amount: correctionForm.water },
      { line_type: 'garbage', description: 'Tiền rác', quantity: 1, unit_price: correctionForm.other, amount: correctionForm.other },
    ]
    setCorrecting(true)
    try {
      await apiPost(`/api/invoices/${correctionBill.id}/correct`, {
        reason: correctionReason,
        invoice: {
          room_id: correctionBill.room_id,
          contract_id: correctionBill.contract_id,
          period_month: correctionBill.period_month,
          rent_amount: correctionForm.rent,
          electric_usage: correctionBill.electric_usage,
          electric_cost: correctionForm.electric,
          water_usage: correctionBill.water_usage,
          water_cost: correctionForm.water,
          other_fees: correctionForm.other,
          total_amount: total,
          due_date: correctionBill.due_date,
        },
        lines,
      })
      setCorrectionBill(null)
      await refetch()
      toast.success('Đã điều chỉnh hóa đơn')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không thể điều chỉnh hóa đơn')
    } finally {
      setCorrecting(false)
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
                    {bill.payment_status === 'unpaid' && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2" onClick={(event) => { event.stopPropagation(); openCorrection(bill) }}>
                          Điều chỉnh
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={(event) => { event.stopPropagation(); handleVoid(bill.id) }}>
                          <XCircle className="w-4 h-4" /> Hủy hóa đơn
                        </Button>
                      </div>
                    )}
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

      <Dialog open={correctionBill !== null} onOpenChange={(open) => !open && setCorrectionBill(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Điều chỉnh hóa đơn</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Invoice cũ sẽ được lưu ở trạng thái đã hủy.</p>
            {(['rent', 'electric', 'water', 'other'] as const).map((field) => (
              <div key={field}>
                <Label>{field === 'rent' ? 'Tiền thuê' : field === 'electric' ? 'Tiền điện' : field === 'water' ? 'Tiền nước' : 'Phí khác'}</Label>
                <Input className="mt-1" type="number" min="0" value={correctionForm[field]} onChange={(event) => setCorrectionForm({ ...correctionForm, [field]: Number(event.target.value) })} />
              </div>
            ))}
            <div><Label>Lý do</Label><Input className="mt-1" value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} /></div>
            <p className="text-sm font-semibold">Tổng mới: {formatCurrency(correctionForm.rent + correctionForm.electric + correctionForm.water + correctionForm.other)}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectionBill(null)}>Hủy</Button>
            <Button onClick={handleCorrection} disabled={correcting || !correctionReason.trim()}>Lưu điều chỉnh</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
