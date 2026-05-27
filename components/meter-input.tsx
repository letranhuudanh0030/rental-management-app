'use client'

import { useState } from 'react'
import { Zap, Droplets, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  mockRooms, 
  mockTenants,
  mockMeterReadings,
  SETTINGS
} from '@/lib/data'

interface MeterData {
  [roomId: string]: {
    electricEnd: string
    waterEnd: string
    saved: boolean
  }
}

export function MeterInput() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const occupiedRooms = mockRooms.filter(r => r.status === 'occupied')
  
  // Initialize meter data from existing readings or empty
  const [meterData, setMeterData] = useState<MeterData>(() => {
    const data: MeterData = {}
    occupiedRooms.forEach(room => {
      const existing = mockMeterReadings.find(
        m => m.roomId === room.id && m.month === selectedMonth
      )
      data[room.id] = {
        electricEnd: existing?.electricEnd.toString() || '',
        waterEnd: existing?.waterEnd.toString() || '',
        saved: !!existing
      }
    })
    return data
  })

  const handleInputChange = (roomId: string, field: 'electricEnd' | 'waterEnd', value: string) => {
    setMeterData(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [field]: value,
        saved: false
      }
    }))
  }

  const handleSave = (roomId: string) => {
    setMeterData(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        saved: true
      }
    }))
  }

  const handleSaveAll = () => {
    const updated: MeterData = {}
    Object.keys(meterData).forEach(roomId => {
      updated[roomId] = {
        ...meterData[roomId],
        saved: true
      }
    })
    setMeterData(updated)
  }

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

  const savedCount = Object.values(meterData).filter(d => d.saved).length
  const totalCount = occupiedRooms.length

  return (
    <div className="pb-6">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Ghi điện nước</h1>
          <Button onClick={handleSaveAll} size="sm">
            Lưu tất cả
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

        {/* Progress */}
        <div className="mt-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Tiến độ ghi số</span>
            <span className="font-medium">{savedCount}/{totalCount} phòng</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(savedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Price Info */}
      <div className="px-4 py-3">
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-muted-foreground">Điện:</span>
            <span className="font-medium">{SETTINGS.electricPrice.toLocaleString()}đ/kWh</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span className="text-muted-foreground">Nước:</span>
            <span className="font-medium">{SETTINGS.waterPrice.toLocaleString()}đ/m³</span>
          </div>
        </div>
      </div>

      {/* Meter Input List */}
      <div className="px-4 space-y-3">
        {occupiedRooms.map((room) => {
          const tenant = mockTenants.find(t => t.roomId === room.id)
          const previousReading = mockMeterReadings.find(
            m => m.roomId === room.id && m.month === '2026-04'
          )
          const data = meterData[room.id]
          
          const electricUsage = data.electricEnd && previousReading
            ? parseInt(data.electricEnd) - previousReading.electricEnd
            : 0
          const waterUsage = data.waterEnd && previousReading
            ? parseInt(data.waterEnd) - previousReading.waterEnd
            : 0

          return (
            <Card 
              key={room.id} 
              className={`transition-all ${data.saved ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <CardContent className="p-4">
                {/* Room Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <span className="font-bold">{room.name}</span>
                    </div>
                    <div>
                      <p className="font-medium">{tenant?.name}</p>
                      <p className="text-xs text-muted-foreground">{tenant?.phone}</p>
                    </div>
                  </div>
                  {data.saved && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Meter Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Electric */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Điện (kWh)
                    </label>
                    <div className="text-xs text-muted-foreground mb-1">
                      Số cũ: {previousReading?.electricEnd || '-'}
                    </div>
                    <Input
                      type="number"
                      placeholder="Số mới"
                      value={data.electricEnd}
                      onChange={(e) => handleInputChange(room.id, 'electricEnd', e.target.value)}
                      className="h-12 text-lg font-medium"
                    />
                    {electricUsage > 0 && (
                      <div className="text-xs text-primary mt-1 font-medium">
                        Tiêu thụ: {electricUsage} kWh
                      </div>
                    )}
                  </div>

                  {/* Water */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      Nước (m³)
                    </label>
                    <div className="text-xs text-muted-foreground mb-1">
                      Số cũ: {previousReading?.waterEnd || '-'}
                    </div>
                    <Input
                      type="number"
                      placeholder="Số mới"
                      value={data.waterEnd}
                      onChange={(e) => handleInputChange(room.id, 'waterEnd', e.target.value)}
                      className="h-12 text-lg font-medium"
                    />
                    {waterUsage > 0 && (
                      <div className="text-xs text-blue-600 mt-1 font-medium">
                        Tiêu thụ: {waterUsage} m³
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Button */}
                {!data.saved && (data.electricEnd || data.waterEnd) && (
                  <Button 
                    onClick={() => handleSave(room.id)}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Lưu phòng này
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
