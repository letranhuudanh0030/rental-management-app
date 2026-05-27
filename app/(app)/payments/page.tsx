'use client'

import { Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, AlertTriangle, Clock, Phone, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useFetch, apiPost } from '@/hooks/use-fetch'
import type { InvoiceWithDetails } from '@/lib/types/database'
import {
  formatCurrency,
  getPaymentStatusColor,
  getPaymentStatusText,
  isPaidStatus,
} from '@/lib/utils/format'
import Link from 'next/link'

type FilterStatus = 'all' | 'unpaid' | 'overdue' | 'paid'

function PaymentsContent() {
  const searchParams = useSearchParams()
  const initialFilter = (searchParams.get('filter') as FilterStatus) ?? 'all'

  const { data: bills, loading, refetch } = useFetch<InvoiceWithDetails[]>('/api/invoices')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(initialFilter)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    bill: InvoiceWithDetails | null
    method: 'cash' | 'transfer'
  }>({ isOpen: false, bill: null, method: 'cash' })

  const filteredBills = useMemo(() => {
    return (bills ?? []).filter((bill) => {
      if (filterStatus === 'all') return true
      if (filterStatus === 'paid') return isPaidStatus(bill.payment_status)
      if (filterStatus === 'overdue') return bill.display_status === 'overdue'
      if (filterStatus === 'unpaid')
        return bill.display_status === 'unpaid' || bill.display_status === 'overdue'
      return true
    })
  }, [bills, filterStatus])

  const counts = useMemo(() => {
    const all = bills ?? []
    return {
      all: all.length,
      overdue: all.filter((b) => b.display_status === 'overdue').length,
      unpaid: all.filter((b) => !isPaidStatus(b.payment_status)).length,
      paid: all.filter((b) => isPaidStatus(b.payment_status)).length,
    }
  }, [bills])

  const confirmPayment = async () => {
    if (!confirmDialog.bill) return
    try {
      await apiPost('/api/payments', {
        invoice_id: confirmDialog.bill.id,
        method: confirmDialog.method,
        amount: confirmDialog.bill.total_amount,
      })
      toast.success('Đã ghi nhận thanh toán')
      setConfirmDialog({ isOpen: false, bill: null, method: 'cash' })
      refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi')
    }
  }

  const filterButtons: { id: FilterStatus; label: string; count: number }[] = [
    { id: 'all', label: 'Tất cả', count: counts.all },
    { id: 'overdue', label: 'Quá hạn', count: counts.overdue },
    { id: 'unpaid', label: 'Chưa thu', count: counts.unpaid },
    { id: 'paid', label: 'Đã thu', count: counts.paid },
  ]

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-10" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-10 bg-background px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold mb-4">Thu tiền</h1>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFilterStatus(btn.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-2 ${
                filterStatus === btn.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {btn.label}
              <span className="px-2 py-0.5 rounded-full text-xs bg-foreground/10">
                {btn.count}
              </span>
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-3 grid grid-cols-3 gap-3">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 text-center">
            <AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-lg font-bold text-destructive">{counts.overdue}</p>
            <p className="text-xs text-muted-foreground">Quá hạn</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-3 text-center">
            <Clock className="w-5 h-5 text-amber-700 mx-auto mb-1" />
            <p className="text-lg font-bold">{counts.unpaid}</p>
            <p className="text-xs text-muted-foreground">Chưa thu</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/10">
          <CardContent className="p-3 text-center">
            <Check className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-primary">{counts.paid}</p>
            <p className="text-xs text-muted-foreground">Đã thu</p>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 space-y-2">
        {filteredBills.map((bill) => (
          <Card
            key={bill.id}
            className={bill.display_status === 'overdue' ? 'border-destructive/30' : ''}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <span className="font-bold">{bill.room?.name}</span>
                  </div>
                  <div>
                    <p className="font-medium">{bill.tenant?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{bill.tenant?.phone}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(bill.display_status)}`}
                >
                  {getPaymentStatusText(bill.display_status)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Số tiền</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(bill.total_amount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Hạn</p>
                  <p
                    className={`font-medium ${bill.display_status === 'overdue' ? 'text-destructive' : ''}`}
                  >
                    {new Date(bill.due_date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
              {!isPaidStatus(bill.payment_status) && (
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-11"
                      onClick={() => window.open(`tel:${bill.tenant?.phone}`)}
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Gọi
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-11"
                      onClick={() =>
                        window.open(`https://zalo.me/${bill.tenant?.phone?.replace(/^0/, '84')}`)
                      }
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Zalo
                    </Button>
                    <Link href={`/reminders?invoice=${bill.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full h-11">
                        Nhắc
                      </Button>
                    </Link>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 h-11"
                      onClick={() =>
                        setConfirmDialog({ isOpen: true, bill, method: 'cash' })
                      }
                    >
                      Tiền mặt
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 h-11"
                      onClick={() =>
                        setConfirmDialog({ isOpen: true, bill, method: 'transfer' })
                      }
                    >
                      Chuyển khoản
                    </Button>
                  </div>
                </div>
              )}
              {bill.paid_at && (
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Đã thanh toán: {new Date(bill.paid_at).toLocaleDateString('vi-VN')}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          setConfirmDialog({ isOpen: open, bill: confirmDialog.bill, method: confirmDialog.method })
        }
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận thanh toán</DialogTitle>
          </DialogHeader>
          <p className="text-center text-muted-foreground">
            Phòng {confirmDialog.bill?.room?.name} —{' '}
            {confirmDialog.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
          </p>
          <p className="text-center text-2xl font-bold text-primary">
            {confirmDialog.bill && formatCurrency(confirmDialog.bill.total_amount)}
          </p>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={() =>
                setConfirmDialog({ isOpen: false, bill: null, method: 'cash' })
              }
            >
              Hủy
            </Button>
            <Button className="flex-1 h-11" onClick={confirmPayment}>
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="p-4">Đang tải...</div>}>
      <PaymentsContent />
    </Suspense>
  )
}
