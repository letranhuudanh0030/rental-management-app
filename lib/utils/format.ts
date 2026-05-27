import type { InvoiceDisplayStatus, PaymentStatus } from '@/lib/types/database'

const viInteger = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0,
})

/** 1.000.000 */
export function formatIntegerVi(value: number): string {
  return viInteger.format(value)
}

/** 1.000.000đ */
export function formatCurrency(amount: number): string {
  return formatIntegerVi(amount) + 'đ'
}

/** Bỏ dấu chấm/phẩy khi nhập (1.000.000 → 1000000) */
export function stripNumberFormatting(value: string): string {
  return value.replace(/\./g, '').replace(/,/g, '').replace(/\s/g, '')
}

/** Định dạng chuỗi số để hiển thị (chỉ chữ số) */
export function formatDigitsWithDots(digits: string): string {
  const raw = stripNumberFormatting(digits)
  if (!raw) return ''
  const n = Number(raw)
  if (!Number.isFinite(n)) return digits
  return formatIntegerVi(n)
}

export function formatShortCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace('.0', '') + 'tr'
  }
  if (amount >= 1_000) {
    return (amount / 1_000).toFixed(0) + 'k'
  }
  return amount.toString()
}

export function formatMonthLabel(periodMonth: string): string {
  const date = new Date(periodMonth.includes('T') ? periodMonth : `${periodMonth}T00:00:00`)
  return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
}

export function toPeriodMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

export function parsePeriodMonth(period: string): { year: number; month: number } {
  const [y, m] = period.slice(0, 10).split('-').map(Number)
  return { year: y, month: m }
}

export function shiftPeriodMonth(period: string, delta: number): string {
  const { year, month } = parsePeriodMonth(period)
  const date = new Date(year, month - 1 + delta, 1)
  return toPeriodMonth(date.getFullYear(), date.getMonth() + 1)
}

export function currentPeriodMonth(): string {
  const now = new Date()
  return toPeriodMonth(now.getFullYear(), now.getMonth() + 1)
}

export function getInvoiceDisplayStatus(
  paymentStatus: PaymentStatus,
  dueDate: string
): InvoiceDisplayStatus {
  if (paymentStatus === 'paid_cash') return 'paid_cash'
  if (paymentStatus === 'paid_transfer') return 'paid_transfer'
  const due = new Date(dueDate.includes('T') ? dueDate : `${dueDate}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (due < today) return 'overdue'
  return 'unpaid'
}

export function isPaidStatus(status: PaymentStatus | InvoiceDisplayStatus): boolean {
  return status === 'paid_cash' || status === 'paid_transfer'
}

export function getPaymentStatusColor(status: InvoiceDisplayStatus): string {
  switch (status) {
    case 'paid_cash':
    case 'paid_transfer':
      return 'bg-primary/10 text-primary'
    case 'overdue':
      return 'bg-destructive/10 text-destructive'
    case 'unpaid':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
  }
}

export function getPaymentStatusText(status: InvoiceDisplayStatus): string {
  switch (status) {
    case 'paid_cash':
      return 'Tiền mặt'
    case 'paid_transfer':
      return 'Chuyển khoản'
    case 'overdue':
      return 'Quá hạn'
    case 'unpaid':
      return 'Chưa thu'
  }
}

export function getRoomStatusColor(status: string): string {
  switch (status) {
    case 'occupied':
      return 'bg-primary'
    case 'vacant':
      return 'bg-amber-500'
    case 'maintenance':
      return 'bg-muted-foreground'
    default:
      return 'bg-muted'
  }
}

export function getRoomStatusText(status: string): string {
  switch (status) {
    case 'occupied':
      return 'Đang thuê'
    case 'vacant':
      return 'Trống'
    case 'maintenance':
      return 'Bảo trì'
    default:
      return status
  }
}
