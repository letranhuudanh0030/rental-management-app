'use client'

import { Building2, Users, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  mockRooms, 
  mockBills, 
  mockTenants,
  formatCurrency,
  formatShortCurrency,
  getStatusColor,
  getStatusText
} from '@/lib/data'

interface DashboardProps {
  onNavigate: (tab: 'rooms' | 'meters' | 'bills' | 'payments') => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const occupiedRooms = mockRooms.filter(r => r.status === 'occupied').length
  const totalRooms = mockRooms.length
  const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100)
  
  const pendingBills = mockBills.filter(b => b.status === 'pending')
  const overdueBills = mockBills.filter(b => b.status === 'overdue')
  const totalPending = pendingBills.reduce((sum, b) => sum + b.total, 0)
  const totalOverdue = overdueBills.reduce((sum, b) => sum + b.total, 0)
  
  const thisMonthRevenue = mockBills
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + b.total, 0)

  const currentMonth = new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })

  return (
    <div className="pb-6">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 pt-4 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-foreground/80 text-sm">Xin chào,</p>
            <h1 className="text-xl font-bold">Chủ nhà trọ</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <span className="text-lg font-bold">CN</span>
          </div>
        </div>
        
        {/* Revenue Card */}
        <Card className="bg-primary-foreground/10 border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/70 text-sm mb-1">Doanh thu {currentMonth}</p>
                <p className="text-2xl font-bold text-primary-foreground">{formatCurrency(thisMonthRevenue)}</p>
              </div>
              <div className="flex items-center gap-1 text-primary-foreground/80">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+12%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </header>

      {/* Quick Stats */}
      <div className="px-4 -mt-4 grid grid-cols-2 gap-3">
        <Card 
          className="cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => onNavigate('rooms')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{occupiedRooms}/{totalRooms}</p>
                <p className="text-xs text-muted-foreground">Phòng đang thuê</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => onNavigate('rooms')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockTenants.length}</p>
                <p className="text-xs text-muted-foreground">Khách thuê</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy */}
      <div className="px-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Tỷ lệ lấp đầy</span>
              <span className="text-lg font-bold text-primary">{occupancyRate}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{occupiedRooms} đang thuê</span>
              <span>{totalRooms - occupiedRooms} trống/bảo trì</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(overdueBills.length > 0 || pendingBills.length > 0) && (
        <div className="px-4 mt-4 space-y-3">
          {overdueBills.length > 0 && (
            <Card 
              className="border-destructive/30 bg-destructive/5 cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => onNavigate('payments')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-destructive">{overdueBills.length} hóa đơn quá hạn</p>
                    <p className="text-sm text-muted-foreground">Tổng: {formatCurrency(totalOverdue)}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )}

          {pendingBills.length > 0 && (
            <Card 
              className="cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => onNavigate('payments')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center">
                    <span className="text-lg font-bold text-accent-foreground">{pendingBills.length}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Chờ thu tiền</p>
                    <p className="text-sm text-muted-foreground">Tổng: {formatCurrency(totalPending)}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Bills */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Hóa đơn gần đây</h2>
          <button 
            onClick={() => onNavigate('bills')}
            className="text-sm text-primary font-medium"
          >
            Xem tất cả
          </button>
        </div>
        
        <div className="space-y-2">
          {mockBills.slice(0, 4).map((bill) => {
            const room = mockRooms.find(r => r.id === bill.roomId)
            const tenant = mockTenants.find(t => t.roomId === bill.roomId)
            return (
              <Card key={bill.id} className="cursor-pointer active:scale-[0.99] transition-transform">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <span className="font-bold text-sm">{room?.name}</span>
                      </div>
                      <div>
                        <p className="font-medium">{tenant?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatShortCurrency(bill.total)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                      {getStatusText(bill.status)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
