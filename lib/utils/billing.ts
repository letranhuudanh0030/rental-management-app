import { toPeriodMonth } from '@/lib/utils/format'

export function calculateUtilityCost(
  usage: number,
  unitPrice: number
): number {
  return Math.round(usage * unitPrice)
}

export function calculateElectricUsage(previous: number, current: number): number {
  return Math.max(0, current - previous)
}

export function calculateWaterUsage(previous: number, current: number): number {
  return Math.max(0, current - previous)
}

export function calculateInvoiceTotal(parts: {
  rent_amount: number
  electric_cost: number
  water_cost: number
  other_fees: number
}): number {
  return (
    parts.rent_amount +
    parts.electric_cost +
    parts.water_cost +
    parts.other_fees
  )
}

export function computeDueDate(periodMonth: string, dueDay: number): string {
  const [year, month] = periodMonth.slice(0, 10).split('-').map(Number)
  const day = Math.min(Math.max(dueDay, 1), 28)
  const due = new Date(year, month, day)
  return due.toISOString().slice(0, 10)
}

export function previousPeriodMonth(periodMonth: string): string {
  const [year, month] = periodMonth.slice(0, 10).split('-').map(Number)
  const date = new Date(year, month - 2, 1)
  return toPeriodMonth(date.getFullYear(), date.getMonth() + 1)
}
