'use client'

import { useState } from 'react'
import { FileText, ChevronLeft, ChevronRight, Zap, Droplets, Home } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  mockRooms, 
  mockTenants,
  mockBills,
  formatCurrency,
  getStatusColor,
  getStatusText
} from '@/lib/data'

export function BillingPage() {
  const [selectedMonth, setSelectedMonth] = useState('2026-04')
  const [selectedBill, setSelectedBill] = useState<string | null>(null)

  const monthBills = mockBills.filter(b => b.month === selectedMonth)
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const date = new Date(year, month - 1)
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1)
    } else {
      date.setMonth(date.getMonth() + 1)
    }
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }

  const monthDisplay = new Date(selectedMonth + '-01').toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric'
  })

  const totalAmount = monthBills.reduce((sum, b) => sum + b.total, 0)
  const paidAmount = monthBills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.total, 0)

  const selectedBillData = selectedBill ? mockBills.find(b => b.id === selectedBill) : null

  return (
    <div className="pb-6">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Hóa đơn</h1>
          <Button size="sm" className="gap-1">
            <FileText className="w-4 h-4" />
            Tạo HĐ
          </Button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-muted active:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-lg min-w-[150px] text-center">
            {monthDisplay}
          </span>
          <button 
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-muted active:bg-muted transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Summary */}
      <div className="px-4 py-4">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-primary-foreground/70 text-sm">Tổng hóa đơn</p>
                <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
              <div>
                <p className="text-primary-foreground/70 text-sm">Đã thu</p>
                <p className="text-xl font-bold">{formatCurrency(paidAmount)}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-foreground rounded-full transition-all"
                  style={{ width: `${totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-primary-foreground/70 mt-1 text-right">
                {Math.round(totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0)}% đã thu
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bill List */}
      <div className="px-4 space-y-2">
        {monthBills.map((bill) => {
          const room = mockRooms.find(r => r.id === bill.roomId)
          const tenant = mockTenants.find(t => t.roomId === bill.roomId)
          const isSelected = selectedBill === bill.id

          return (
            <Card 
              key={bill.id} 
              className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedBill(isSelected ? null : bill.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <span className="font-bold">{room?.name}</span>
                    </div>
                    <div>
                      <p className="font-medium">{tenant?.name}</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(bill.total)}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bill.status)}`}>
                    {getStatusText(bill.status)}
                  </span>
                </div>

                {/* Bill Details (expanded) */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Home className="w-4 h-4" />
                        Tiền phòng
                      </span>
                      <span className="font-medium">{formatCurrency(bill.baseRent)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Điện ({bill.electricUsage} kWh)
                      </span>
                      <span className="font-medium">{formatCurrency(bill.electricCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        Nước ({bill.waterUsage} m³)
                      </span>
                      <span className="font-medium">{formatCurrency(bill.waterCost)}</span>
                    </div>
                    {bill.otherFees > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Phí khác</span>
                        <span className="font-medium">{formatCurrency(bill.otherFees)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                      <span>Tổng cộng</span>
                      <span className="text-primary">{formatCurrency(bill.total)}</span>
                    </div>
                    
                    {bill.status !== 'paid' && (
                      <Button className="w-full mt-3">
                        Ghi nhận thanh toán
                      </Button>
                    )}
                    {bill.paidAt && (
                      <p className="text-xs text-center text-muted-foreground">
                        Đã thanh toán: {new Date(bill.paidAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {monthBills.length === 0 && (
        <div className="px-4 py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Chưa có hóa đơn trong tháng này</p>
          <Button className="mt-4">
            Tạo hóa đơn tháng {monthDisplay}
          </Button>
        </div>
      )}
    </div>
  )
}
