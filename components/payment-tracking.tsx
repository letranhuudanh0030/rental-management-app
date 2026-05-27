'use client'

import { useState } from 'react'
import { Check, AlertTriangle, Clock, Phone, MessageCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  mockRooms, 
  mockTenants,
  mockBills,
  formatCurrency,
  getStatusColor,
  getStatusText,
  Bill
} from '@/lib/data'

type FilterStatus = 'all' | 'pending' | 'overdue' | 'paid'

export function PaymentTracking() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    bill: Bill | null
  }>({ isOpen: false, bill: null })

  const filteredBills = mockBills.filter(bill => {
    if (filterStatus === 'all') return true
    return bill.status === filterStatus
  })

  const pendingCount = mockBills.filter(b => b.status === 'pending').length
  const overdueCount = mockBills.filter(b => b.status === 'overdue').length
  const paidCount = mockBills.filter(b => b.status === 'paid').length

  const handleMarkPaid = (bill: Bill) => {
    setConfirmDialog({ isOpen: true, bill })
  }

  const confirmPayment = () => {
    // In real app, update the bill status
    console.log('Marking bill as paid:', confirmDialog.bill?.id)
    setConfirmDialog({ isOpen: false, bill: null })
  }

  const filterButtons: { id: FilterStatus; label: string; count: number; color?: string }[] = [
    { id: 'all', label: 'Tất cả', count: mockBills.length },
    { id: 'overdue', label: 'Quá hạn', count: overdueCount, color: 'text-destructive' },
    { id: 'pending', label: 'Chờ thu', count: pendingCount, color: 'text-accent-foreground' },
    { id: 'paid', label: 'Đã thu', count: paidCount, color: 'text-primary' },
  ]

  return (
    <div className="pb-6">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold mb-4">Thu tiền</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterStatus(btn.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                filterStatus === btn.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {btn.label}
              <span className={`${filterStatus === btn.id ? 'bg-primary-foreground/20' : 'bg-foreground/10'} px-2 py-0.5 rounded-full text-xs`}>
                {btn.count}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Quick Stats */}
      <div className="px-4 py-3 grid grid-cols-3 gap-3">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 text-center">
            <AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-lg font-bold text-destructive">{overdueCount}</p>
            <p className="text-xs text-muted-foreground">Quá hạn</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/20">
          <CardContent className="p-3 text-center">
            <Clock className="w-5 h-5 text-accent-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Chờ thu</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/10">
          <CardContent className="p-3 text-center">
            <Check className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-primary">{paidCount}</p>
            <p className="text-xs text-muted-foreground">Đã thu</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment List */}
      <div className="px-4 space-y-2">
        {filteredBills.map((bill) => {
          const room = mockRooms.find(r => r.id === bill.roomId)
          const tenant = mockTenants.find(t => t.roomId === bill.roomId)

          return (
            <Card 
              key={bill.id} 
              className={`${bill.status === 'overdue' ? 'border-destructive/30' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      bill.status === 'overdue' ? 'bg-destructive/10' : 
                      bill.status === 'pending' ? 'bg-accent/20' : 'bg-primary/10'
                    }`}>
                      <span className="font-bold">{room?.name}</span>
                    </div>
                    <div>
                      <p className="font-medium">{tenant?.name}</p>
                      <p className="text-xs text-muted-foreground">{tenant?.phone}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bill.status)}`}>
                    {getStatusText(bill.status)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Số tiền</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(bill.total)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Hạn thanh toán</p>
                    <p className={`font-medium ${bill.status === 'overdue' ? 'text-destructive' : ''}`}>
                      {new Date(bill.dueDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {bill.status !== 'paid' && (
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-2"
                      onClick={() => window.open(`tel:${tenant?.phone}`)}
                    >
                      <Phone className="w-4 h-4" />
                      Gọi điện
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-2"
                      onClick={() => window.open(`https://zalo.me/${tenant?.phone}`)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Zalo
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 gap-2"
                      onClick={() => handleMarkPaid(bill)}
                    >
                      <Check className="w-4 h-4" />
                      Đã thu
                    </Button>
                  </div>
                )}

                {bill.paidAt && (
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    Đã thanh toán ngày {new Date(bill.paidAt).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredBills.length === 0 && (
        <div className="px-4 py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {filterStatus === 'overdue' && 'Không có hóa đơn quá hạn'}
            {filterStatus === 'pending' && 'Không có hóa đơn chờ thu'}
            {filterStatus === 'paid' && 'Chưa có hóa đơn đã thu'}
            {filterStatus === 'all' && 'Chưa có hóa đơn'}
          </p>
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog({ isOpen: open, bill: confirmDialog.bill })}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Xác nhận thanh toán</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground mb-2">
              Xác nhận đã nhận tiền từ phòng
            </p>
            <p className="text-center text-2xl font-bold">
              {mockRooms.find(r => r.id === confirmDialog.bill?.roomId)?.name}
            </p>
            <p className="text-center text-lg font-semibold text-primary mt-2">
              {confirmDialog.bill && formatCurrency(confirmDialog.bill.total)}
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setConfirmDialog({ isOpen: false, bill: null })}
            >
              Hủy
            </Button>
            <Button 
              className="flex-1"
              onClick={confirmPayment}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
