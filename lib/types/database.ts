export type RoomStatus = 'occupied' | 'vacant' | 'maintenance'
export type PaymentStatus = 'unpaid' | 'paid_cash' | 'paid_transfer' | 'void'
export type PaymentMethod = 'cash' | 'transfer'
export type PaymentRecordStatus = 'active' | 'reversed'
export type InvoiceDisplayStatus = 'unpaid' | 'overdue' | 'paid_cash' | 'paid_transfer' | 'void'
export type ContractStatus = 'draft' | 'active' | 'terminated' | 'expired' | 'cancelled'
export type ExpenseCategory = 'maintenance' | 'utilities' | 'tax' | 'other'

export interface LandlordSettings {
  id: string
  user_id: string
  property_name: string
  electric_price: number
  water_price: number
  invoice_due_day: number
  garbage_price: number
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  user_id: string
  name: string
  floor: number
  base_rent: number
  status: RoomStatus
  sort_order: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Tenant {
  id: string
  user_id: string
  name: string
  phone: string
  id_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  user_id: string
  room_id: string
  tenant_id: string
  start_date: string
  end_date: string | null
  monthly_rent: number
  deposit: number
  is_active: boolean
  status: ContractStatus
  termination_date: string | null
  termination_reason: string | null
  notice_date: string | null
  renewed_from_contract_id: string | null
  created_at: string
  updated_at: string
}

export interface MeterReading {
  id: string
  user_id: string
  room_id: string
  period_month: string
  electric_previous: number
  electric_current: number
  water_previous: number
  water_current: number
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  user_id: string
  room_id: string
  contract_id: string | null
  period_month: string
  rent_amount: number
  electric_usage: number
  electric_cost: number
  water_usage: number
  water_cost: number
  other_fees: number
  total_amount: number
  due_date: string
  payment_status: PaymentStatus
  paid_at: string | null
  notes: string | null
  voided_at: string | null
  voided_by: string | null
  void_reason: string | null
  corrected_from_invoice_id: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceLine {
  id: string
  user_id: string
  invoice_id: string
  line_type: 'rent' | 'electricity' | 'water' | 'garbage' | 'other'
  description: string
  quantity: number
  unit_price: number
  amount: number
  created_at: string
}

export interface Payment {
  id: string
  user_id: string
  invoice_id: string
  amount: number
  method: PaymentMethod
  status: PaymentRecordStatus
  paid_at: string
  notes: string | null
  created_at: string
  reversed_at: string | null
  reversed_by: string | null
  reversal_reason: string | null
}

export interface Expense {
  id: string
  user_id: string
  category: ExpenseCategory
  amount: number
  expense_date: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface PaymentHistoryResponse {
  data: Payment[]
  pagination: { page: number; page_size: number; total: number }
}

export interface RoomWithTenant extends Room {
  tenant?: Tenant | null
  contract?: Contract | null
}

export interface ContractHistory {
  contract: Contract
  room: Pick<Room, 'id' | 'name' | 'floor'> | null
  duration_months: number
  total_paid: number
  last_invoice_date: string | null
}

export interface InvoiceWithDetails extends Invoice {
  room?: Room
  tenant?: Tenant | null
  lines?: InvoiceLine[]
  display_status: InvoiceDisplayStatus
  settings: LandlordSettings
}

export interface DashboardSummary {
  property_name: string
  occupied_rooms: number
  total_rooms: number
  tenant_count: number
  occupancy_rate: number
  month_revenue: number
  unpaid_count: number
  unpaid_total: number
  overdue_count: number
  overdue_total: number
  recent_invoices: InvoiceWithDetails[]
}

export interface MeterBulkRow {
  room_id: string
  room_name: string
  tenant_name: string | null
  tenant_phone: string | null
  electric_previous: number
  water_previous: number
  electric_current: number | null
  water_current: number | null
  reading_id: string | null
}
