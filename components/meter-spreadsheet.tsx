'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Save,
  Zap,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { apiPost } from '@/hooks/use-fetch'
import type { MeterBulkRow } from '@/lib/types/database'
import {
  formatMonthLabel,
  formatShortCurrency,
  shiftPeriodMonth,
} from '@/lib/utils/format'
import {
  computeMeterRow,
  getNextMeterCell,
  parseMeterNumber,
  type MeterCellField,
  type UsageAlert,
} from '@/lib/utils/meter-spreadsheet'
import type { MeterInputView } from '@/lib/constants/meter-input'
import { MeterViewToggle } from '@/components/meter-view-toggle'

interface RowDraft {
  electricPrevious: string
  electricCurrent: string
  waterPrevious: string
  waterCurrent: string
}

function cellId(roomId: string, field: MeterCellField) {
  return `meter-${roomId}-${field}`
}

function alertCellClass(alert: UsageAlert) {
  if (alert === 'error') {
    return 'bg-destructive/15 text-destructive font-semibold'
  }
  if (alert === 'warning') {
    return 'bg-amber-100 text-amber-900 dark:bg-amber-900/35 dark:text-amber-100 font-semibold'
  }
  return 'text-muted-foreground'
}

function alertInputClass(alert: UsageAlert) {
  if (alert === 'error') {
    return 'border-destructive bg-destructive/5 focus-visible:ring-destructive/30'
  }
  if (alert === 'warning') {
    return 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 focus-visible:ring-amber-500/30'
  }
  return ''
}

interface MeterSpreadsheetProps {
  periodMonth: string
  onPeriodChange: (period: string) => void
  view: MeterInputView
  onViewChange: (view: MeterInputView) => void
}

export function MeterSpreadsheet({
  periodMonth,
  onPeriodChange,
  view,
  onViewChange,
}: MeterSpreadsheetProps) {
  const [rows, setRows] = useState<MeterBulkRow[]>([])
  const [draft, setDraft] = useState<Record<string, RowDraft>>({})
  const [settings, setSettings] = useState({
    electric_price: 4000,
    water_price: 15000,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)
  const didAutoFocus = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/meters?period=${periodMonth}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setRows(json.rows)
      setSettings(json.settings)
      const nextDraft: Record<string, RowDraft> = {}
      for (const row of json.rows as MeterBulkRow[]) {
        nextDraft[row.room_id] = {
          electricPrevious: String(row.electric_previous),
          electricCurrent: row.electric_current?.toString() ?? '',
          waterPrevious: String(row.water_previous),
          waterCurrent: row.water_current?.toString() ?? '',
        }
      }
      setDraft(nextDraft)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi tải')
    } finally {
      setLoading(false)
    }
  }, [periodMonth])

  useEffect(() => {
    load()
  }, [load])

  const roomIds = useMemo(() => rows.map((r) => r.room_id), [rows])

  const focusCell = useCallback((roomId: string, field: MeterCellField) => {
    const el = document.getElementById(cellId(roomId, field)) as HTMLInputElement | null
    if (!el) return
    el.focus()
    el.select()
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [])

  useEffect(() => {
    didAutoFocus.current = false
  }, [periodMonth])

  useEffect(() => {
    if (loading || roomIds.length === 0 || didAutoFocus.current) return
    didAutoFocus.current = true
    const firstIncomplete = roomIds.find((id) => {
      const d = draft[id]
      return d && (!d.electricCurrent.trim() || !d.waterCurrent.trim())
    })
    const targetId = firstIncomplete ?? roomIds[0]
    const d = draft[targetId]
    const field: MeterCellField =
      d?.electricCurrent.trim() ? 'waterCurrent' : 'electricCurrent'
    const t = window.setTimeout(() => focusCell(targetId, field), 100)
    return () => window.clearTimeout(t)
  }, [loading, roomIds, draft, focusCell])

  const updateDraft = (roomId: string, field: keyof RowDraft, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [roomId]: { ...prev[roomId], [field]: value },
    }))
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    roomId: string,
    field: MeterCellField
  ) => {
    const rowIndex = roomIds.indexOf(roomId)

    if (e.key === 'ArrowDown' && rowIndex < roomIds.length - 1) {
      e.preventDefault()
      focusCell(roomIds[rowIndex + 1], field)
      return
    }
    if (e.key === 'ArrowUp' && rowIndex > 0) {
      e.preventDefault()
      focusCell(roomIds[rowIndex - 1], field)
      return
    }

    const isEnter = e.key === 'Enter'
    const isTab = e.key === 'Tab'
    if (!isEnter && !isTab) return

    e.preventDefault()

    if (field === 'electricPrevious') {
      focusCell(roomId, 'electricCurrent')
      return
    }
    if (field === 'waterPrevious') {
      focusCell(roomId, 'waterCurrent')
      return
    }

    const next = getNextMeterCell(roomIds, roomId, field, e.shiftKey)
    if (next) focusCell(next.roomId, next.field)
  }

  const handleSaveAll = useCallback(async () => {
    const readings = roomIds
      .map((room_id) => {
        const d = draft[room_id]
        if (!d) return null
        const eCurr = parseMeterNumber(d.electricCurrent)
        const wCurr = parseMeterNumber(d.waterCurrent)
        if (eCurr === null && wCurr === null) return null
        return {
          room_id,
          electric_previous: parseMeterNumber(d.electricPrevious) ?? 0,
          water_previous: parseMeterNumber(d.waterPrevious) ?? 0,
          electric_current: eCurr ?? parseMeterNumber(d.electricPrevious) ?? 0,
          water_current: wCurr ?? parseMeterNumber(d.waterPrevious) ?? 0,
        }
      })
      .filter(Boolean) as Array<{
      room_id: string
      electric_previous: number
      water_previous: number
      electric_current: number
      water_current: number
    }>

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
  }, [roomIds, draft, periodMonth, load])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSaveAll()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSaveAll])

  const { computedByRoom, totals, filledCount, savedCount, alertCount } =
    useMemo(() => {
      let totalBill = 0
      let filled = 0
      let alerts = 0
      const computed: Record<string, ReturnType<typeof computeMeterRow>> = {}

      for (const row of rows) {
        const d = draft[row.room_id]
        if (!d) continue
        const ePrev = parseMeterNumber(d.electricPrevious) ?? row.electric_previous
        const wPrev = parseMeterNumber(d.waterPrevious) ?? row.water_previous
        const eCurr = parseMeterNumber(d.electricCurrent)
        const wCurr = parseMeterNumber(d.waterCurrent)
        const c = computeMeterRow(
          ePrev,
          eCurr,
          wPrev,
          wCurr,
          settings.electric_price,
          settings.water_price
        )
        computed[row.room_id] = c
        totalBill += c.totalBill
        if (eCurr !== null || wCurr !== null) filled += 1
        if (c.electricAlert !== 'none' || c.waterAlert !== 'none') alerts += 1
      }

      return {
        computedByRoom: computed,
        totals: { totalBill, filled },
        filledCount: filled,
        savedCount: rows.filter((r) => r.reading_id).length,
        alertCount: alerts,
      }
    }, [rows, draft, settings])

  if (loading) {
    return (
      <div className="p-3 space-y-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[calc(100dvh-5rem)] pb-24">
      <header className="sticky top-0 z-30 bg-background border-b border-border px-3 pt-3 pb-2">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h1 className="text-lg font-bold shrink-0">Ghi điện nước</h1>
          <Button
            size="sm"
            className="h-10 px-4 shrink-0"
            onClick={handleSaveAll}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? 'Đang lưu...' : 'Lưu tất cả'}
          </Button>
        </div>

        <MeterViewToggle value={view} onChange={onViewChange} className="mb-2" />

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onPeriodChange(shiftPeriodMonth(periodMonth, -1))}
            className="p-2.5 rounded-lg hover:bg-muted active:bg-muted"
            aria-label="Tháng trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-base min-w-[140px] text-center">
            {formatMonthLabel(periodMonth)}
          </span>
          <button
            type="button"
            onClick={() => onPeriodChange(shiftPeriodMonth(periodMonth, 1))}
            className="p-2.5 rounded-lg hover:bg-muted active:bg-muted"
            aria-label="Tháng sau"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            {settings.electric_price.toLocaleString('vi-VN')}đ/kWh
          </span>
          <span className="flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-blue-500" />
            {settings.water_price.toLocaleString('vi-VN')}đ/m³
          </span>
          <span className="ml-auto font-medium text-foreground">
            {savedCount}/{rows.length} đã lưu
          </span>
        </div>

        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{
              width: rows.length
                ? `${(savedCount / rows.length) * 100}%`
                : '0%',
            }}
          />
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 px-4 text-sm">
          Không có phòng đang thuê. Thêm khách thuê trước.
        </p>
      ) : (
        <div
          ref={tableRef}
          className="flex-1 overflow-auto overscroll-x-contain touch-pan-x"
        >
          <table className="w-max min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur-sm">
              <tr className="border-b border-border">
                <th
                  className={cn(
                    'sticky left-0 z-30 bg-muted/95 backdrop-blur-sm',
                    'px-2 py-2 text-left font-semibold text-xs min-w-[52px]',
                    'border-r border-border shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]'
                  )}
                >
                  Phòng
                </th>
                <th colSpan={3} className="px-1 py-2 text-center font-semibold text-xs border-r border-border/60">
                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <Zap className="w-3 h-3" /> Điện
                  </span>
                </th>
                <th colSpan={3} className="px-1 py-2 text-center font-semibold text-xs border-r border-border/60">
                  <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400">
                    <Droplets className="w-3 h-3" /> Nước
                  </span>
                </th>
                <th className="px-2 py-2 text-right font-semibold text-xs min-w-[72px]">
                  Tổng
                </th>
              </tr>
              <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="sticky left-0 z-30 bg-muted/95 backdrop-blur-sm border-r border-border shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] px-2 py-1" />
                <th className="px-1 py-1 font-medium w-[4.25rem]">Cũ</th>
                <th className="px-1 py-1 font-medium w-[4.75rem]">Mới</th>
                <th className="px-1 py-1 font-medium w-[3.25rem] border-r border-border/60">Dùng</th>
                <th className="px-1 py-1 font-medium w-[4.25rem]">Cũ</th>
                <th className="px-1 py-1 font-medium w-[4.75rem]">Mới</th>
                <th className="px-1 py-1 font-medium w-[3.25rem] border-r border-border/60">Dùng</th>
                <th className="px-2 py-1 font-medium">VNĐ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                const d = draft[row.room_id]
                if (!d) return null
                const c = computedByRoom[row.room_id]
                const saved = !!row.reading_id

                return (
                  <tr
                    key={row.room_id}
                    className={cn(
                      'border-b border-border/80',
                      rowIndex % 2 === 0 ? 'bg-card' : 'bg-muted/30',
                      saved && 'bg-primary/5'
                    )}
                  >
                    <td
                      className={cn(
                        'sticky left-0 z-10 px-2 py-1.5 align-middle',
                        'border-r border-border shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]',
                        rowIndex % 2 === 0 ? 'bg-card' : 'bg-muted/30',
                        saved && 'bg-primary/5'
                      )}
                    >
                      <div className="font-bold text-base leading-tight">{row.room_name}</div>
                      {row.tenant_name && (
                        <div className="text-[10px] text-muted-foreground truncate max-w-[4.5rem]">
                          {row.tenant_name}
                        </div>
                      )}
                    </td>

                    <MeterCell
                      id={cellId(row.room_id, 'electricPrevious')}
                      value={d.electricPrevious}
                      onChange={(v) => updateDraft(row.room_id, 'electricPrevious', v)}
                      onKeyDown={(e) =>
                        handleKeyDown(e, row.room_id, 'electricPrevious')
                      }
                      muted
                    />
                    <MeterCell
                      id={cellId(row.room_id, 'electricCurrent')}
                      value={d.electricCurrent}
                      onChange={(v) => updateDraft(row.room_id, 'electricCurrent', v)}
                      onKeyDown={(e) =>
                        handleKeyDown(e, row.room_id, 'electricCurrent')
                      }
                      alert={c?.electricAlert}
                      primary
                    />
                    <td
                      className={cn(
                        'px-1 py-1.5 text-center text-xs tabular-nums border-r border-border/60',
                        alertCellClass(c?.electricAlert ?? 'none')
                      )}
                    >
                      {c && (parseMeterNumber(d.electricCurrent) !== null)
                        ? c.electricUsage
                        : '—'}
                    </td>

                    <MeterCell
                      id={cellId(row.room_id, 'waterPrevious')}
                      value={d.waterPrevious}
                      onChange={(v) => updateDraft(row.room_id, 'waterPrevious', v)}
                      onKeyDown={(e) =>
                        handleKeyDown(e, row.room_id, 'waterPrevious')
                      }
                      muted
                    />
                    <MeterCell
                      id={cellId(row.room_id, 'waterCurrent')}
                      value={d.waterCurrent}
                      onChange={(v) => updateDraft(row.room_id, 'waterCurrent', v)}
                      onKeyDown={(e) =>
                        handleKeyDown(e, row.room_id, 'waterCurrent')
                      }
                      alert={c?.waterAlert}
                      primary
                    />
                    <td
                      className={cn(
                        'px-1 py-1.5 text-center text-xs tabular-nums border-r border-border/60',
                        alertCellClass(c?.waterAlert ?? 'none')
                      )}
                    >
                      {c && parseMeterNumber(d.waterCurrent) !== null
                        ? c.waterUsage
                        : '—'}
                    </td>

                    <td className="px-2 py-1.5 text-right text-xs font-semibold tabular-nums whitespace-nowrap">
                      {c && c.totalBill > 0
                        ? formatShortCurrency(c.totalBill)
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <footer className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md px-3 py-2 safe-area-pb">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="flex-1 min-w-0 text-xs">
            <div className="font-medium">
              {filledCount}/{rows.length} phòng đã nhập
            </div>
            <div className="text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>Tổng tiền điện nước: {formatShortCurrency(totals.totalBill)}</span>
              {alertCount > 0 && (
                <span className="inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  {alertCount} bất thường
                </span>
              )}
            </div>
          </div>
          <Button
            className="h-11 px-5 shrink-0"
            onClick={handleSaveAll}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-1.5" />
            Lưu
          </Button>
        </div>
      </footer>
    </div>
  )
}

function MeterCell({
  id,
  value,
  onChange,
  onKeyDown,
  alert = 'none',
  muted = false,
  primary = false,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  alert?: UsageAlert
  muted?: boolean
  primary?: boolean
}) {
  return (
    <td className="px-0.5 py-1">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        enterKeyHint="next"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={(e) => e.currentTarget.select()}
        className={cn(
          'w-full min-w-0 rounded-md border text-center font-semibold tabular-nums',
          'outline-none transition-[box-shadow,border-color]',
          'focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:border-ring',
          muted
            ? 'h-10 text-sm bg-muted/50 text-muted-foreground border-transparent'
            : 'h-11 text-base bg-background border-input',
          primary && 'ring-1 ring-primary/20',
          alertInputClass(alert)
        )}
      />
    </td>
  )
}
