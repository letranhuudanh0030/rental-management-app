'use client'

import { useCallback, useEffect, useState } from 'react'
import { Zap, Droplets, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { apiPost } from '@/hooks/use-fetch'
import type { MeterBulkRow } from '@/lib/types/database'
import { formatMonthLabel, shiftPeriodMonth } from '@/lib/utils/format'
import {
  calculateElectricUsage,
  calculateWaterUsage,
} from '@/lib/utils/billing'
import type { MeterInputView } from '@/lib/constants/meter-input'
import { MeterViewToggle } from '@/components/meter-view-toggle'

type RowState = Record<
  string,
  { electricEnd: string; waterEnd: string; electricPrev: number; waterPrev: number }
>

interface MeterCardsProps {
  periodMonth: string
  onPeriodChange: (period: string) => void
  view: MeterInputView
  onViewChange: (view: MeterInputView) => void
}

export function MeterCards({
  periodMonth,
  onPeriodChange,
  view,
  onViewChange,
}: MeterCardsProps) {
  const [rows, setRows] = useState<MeterBulkRow[]>([])
  const [settings, setSettings] = useState({ electric_price: 4000, water_price: 15000 })
  const [rowState, setRowState] = useState<RowState>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/meters?period=${periodMonth}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setRows(json.rows)
      setSettings(json.settings)
      const state: RowState = {}
      for (const row of json.rows as MeterBulkRow[]) {
        state[row.room_id] = {
          electricEnd: row.electric_current?.toString() ?? '',
          waterEnd: row.water_current?.toString() ?? '',
          electricPrev: row.electric_previous,
          waterPrev: row.water_previous,
        }
      }
      setRowState(state)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi tải')
    } finally {
      setLoading(false)
    }
  }, [periodMonth])

  useEffect(() => {
    load()
  }, [load])

  const handleChange = (roomId: string, field: 'electricEnd' | 'waterEnd', value: string) => {
    setRowState((prev) => ({
      ...prev,
      [roomId]: { ...prev[roomId], [field]: value },
    }))
  }

  const handleSaveAll = async () => {
    const readings = Object.entries(rowState)
      .filter(([, v]) => v.electricEnd || v.waterEnd)
      .map(([room_id, v]) => ({
        room_id,
        electric_previous: v.electricPrev,
        water_previous: v.waterPrev,
        electric_current: Number(v.electricEnd) || v.electricPrev,
        water_current: Number(v.waterEnd) || v.waterPrev,
      }))

    if (readings.length === 0) {
      toast.error('Chưa nhập số điện nước')
      return
    }

    setSaving(true)
    try {
      await apiPost('/api/meters', { period_month: periodMonth, readings })
      toast.success(`Đã lưu ${readings.length} phòng`)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi lưu')
    } finally {
      setSaving(false)
    }
  }

  const savedCount = rows.filter((r) => r.reading_id).length
  const totalCount = rows.length

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-24" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    )
  }

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-10 bg-background px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h1 className="text-xl font-bold shrink-0">Ghi điện nước</h1>
          <Button onClick={handleSaveAll} size="sm" disabled={saving} className="h-10 shrink-0">
            {saving ? 'Đang lưu...' : 'Lưu tất cả'}
          </Button>
        </div>

        <MeterViewToggle value={view} onChange={onViewChange} className="mb-3" />

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => onPeriodChange(shiftPeriodMonth(periodMonth, -1))}
            className="p-2 rounded-lg hover:bg-muted"
            aria-label="Tháng trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-lg min-w-[150px] text-center">
            {formatMonthLabel(periodMonth)}
          </span>
          <button
            type="button"
            onClick={() => onPeriodChange(shiftPeriodMonth(periodMonth, 1))}
            className="p-2 rounded-lg hover:bg-muted"
            aria-label="Tháng sau"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Tiến độ ghi số</span>
            <span className="font-medium">
              {savedCount}/{totalCount} phòng
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: totalCount ? `${(savedCount / totalCount) * 100}%` : 0 }}
            />
          </div>
        </div>
      </header>

      <div className="px-4 py-3 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>{settings.electric_price.toLocaleString()}đ/kWh</span>
        </div>
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-500" />
          <span>{settings.water_price.toLocaleString()}đ/m³</span>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {rows.map((row) => {
          const data = rowState[row.room_id]
          if (!data) return null
          const electricUsage = data.electricEnd
            ? calculateElectricUsage(data.electricPrev, Number(data.electricEnd))
            : 0
          const waterUsage = data.waterEnd
            ? calculateWaterUsage(data.waterPrev, Number(data.waterEnd))
            : 0
          const saved = !!row.reading_id

          return (
            <Card
              key={row.room_id}
              className={saved ? 'border-primary/50 bg-primary/5' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <span className="font-bold">{row.room_name}</span>
                    </div>
                    <div>
                      <p className="font-medium">{row.tenant_name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{row.tenant_phone}</p>
                    </div>
                  </div>
                  {saved && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Điện
                    </label>
                    <p className="text-xs text-muted-foreground mb-1">
                      Số cũ: {data.electricPrev}
                    </p>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="Số mới"
                      value={data.electricEnd}
                      onChange={(e) =>
                        handleChange(row.room_id, 'electricEnd', e.target.value)
                      }
                      className="h-12 text-lg font-medium"
                    />
                    {electricUsage > 0 && (
                      <p className="text-xs text-primary mt-1 font-medium">
                        Tiêu thụ: {electricUsage} kWh
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      Nước
                    </label>
                    <p className="text-xs text-muted-foreground mb-1">
                      Số cũ: {data.waterPrev}
                    </p>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="Số mới"
                      value={data.waterEnd}
                      onChange={(e) =>
                        handleChange(row.room_id, 'waterEnd', e.target.value)
                      }
                      className="h-12 text-lg font-medium"
                    />
                    {waterUsage > 0 && (
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        Tiêu thụ: {waterUsage} m³
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {rows.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Không có phòng đang thuê. Thêm khách thuê trước.
          </p>
        )}
      </div>
    </div>
  )
}
