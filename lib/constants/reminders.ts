export interface DebtReminderTemplate {
  id: string
  title: string
  body: string
}

export function buildReminderBody(
  template: DebtReminderTemplate,
  vars: {
    tenantName: string
    roomName: string
    amount: string
    dueDate: string
    monthLabel: string
  }
): string {
  return template.body
    .replace(/\{tenant\}/g, vars.tenantName)
    .replace(/\{room\}/g, vars.roomName)
    .replace(/\{amount\}/g, vars.amount)
    .replace(/\{due_date\}/g, vars.dueDate)
    .replace(/\{month\}/g, vars.monthLabel)
}

export const DEBT_REMINDER_TEMPLATES: DebtReminderTemplate[] = [
  {
    id: 'friendly',
    title: 'Nhắc nhẹ',
    body:
      'Chào {tenant}, tháng {month} phòng {room} có hóa đơn {amount}, hạn thanh toán {due_date}. Anh/chị thanh toán giúp em nhé. Cảm ơn!',
  },
  {
    id: 'standard',
    title: 'Nhắc tiền phòng',
    body:
      'Xin chào {tenant},\n\nPhòng {room} tháng {month}:\n- Tổng tiền: {amount}\n- Hạn thanh toán: {due_date}\n\nVui lòng thanh toán đúng hạn. Trân trọng!',
  },
  {
    id: 'overdue',
    title: 'Quá hạn',
    body:
      'Chào {tenant}, hóa đơn phòng {room} tháng {month} ({amount}) đã quá hạn ({due_date}). Nhờ anh/chị thanh toán sớm. Liên hệ chủ nhà nếu cần hỗ trợ.',
  },
  {
    id: 'zalo_short',
    title: 'Zalo ngắn',
    body: '{tenant} ơi, P{room} T{month}: {amount}, hạn {due_date}. CK giúp mình nha!',
  },
]
