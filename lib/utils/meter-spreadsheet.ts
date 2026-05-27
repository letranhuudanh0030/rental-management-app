import {
  calculateElectricUsage,
  calculateUtilityCost,
  calculateWaterUsage,
} from '@/lib/utils/billing'

export type MeterCellField =
  | 'electricPrevious'
  | 'electricCurrent'
  | 'waterPrevious'
  | 'waterCurrent'

/** Fast path: current readings only (prev shown, editable on tap). */
export const METER_FOCUS_ORDER: MeterCellField[] = [
  'electricCurrent',
  'waterCurrent',
]

export type UsageAlert = 'none' | 'warning' | 'error'

export const METER_ALERT_THRESHOLDS = {
  electricHighKwh: 500,
  waterHighM3: 25,
} as const

export interface MeterRowComputed {
  electricUsage: number
  waterUsage: number
  electricCost: number
  waterCost: number
  totalBill: number
  electricAlert: UsageAlert
  waterAlert: UsageAlert
}

export function parseMeterNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

export function getUsageAlert(
  usage: number,
  previous: number,
  current: number | null,
  highThreshold: number
): UsageAlert {
  if (current === null) return 'none'
  if (current < previous) return 'error'
  if (usage > highThreshold) return 'warning'
  return 'none'
}

export function computeMeterRow(
  electricPrev: number,
  electricCurr: number | null,
  waterPrev: number,
  waterCurr: number | null,
  electricPrice: number,
  waterPrice: number
): MeterRowComputed {
  const electricUsage =
    electricCurr !== null
      ? calculateElectricUsage(electricPrev, electricCurr)
      : 0
  const waterUsage =
    waterCurr !== null ? calculateWaterUsage(waterPrev, waterCurr) : 0

  const electricCost = calculateUtilityCost(electricUsage, electricPrice)
  const waterCost = calculateUtilityCost(waterUsage, waterPrice)

  return {
    electricUsage,
    waterUsage,
    electricCost,
    waterCost,
    totalBill: electricCost + waterCost,
    electricAlert: getUsageAlert(
      electricUsage,
      electricPrev,
      electricCurr,
      METER_ALERT_THRESHOLDS.electricHighKwh
    ),
    waterAlert: getUsageAlert(
      waterUsage,
      waterPrev,
      waterCurr,
      METER_ALERT_THRESHOLDS.waterHighM3
    ),
  }
}

export function getNextMeterCell(
  roomIds: string[],
  roomId: string,
  field: MeterCellField,
  reverse = false,
  order: MeterCellField[] = METER_FOCUS_ORDER
): { roomId: string; field: MeterCellField } | null {
  const roomIndex = roomIds.indexOf(roomId)
  const fieldIndex = order.indexOf(field)
  if (roomIndex === -1 || fieldIndex === -1) return null

  const step = reverse ? -1 : 1
  let nextFieldIndex = fieldIndex + step
  let nextRoomIndex = roomIndex

  if (nextFieldIndex >= order.length) {
    nextFieldIndex = 0
    nextRoomIndex += 1
  } else if (nextFieldIndex < 0) {
    nextFieldIndex = order.length - 1
    nextRoomIndex -= 1
  }

  if (nextRoomIndex < 0 || nextRoomIndex >= roomIds.length) return null
  return { roomId: roomIds[nextRoomIndex], field: order[nextFieldIndex] }
}
