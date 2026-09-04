import type { SupabaseClient } from '@supabase/supabase-js'
import {
  calculateElectricUsage,
  calculateInvoiceTotal,
  calculateUtilityCost,
  calculateWaterUsage,
  computeDueDate,
  isContractValidForPeriod,
  previousPeriodMonth,
} from '@/lib/utils/billing'
import { getInvoiceDisplayStatus } from '@/lib/utils/format'
import type { Invoice, InvoiceWithDetails, LandlordSettings } from '@/lib/types/database'

export async function enrichInvoices(
  supabase: SupabaseClient,
  invoices: Invoice[],
  settings: LandlordSettings
): Promise<InvoiceWithDetails[]> {
  if (invoices.length === 0) return []

  const roomIds = [...new Set(invoices.map((i) => i.room_id))]
  const { data: rooms } = await supabase.from('rooms').select('*').in('id', roomIds)

  const { data: contracts } = await supabase
    .from('contracts')
    .select('*, tenants(*)')
    .in('room_id', roomIds)
    .eq('is_active', true)

  return invoices.map((invoice) => {
    const room = rooms?.find((r) => r.id === invoice.room_id)
    const contract = contracts?.find((c) => c.room_id === invoice.room_id)
    const tenant = contract?.tenants ?? null

    return {
      ...invoice,
      room,
      tenant,
      display_status: getInvoiceDisplayStatus(invoice.payment_status, invoice.due_date),
      settings,
    }
  })
}

export async function generateInvoicesForPeriod(
  supabase: SupabaseClient,
  userId: string,
  periodMonth: string,
  settings: LandlordSettings
): Promise<{ created: number; skipped: number }> {
  const prevMonth = previousPeriodMonth(periodMonth)

  const { data: occupiedRooms } = await supabase
    .from('rooms')
    .select('id, base_rent')
    .eq('user_id', userId)
    .eq('status', 'occupied')

  if (!occupiedRooms?.length) return { created: 0, skipped: 0 }

  const roomIds = occupiedRooms.map((r) => r.id)

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, room_id, monthly_rent, start_date, end_date')
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('room_id', roomIds)

  const { data: readings } = await supabase
    .from('meter_readings')
    .select('*')
    .eq('user_id', userId)
    .eq('period_month', periodMonth)
    .in('room_id', roomIds)

  const { data: prevReadings } = await supabase
    .from('meter_readings')
    .select('room_id, electric_current, water_current')
    .eq('user_id', userId)
    .eq('period_month', prevMonth)
    .in('room_id', roomIds)

  const { data: existing } = await supabase
    .from('invoices')
    .select('room_id')
    .eq('user_id', userId)
    .eq('period_month', periodMonth)
    .in('room_id', roomIds)

  const existingRoomIds = new Set(existing?.map((e) => e.room_id) ?? [])
  const dueDate = computeDueDate(periodMonth, settings.invoice_due_day)

  const rows = occupiedRooms
    .filter((room) => !existingRoomIds.has(room.id))
    .flatMap((room) => {
      const contract = contracts?.find(
        (candidate) =>
          candidate.room_id === room.id &&
          isContractValidForPeriod(candidate.start_date, candidate.end_date, periodMonth)
      )
      if (!contract) return []

      const reading = readings?.find((r) => r.room_id === room.id)
      const prev = prevReadings?.find((r) => r.room_id === room.id)

      const electricPrev = reading?.electric_previous ?? prev?.electric_current ?? 0
      const waterPrev = reading?.water_previous ?? prev?.water_current ?? 0
      const electricCurr = reading?.electric_current ?? electricPrev
      const waterCurr = reading?.water_current ?? waterPrev

      const electricUsage = calculateElectricUsage(Number(electricPrev), Number(electricCurr))
      const waterUsage = calculateWaterUsage(Number(waterPrev), Number(waterCurr))
      const electricCost = calculateUtilityCost(electricUsage, settings.electric_price)
      const waterCost = calculateUtilityCost(waterUsage, settings.water_price)
      const rentAmount = contract!.monthly_rent

      const total = calculateInvoiceTotal({
        rent_amount: rentAmount,
        electric_cost: electricCost,
        water_cost: waterCost,
        other_fees: settings.garbage_price, // tiền rác
      })

      return [{
        user_id: userId,
        room_id: room.id,
        contract_id: contract.id,
        period_month: periodMonth,
        rent_amount: rentAmount,
        electric_usage: electricUsage,
        electric_cost: electricCost,
        water_usage: waterUsage,
        water_cost: waterCost,
        other_fees: settings.garbage_price,
        total_amount: total ,
        due_date: dueDate,
        payment_status: 'unpaid' as const,
        lines: [
          { line_type: 'rent', description: 'Tiền thuê phòng', quantity: 1, unit_price: rentAmount, amount: rentAmount },
          { line_type: 'electricity', description: 'Tiền điện', quantity: electricUsage, unit_price: settings.electric_price, amount: electricCost },
          { line_type: 'water', description: 'Tiền nước', quantity: waterUsage, unit_price: settings.water_price, amount: waterCost },
          { line_type: 'garbage', description: 'Tiền rác', quantity: 1, unit_price: settings.garbage_price, amount: settings.garbage_price },
        ],
      }]
    })

  if (rows.length === 0) {
    return { created: 0, skipped: existingRoomIds.size }
  }

  for (const row of rows) {
    const { lines, ...invoice } = row
    const { error } = await supabase.rpc('create_invoice_with_lines', {
      p_invoice: invoice,
      p_lines: lines,
    })
    if (error) throw error
  }

  return { created: rows.length, skipped: existingRoomIds.size }
}
