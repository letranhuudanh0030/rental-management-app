'use client'

import { useState } from 'react'
import { Edit2, Building2, Phone, Plus, Search, Trash2, User } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { apiPatch, apiPost, useFetch } from '@/hooks/use-fetch'
import type { RoomWithTenant, Tenant } from '@/lib/types/database'

const NO_ROOM = '__no_room__'

export default function TenantsPage() {
  const { data: rooms, refetch: refetchRooms } = useFetch<RoomWithTenant[]>('/api/rooms')
  const { data: tenants, loading, refetch } = useFetch<Tenant[]>('/api/tenants')
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    id_number: '',
    room_id: '',
  })

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null)
  const [editForm, setEditForm] = useState({
    tenant_id: '',
    name: '',
    phone: '',
    id_number: '',
    notes: '',
    room_id: '',
  })

  const getActiveTenantRoomName = (t: Tenant) => {
    const withContracts = t as Tenant & {
      contracts?: Array<{
        room_id: string
        is_active: boolean
        rooms?: { name: string } | { name: string }[] | null
      }>
    }
    const active = withContracts.contracts?.find((c) => c.is_active)
    if (active?.rooms) {
      const room = Array.isArray(active.rooms) ? active.rooms[0] : active.rooms
      if (room?.name) return room.name
    }
    const room = (rooms ?? []).find((r) => r.tenant?.id === t.id)
    return room?.name ?? null
  }

  const getActiveTenantRoomId = (t: Tenant) => {
    const withContracts = t as Tenant & {
      contracts?: Array<{ room_id: string; is_active: boolean }>
    }
    const contracts = withContracts.contracts
    if (Array.isArray(contracts)) {
      const active = contracts.find((c) => c.is_active)
      if (active?.room_id) return active.room_id
    }
    const room = (rooms ?? []).find((r) => r.tenant?.id === t.id)
    return room?.id ?? null
  }

  const vacantRooms = (rooms ?? []).filter((r) => r.status === 'vacant')

  const filteredTenants = (tenants ?? []).filter((t) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const roomName = getActiveTenantRoomName(t)?.toLowerCase() ?? ''
    const roomId = getActiveTenantRoomId(t)
    return (
      t.name.toLowerCase().includes(q) ||
      t.phone.toLowerCase().includes(q) ||
      (t.id_number ?? '').toLowerCase().includes(q) ||
      roomName.includes(q) ||
      (roomId ?? '').toLowerCase().includes(q)
    )
  })

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      toast.error('Nhập tên và SĐT')
      return
    }
    try {
      await apiPost('/api/tenants', form)
      toast.success('Đã thêm khách thuê')
      setOpen(false)
      setForm({ name: '', phone: '', id_number: '', room_id: '' })
      refetch()
      refetchRooms()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi')
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    )
  }

  return (
    <div className="pb-6">
      <header className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold">Khách thuê</h1>
          <Button size="sm" className="h-10 gap-1" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" />
            Thêm
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm khách thuê... (tên, SĐT, CCCD)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 text-base"
          />
        </div>
      </header>

      <div className="px-4 space-y-2">
        {filteredTenants.map((tenant) => {
          const roomName = getActiveTenantRoomName(tenant)
          return (
          <Card key={tenant.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{tenant.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  {tenant.phone}
                </p>
                <p className="text-sm text-primary font-medium flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  {roomName ? `Phòng ${roomName}` : 'Chưa gán phòng'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10"
                  onClick={() => window.open(`tel:${tenant.phone}`)}
                >
                  Gọi
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-2"
                  aria-label="Chỉnh sửa"
                  onClick={() => {
                    const activeRoomId = getActiveTenantRoomId(tenant)
                    setActiveTenant(tenant)
                    setEditForm({
                      tenant_id: tenant.id,
                      name: tenant.name,
                      phone: tenant.phone,
                      id_number: tenant.id_number ?? '',
                      notes: tenant.notes ?? '',
                      room_id: activeRoomId ?? '',
                    })
                    setEditOpen(true)
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-2"
                  aria-label="Xoá"
                  onClick={() => {
                    setActiveTenant(tenant)
                    setDeleteOpen(true)
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
          )
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm khách thuê</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Họ tên</Label>
              <Input
                className="h-11 mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Số điện thoại</Label>
              <Input
                className="h-11 mt-1"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>CCCD (tuỳ chọn)</Label>
              <Input
                className="h-11 mt-1"
                value={form.id_number}
                onChange={(e) => setForm({ ...form, id_number: e.target.value })}
              />
            </div>
            <div>
              <Label>Gán phòng trống</Label>
              <Select
                value={form.room_id}
                onValueChange={(v) => setForm({ ...form, room_id: v })}
              >
                <SelectTrigger className="h-11 mt-1">
                  <SelectValue placeholder="Chọn phòng (tuỳ chọn)" />
                </SelectTrigger>
                <SelectContent>
                  {vacantRooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} — Tầng {r.floor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full h-12" onClick={handleSubmit}>
              Lưu khách thuê
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(next) => {
          setEditOpen(next)
          if (!next) setActiveTenant(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa khách thuê</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Họ tên</Label>
              <Input
                className="h-11 mt-1"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Số điện thoại</Label>
              <Input
                className="h-11 mt-1"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>CCCD (tuỳ chọn)</Label>
              <Input
                className="h-11 mt-1"
                value={editForm.id_number}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, id_number: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Ghi chú (tuỳ chọn)</Label>
              <Input
                className="h-11 mt-1"
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Phòng (tuỳ chọn)</Label>
              <Select
                value={editForm.room_id || NO_ROOM}
                onValueChange={(v) =>
                  setEditForm((p) => ({
                    ...p,
                    room_id: v === NO_ROOM ? '' : v,
                  }))
                }
              >
                <SelectTrigger className="h-11 mt-1">
                  <SelectValue placeholder="Chưa gán" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ROOM}>Không gán</SelectItem>
                  {(() => {
                    const currentRoomId = editForm.room_id
                    const currentRoom = currentRoomId
                      ? (rooms ?? []).find((r) => r.id === currentRoomId)
                      : null
                    const selectableRooms = [
                      ...vacantRooms,
                      ...(currentRoom &&
                      !vacantRooms.some((r) => r.id === currentRoom.id)
                        ? [currentRoom]
                        : []),
                    ]
                    return selectableRooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} — Tầng {r.floor}
                      </SelectItem>
                    ))
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              className="w-full h-12"
              onClick={async () => {
                try {
                  await apiPatch('/api/tenants', {
                    tenant_id: editForm.tenant_id,
                    name: editForm.name,
                    phone: editForm.phone,
                    id_number: editForm.id_number || null,
                    notes: editForm.notes || null,
                    room_id: editForm.room_id ? editForm.room_id : null,
                  })
                  toast.success('Đã cập nhật khách thuê')
                  setEditOpen(false)
                  setActiveTenant(null)
                  refetch()
                  refetchRooms()
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Lỗi')
                }
              }}
            >
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(next) => {
          setDeleteOpen(next)
          if (!next) setActiveTenant(null)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xoá khách thuê?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Thao tác này sẽ xoá hợp đồng hiện tại của khách thuê và có thể ảnh hưởng
            dữ liệu phòng.
          </p>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={() => {
                setDeleteOpen(false)
                setActiveTenant(null)
              }}
            >
              Huỷ
            </Button>
            <Button
              className="flex-1 h-11"
              onClick={async () => {
                if (!activeTenant) return
                try {
                  await fetch('/api/tenants', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tenant_id: activeTenant.id }),
                  })
                  toast.success('Đã xoá khách thuê')
                  setDeleteOpen(false)
                  setActiveTenant(null)
                  refetch()
                  refetchRooms()
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Lỗi')
                }
              }}
            >
              Xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
