import type { SupabaseClient } from '@supabase/supabase-js'
import { previousPeriodMonth } from '@/lib/utils/billing'
import { currentPeriodMonth } from '@/lib/utils/format'

const DEMO_ROOMS = [
  { name: 'P101', floor: 1, base_rent: 3_000_000, status: 'occupied' as const },
  { name: 'P102', floor: 1, base_rent: 3_000_000, status: 'occupied' as const },
  { name: 'P103', floor: 1, base_rent: 3_200_000, status: 'vacant' as const },
  { name: 'P104', floor: 1, base_rent: 3_000_000, status: 'occupied' as const },
  { name: 'P201', floor: 2, base_rent: 3_500_000, status: 'occupied' as const },
  { name: 'P202', floor: 2, base_rent: 3_500_000, status: 'occupied' as const },
  { name: 'P203', floor: 2, base_rent: 3_500_000, status: 'maintenance' as const },
  { name: 'P204', floor: 2, base_rent: 3_500_000, status: 'occupied' as const },
  { name: 'P301', floor: 3, base_rent: 4_000_000, status: 'occupied' as const },
  { name: 'P302', floor: 3, base_rent: 4_000_000, status: 'vacant' as const },
  { name: 'P303', floor: 3, base_rent: 4_000_000, status: 'occupied' as const },
  { name: 'P304', floor: 3, base_rent: 4_200_000, status: 'occupied' as const },
]

const DEMO_TENANTS = [
  { name: 'Nguyễn Văn An', phone: '0901234567', id_number: '001234567890', roomIndex: 0 },
  { name: 'Trần Thị Bình', phone: '0912345678', id_number: '001234567891', roomIndex: 1 },
  { name: 'Lê Văn Cường', phone: '0923456789', id_number: '001234567892', roomIndex: 3 },
  { name: 'Phạm Thị Dung', phone: '0934567890', id_number: '001234567893', roomIndex: 4 },
  { name: 'Hoàng Văn Em', phone: '0945678901', id_number: '001234567894', roomIndex: 5 },
  { name: 'Vũ Thị Phương', phone: '0956789012', id_number: '001234567895', roomIndex: 7 },
  { name: 'Đặng Văn Giang', phone: '0967890123', id_number: '001234567896', roomIndex: 8 },
  { name: 'Bùi Thị Hoa', phone: '0978901234', id_number: '001234567897', roomIndex: 10 },
  { name: 'Ngô Văn Inh', phone: '0989012345', id_number: '001234567898', roomIndex: 11 },
]

const METER_DATA: Record<number, { ePrev: number; eCurr: number; wPrev: number; wCurr: number }> = {
  0: { ePrev: 1000, eCurr: 1120, wPrev: 50, wCurr: 58 },
  1: { ePrev: 2000, eCurr: 2150, wPrev: 100, wCurr: 112 },
  3: { ePrev: 3000, eCurr: 3080, wPrev: 150, wCurr: 156 },
  4: { ePrev: 4000, eCurr: 4200, wPrev: 200, wCurr: 215 },
  5: { ePrev: 5000, eCurr: 5100, wPrev: 250, wCurr: 260 },
  7: { ePrev: 6000, eCurr: 6180, wPrev: 300, wCurr: 314 },
  8: { ePrev: 7000, eCurr: 7250, wPrev: 350, wCurr: 368 },
  10: { ePrev: 8000, eCurr: 8090, wPrev: 400, wCurr: 408 },
  11: { ePrev: 9000, eCurr: 9300, wPrev: 450, wCurr: 470 },
}

export async function seedDemoData(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (count && count > 0) {
    return { skipped: true, message: 'Đã có dữ liệu, bỏ qua seed.' }
  }

  await supabase
    .from('landlord_settings')
    .update({
      property_name: 'Nhà trọ Demo',
      electric_price: 4000,
      water_price: 15000,
    })
    .eq('user_id', userId)

  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .insert(
      DEMO_ROOMS.map((r, i) => ({
        user_id: userId,
        ...r,
        sort_order: i,
      }))
    )
    .select()

  if (roomsError) throw roomsError

  const periodMonth = currentPeriodMonth()
  const prevMonth = previousPeriodMonth(periodMonth)

  for (const t of DEMO_TENANTS) {
    const room = rooms![t.roomIndex]
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        user_id: userId,
        name: t.name,
        phone: t.phone,
        id_number: t.id_number,
      })
      .select()
      .single()

    if (tenantError) throw tenantError

    const { error: contractError } = await supabase.from('contracts').insert({
      user_id: userId,
      room_id: room.id,
      tenant_id: tenant.id,
      start_date: '2024-01-15',
      monthly_rent: room.base_rent,
      deposit: room.base_rent,
      is_active: true,
    })

    if (contractError) throw contractError

    const meter = METER_DATA[t.roomIndex]
    if (meter) {
      await supabase.from('meter_readings').insert({
        user_id: userId,
        room_id: room.id,
        period_month: prevMonth,
        electric_previous: meter.ePrev - 100,
        electric_current: meter.ePrev,
        water_previous: meter.wPrev - 5,
        water_current: meter.wPrev,
      })

      await supabase.from('meter_readings').insert({
        user_id: userId,
        room_id: room.id,
        period_month: periodMonth,
        electric_previous: meter.ePrev,
        electric_current: meter.eCurr,
        water_previous: meter.wPrev,
        water_current: meter.wCurr,
      })
    }
  }

  return { skipped: false, message: `Đã tạo ${rooms!.length} phòng và dữ liệu mẫu.` }
}
