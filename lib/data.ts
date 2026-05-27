// Types
export interface Room {
  id: string
  name: string
  floor: number
  baseRent: number
  tenantId: string | null
  status: 'occupied' | 'vacant' | 'maintenance'
}

export interface Tenant {
  id: string
  name: string
  phone: string
  idNumber: string
  roomId: string
  moveInDate: string
  deposit: number
}

export interface MeterReading {
  id: string
  roomId: string
  month: string // YYYY-MM
  electricStart: number
  electricEnd: number
  waterStart: number
  waterEnd: number
  createdAt: string
}

export interface Bill {
  id: string
  roomId: string
  month: string
  baseRent: number
  electricUsage: number
  electricCost: number
  waterUsage: number
  waterCost: number
  otherFees: number
  total: number
  status: 'pending' | 'paid' | 'overdue'
  paidAt: string | null
  dueDate: string
}

// Settings
export const SETTINGS = {
  electricPrice: 4000, // VND per kWh
  waterPrice: 15000, // VND per m3
}

// Mock data
export const mockRooms: Room[] = [
  { id: '1', name: 'P101', floor: 1, baseRent: 3000000, tenantId: '1', status: 'occupied' },
  { id: '2', name: 'P102', floor: 1, baseRent: 3000000, tenantId: '2', status: 'occupied' },
  { id: '3', name: 'P103', floor: 1, baseRent: 3200000, tenantId: null, status: 'vacant' },
  { id: '4', name: 'P104', floor: 1, baseRent: 3000000, tenantId: '3', status: 'occupied' },
  { id: '5', name: 'P201', floor: 2, baseRent: 3500000, tenantId: '4', status: 'occupied' },
  { id: '6', name: 'P202', floor: 2, baseRent: 3500000, tenantId: '5', status: 'occupied' },
  { id: '7', name: 'P203', floor: 2, baseRent: 3500000, tenantId: null, status: 'maintenance' },
  { id: '8', name: 'P204', floor: 2, baseRent: 3500000, tenantId: '6', status: 'occupied' },
  { id: '9', name: 'P301', floor: 3, baseRent: 4000000, tenantId: '7', status: 'occupied' },
  { id: '10', name: 'P302', floor: 3, baseRent: 4000000, tenantId: null, status: 'vacant' },
  { id: '11', name: 'P303', floor: 3, baseRent: 4000000, tenantId: '8', status: 'occupied' },
  { id: '12', name: 'P304', floor: 3, baseRent: 4200000, tenantId: '9', status: 'occupied' },
]

export const mockTenants: Tenant[] = [
  { id: '1', name: 'Nguyễn Văn An', phone: '0901234567', idNumber: '001234567890', roomId: '1', moveInDate: '2024-01-15', deposit: 3000000 },
  { id: '2', name: 'Trần Thị Bình', phone: '0912345678', idNumber: '001234567891', roomId: '2', moveInDate: '2024-02-01', deposit: 3000000 },
  { id: '3', name: 'Lê Văn Cường', phone: '0923456789', idNumber: '001234567892', roomId: '4', moveInDate: '2024-03-10', deposit: 3000000 },
  { id: '4', name: 'Phạm Thị Dung', phone: '0934567890', idNumber: '001234567893', roomId: '5', moveInDate: '2024-01-20', deposit: 3500000 },
  { id: '5', name: 'Hoàng Văn Em', phone: '0945678901', idNumber: '001234567894', roomId: '6', moveInDate: '2024-04-01', deposit: 3500000 },
  { id: '6', name: 'Vũ Thị Phương', phone: '0956789012', idNumber: '001234567895', roomId: '8', moveInDate: '2024-02-15', deposit: 3500000 },
  { id: '7', name: 'Đặng Văn Giang', phone: '0967890123', idNumber: '001234567896', roomId: '9', moveInDate: '2024-05-01', deposit: 4000000 },
  { id: '8', name: 'Bùi Thị Hoa', phone: '0978901234', idNumber: '001234567897', roomId: '11', moveInDate: '2024-03-20', deposit: 4000000 },
  { id: '9', name: 'Ngô Văn Inh', phone: '0989012345', idNumber: '001234567898', roomId: '12', moveInDate: '2024-06-01', deposit: 4200000 },
]

export const mockMeterReadings: MeterReading[] = [
  { id: '1', roomId: '1', month: '2026-04', electricStart: 1000, electricEnd: 1120, waterStart: 50, waterEnd: 58, createdAt: '2026-05-01' },
  { id: '2', roomId: '2', month: '2026-04', electricStart: 2000, electricEnd: 2150, waterStart: 100, waterEnd: 112, createdAt: '2026-05-01' },
  { id: '3', roomId: '4', month: '2026-04', electricStart: 3000, electricEnd: 3080, waterStart: 150, waterEnd: 156, createdAt: '2026-05-01' },
  { id: '4', roomId: '5', month: '2026-04', electricStart: 4000, electricEnd: 4200, waterStart: 200, waterEnd: 215, createdAt: '2026-05-01' },
  { id: '5', roomId: '6', month: '2026-04', electricStart: 5000, electricEnd: 5100, waterStart: 250, waterEnd: 260, createdAt: '2026-05-01' },
  { id: '6', roomId: '8', month: '2026-04', electricStart: 6000, electricEnd: 6180, waterStart: 300, waterEnd: 314, createdAt: '2026-05-01' },
  { id: '7', roomId: '9', month: '2026-04', electricStart: 7000, electricEnd: 7250, waterStart: 350, waterEnd: 368, createdAt: '2026-05-01' },
  { id: '8', roomId: '11', month: '2026-04', electricStart: 8000, electricEnd: 8090, waterStart: 400, waterEnd: 408, createdAt: '2026-05-01' },
  { id: '9', roomId: '12', month: '2026-04', electricStart: 9000, electricEnd: 9300, waterStart: 450, waterEnd: 470, createdAt: '2026-05-01' },
]

export const mockBills: Bill[] = [
  { id: '1', roomId: '1', month: '2026-04', baseRent: 3000000, electricUsage: 120, electricCost: 480000, waterUsage: 8, waterCost: 120000, otherFees: 0, total: 3600000, status: 'paid', paidAt: '2026-05-05', dueDate: '2026-05-10' },
  { id: '2', roomId: '2', month: '2026-04', baseRent: 3000000, electricUsage: 150, electricCost: 600000, waterUsage: 12, waterCost: 180000, otherFees: 0, total: 3780000, status: 'pending', paidAt: null, dueDate: '2026-05-10' },
  { id: '3', roomId: '4', month: '2026-04', baseRent: 3000000, electricUsage: 80, electricCost: 320000, waterUsage: 6, waterCost: 90000, otherFees: 0, total: 3410000, status: 'overdue', paidAt: null, dueDate: '2026-05-10' },
  { id: '4', roomId: '5', month: '2026-04', baseRent: 3500000, electricUsage: 200, electricCost: 800000, waterUsage: 15, waterCost: 225000, otherFees: 0, total: 4525000, status: 'paid', paidAt: '2026-05-03', dueDate: '2026-05-10' },
  { id: '5', roomId: '6', month: '2026-04', baseRent: 3500000, electricUsage: 100, electricCost: 400000, waterUsage: 10, waterCost: 150000, otherFees: 0, total: 4050000, status: 'pending', paidAt: null, dueDate: '2026-05-10' },
  { id: '6', roomId: '8', month: '2026-04', baseRent: 3500000, electricUsage: 180, electricCost: 720000, waterUsage: 14, waterCost: 210000, otherFees: 0, total: 4430000, status: 'paid', paidAt: '2026-05-08', dueDate: '2026-05-10' },
  { id: '7', roomId: '9', month: '2026-04', baseRent: 4000000, electricUsage: 250, electricCost: 1000000, waterUsage: 18, waterCost: 270000, otherFees: 0, total: 5270000, status: 'pending', paidAt: null, dueDate: '2026-05-10' },
  { id: '8', roomId: '11', month: '2026-04', baseRent: 4000000, electricUsage: 90, electricCost: 360000, waterUsage: 8, waterCost: 120000, otherFees: 0, total: 4480000, status: 'overdue', paidAt: null, dueDate: '2026-05-10' },
  { id: '9', roomId: '12', month: '2026-04', baseRent: 4200000, electricUsage: 300, electricCost: 1200000, waterUsage: 20, waterCost: 300000, otherFees: 0, total: 5700000, status: 'paid', paidAt: '2026-05-02', dueDate: '2026-05-10' },
]

// Helper functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}

export function formatShortCurrency(amount: number): string {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1).replace('.0', '') + 'tr'
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + 'k'
  }
  return amount.toString()
}

export function getStatusColor(status: Bill['status']): string {
  switch (status) {
    case 'paid': return 'bg-primary/10 text-primary'
    case 'pending': return 'bg-accent/20 text-accent-foreground'
    case 'overdue': return 'bg-destructive/10 text-destructive'
  }
}

export function getStatusText(status: Bill['status']): string {
  switch (status) {
    case 'paid': return 'Đã thanh toán'
    case 'pending': return 'Chờ thanh toán'
    case 'overdue': return 'Quá hạn'
  }
}

export function getRoomStatusColor(status: Room['status']): string {
  switch (status) {
    case 'occupied': return 'bg-primary'
    case 'vacant': return 'bg-accent'
    case 'maintenance': return 'bg-muted-foreground'
  }
}

export function getRoomStatusText(status: Room['status']): string {
  switch (status) {
    case 'occupied': return 'Đang thuê'
    case 'vacant': return 'Trống'
    case 'maintenance': return 'Bảo trì'
  }
}
