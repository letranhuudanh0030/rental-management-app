export type RoomStatus = 'occupied' | 'vacant' | 'maintenance'
export type PaymentStatus = 'unpaid' | 'paid_cash' | 'paid_transfer'
export type PaymentMethod = 'cash' | 'transfer'
export type InvoiceDisplayStatus = 'unpaid' | 'overdue' | 'paid_cash' | 'paid_transfer'

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
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  user_id: string
  invoice_id: string
  amount: number
  method: PaymentMethod
  paid_at: string
  notes: string | null
  created_at: string
}

export interface RoomWithTenant extends Room {
  tenant?: Tenant | null
  contract?: Contract | null
}

export interface InvoiceWithDetails extends Invoice {
  room?: Room
  tenant?: Tenant | null
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
