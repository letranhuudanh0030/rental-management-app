'use client'

import { useState } from 'react'
import { Plus, Search, User, Phone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  mockRooms, 
  mockTenants,
  formatCurrency,
  getRoomStatusColor,
  getRoomStatusText
} from '@/lib/data'

export function RoomList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)

  const floors = [...new Set(mockRooms.map(r => r.floor))].sort()
  
  const filteredRooms = mockRooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFloor = selectedFloor === null || room.floor === selectedFloor
    return matchesSearch && matchesFloor
  })

  return (
    <div className="pb-6">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Danh sách phòng</h1>
          <Button size="sm" className="gap-1">
            <Plus className="w-4 h-4" />
            Thêm
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm phòng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 text-base"
          />
        </div>

        {/* Floor Filter */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedFloor(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedFloor === null 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
          >
            Tất cả
          </button>
          {floors.map((floor) => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedFloor === floor 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              Tầng {floor}
            </button>
          ))}
        </div>
      </header>

      {/* Room Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {filteredRooms.map((room) => {
          const tenant = mockTenants.find(t => t.roomId === room.id)
          
          return (
            <Card 
              key={room.id} 
              className="cursor-pointer active:scale-[0.98] transition-transform overflow-hidden"
            >
              <CardContent className="p-0">
                {/* Room Header */}
                <div className={`px-3 py-2 ${getRoomStatusColor(room.status)}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-lg">{room.name}</span>
                    <span className="text-white/90 text-xs font-medium px-2 py-0.5 bg-white/20 rounded-full">
                      {getRoomStatusText(room.status)}
                    </span>
                  </div>
                </div>

                {/* Room Details */}
                <div className="p-3">
                  <p className="font-semibold text-primary mb-2">
                    {formatCurrency(room.baseRent)}/tháng
                  </p>
                  
                  {tenant ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="truncate">{tenant.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{tenant.phone}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {room.status === 'maintenance' ? 'Đang bảo trì' : 'Chưa có khách'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary */}
      <div className="px-4 mt-6">
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex justify-around text-center">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {mockRooms.filter(r => r.status === 'occupied').length}
                </p>
                <p className="text-xs text-muted-foreground">Đang thuê</p>
              </div>
              <div className="w-px bg-border" />
              <div>
                <p className="text-2xl font-bold text-accent-foreground">
                  {mockRooms.filter(r => r.status === 'vacant').length}
                </p>
                <p className="text-xs text-muted-foreground">Trống</p>
              </div>
              <div className="w-px bg-border" />
              <div>
                <p className="text-2xl font-bold text-muted-foreground">
                  {mockRooms.filter(r => r.status === 'maintenance').length}
                </p>
                <p className="text-xs text-muted-foreground">Bảo trì</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
