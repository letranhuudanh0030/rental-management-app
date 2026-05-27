'use client'

import { useMemo, useState } from 'react'
import { Edit2, Phone, Plus, Search, Trash2, User } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { FormattedNumberInput } from '@/components/formatted-number-input'
import { apiPatch, apiPost, useFetch } from '@/hooks/use-fetch'
import type { RoomWithTenant, Tenant } from '@/lib/types/database'
import {
  formatCurrency,
  getRoomStatusColor,
  getRoomStatusText,
} from '@/lib/utils/format'

const ALL_TENANTS_FILTER = '__all_tenants__'
const NO_TENANT = '__no_tenant__'

export default function RoomsPage() {
  const { data: rooms, loading, refetch } = useFetch<RoomWithTenant[]>('/api/rooms')
  const { data: allTenants } = useFetch<Tenant[]>('/api/tenants')
  const [searchQuery, setSearchQuery] = useState('')
  const [tenantFilterId, setTenantFilterId] = useState<string | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<RoomWithTenant | null>(null)
  const [form, setForm] = useState({
    name: '',
    floor: '1',
    base_rent: '',
    status: 'vacant',
    tenant_id: '',
  })

  const [editForm, setEditForm] = useState({
    room_id: '',
    name: '',
    floor: '1',
    base_rent: '',
    status: 'vacant',
    notes: '',
    tenant_id: '',
  })

  const floors = useMemo(
    () => [...new Set((rooms ?? []).map((r) => r.floor))].sort((a, b) => a - b),
    [rooms]
  )

  const tenantOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    for (const r of rooms ?? []) {
      const t = r.tenant
      if (!t) continue
      if (!map.has(t.id)) map.set(t.id, { id: t.id, name: t.name })
    }
    return [...map.values()].sort((a, b) =>
      a.name.localeCompare(b.name, 'vi')
    )
  }, [rooms])

  const occupiedTenantIds = useMemo(() => {
    const ids = new Set<string>()
    for (const r of rooms ?? []) {
      if (r.tenant?.id) ids.add(r.tenant.id)
    }
    return ids
  }, [rooms])

  /** Khách chưa thuê phòng nào */
  const unassignedTenants = useMemo(() => {
    return [...(allTenants ?? [])]
      .filter((t) => !occupiedTenantIds.has(t.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  }, [allTenants, occupiedTenantIds])

  /** Sửa phòng: khách chưa thuê + khách đang ở phòng này */
  const editTenantOptions = useMemo(() => {
    const currentId = editForm.tenant_id
    return [...(allTenants ?? [])]
      .filter((t) => !occupiedTenantIds.has(t.id) || t.id === currentId)
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  }, [allTenants, occupiedTenantIds, editForm.tenant_id])

  const filteredRooms = (rooms ?? []).filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTenant = !tenantFilterId || room.tenant?.id === tenantFilterId
    const matchesFloor = selectedFloor === null || room.floor === selectedFloor
    return matchesSearch && matchesTenant && matchesFloor
  })

  const handleAddRoom = async () => {
    try {
      const created = await apiPost<{ id: string }>('/api/rooms', {
        name: form.name,
        floor: Number(form.floor),
        base_rent: Number(form.base_rent),
        status: form.tenant_id ? 'occupied' : form.status,
      })
      if (form.tenant_id) {
        await apiPatch('/api/rooms', {
          room_id: created.id,
          tenant_id: form.tenant_id,
        })
      }
      toast.success('Đã thêm phòng')
      setDialogOpen(false)
      setForm({ name: '', floor: '1', base_rent: '', status: 'vacant', tenant_id: '' })
      refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi')
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-10" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-10 bg-background px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Danh sách phòng</h1>
          <Button size="sm" className="gap-1 h-10" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Thêm
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm phòng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 text-base"
          />
        </div>
        <div className="mt-3">
          <Label className="text-xs text-muted-foreground mb-1 block">
            Lọc theo khách thuê
          </Label>
          <Select
            value={tenantFilterId ?? ALL_TENANTS_FILTER}
            onValueChange={(v) =>
              setTenantFilterId(v === ALL_TENANTS_FILTER ? null : v)
            }
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TENANTS_FILTER}>Tất cả</SelectItem>
              {tenantOptions.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedFloor(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              selectedFloor === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            Tất cả
          </button>
          {floors.map((floor) => (
            <button
              key={floor}
              type="button"
              onClick={() => setSelectedFloor(floor)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedFloor === floor
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              Tầng {floor}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 grid grid-cols-2 gap-3 items-stretch">
        {filteredRooms.map((room) => {
          const tenant = room.tenant
          return (
            <Card
              key={room.id}
              className="h-full overflow-hidden active:scale-[0.98] transition-transform flex flex-col"
            >
              <CardContent className="p-0 flex flex-col flex-1">
                <div className={`px-3 py-2 ${getRoomStatusColor(room.status)}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-lg">{room.name}</span>
                    <span className="text-white/90 text-xs font-medium px-2 py-0.5 bg-white/20 rounded-full">
                      {getRoomStatusText(room.status)}
                    </span>
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <p className="font-semibold text-primary mb-2">
                    {formatCurrency(room.base_rent)}/tháng
                  </p>
                  <div className="flex-1 min-h-[3.25rem]">
                    {tenant ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{tenant.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{tenant.phone}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {room.status === 'maintenance' ? 'Đang bảo trì' : 'Chưa có khách'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="px-3 pb-3 pt-1 flex gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 gap-1.5"
                    onClick={() => {
                      setEditForm({
                        room_id: room.id,
                        name: room.name,
                        floor: String(room.floor),
                        base_rent: String(room.base_rent),
                        status: room.status,
                        notes: room.notes ?? '',
                        tenant_id: tenant?.id ?? '',
                      })
                      setEditDialogOpen(true)
                    }}
                  >
                    <Edit2 className="w-4 h-4 shrink-0" />
                    Sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 gap-1.5"
                    onClick={() => {
                      setRoomToDelete(room)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="w-4 h-4 shrink-0 text-destructive" />
                    Xoá
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Thêm phòng mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Tên phòng</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="P101"
                className="h-11 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tầng</Label>
                <Input
                  type="number"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                  className="h-11 mt-1"
                />
              </div>
              <div>
                <Label>Giá thuê</Label>
                <FormattedNumberInput
                  value={form.base_rent}
                  onChange={(v) => setForm({ ...form, base_rent: v })}
                  placeholder="3.000.000"
                  className="h-11 mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Trạng thái</Label>
              <Select
                value={form.tenant_id ? 'occupied' : form.status}
                onValueChange={(v) => {
                  if (form.tenant_id) return
                  setForm({ ...form, status: v })
                }}
                disabled={!!form.tenant_id}
              >
                <SelectTrigger className="h-11 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacant">Trống</SelectItem>
                  <SelectItem value="occupied">Đang thuê</SelectItem>
                  <SelectItem value="maintenance">Bảo trì</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Khách thuê (chưa có phòng)</Label>
              <Select
                value={form.tenant_id || NO_TENANT}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    tenant_id: v === NO_TENANT ? '' : v,
                    status: v === NO_TENANT ? form.status : 'occupied',
                  })
                }
              >
                <SelectTrigger className="h-11 mt-1">
                  <SelectValue placeholder="Chọn khách" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TENANT}>Không gán</SelectItem>
                  {unassignedTenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} — {t.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full h-12" onClick={handleAddRoom}>
              Lưu phòng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(next) => {
          setEditDialogOpen(next)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa phòng</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Tên phòng</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="P101"
                className="h-11 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tầng</Label>
                <Input
                  type="number"
                  value={editForm.floor}
                  onChange={(e) => setEditForm((p) => ({ ...p, floor: e.target.value }))}
                  className="h-11 mt-1"
                />
              </div>
              <div>
                <Label>Giá thuê</Label>
                <FormattedNumberInput
                  value={editForm.base_rent}
                  onChange={(v) => setEditForm((p) => ({ ...p, base_rent: v }))}
                  placeholder="3.000.000"
                  className="h-11 mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Trạng thái</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) =>
                  setEditForm((p) => ({ ...p, status: v }))
                }
              >
                <SelectTrigger className="h-11 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacant">Trống</SelectItem>
                  <SelectItem value="occupied">Đang thuê</SelectItem>
                  <SelectItem value="maintenance">Bảo trì</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Khách thuê (chưa có phòng)</Label>
              <Select
                value={editForm.tenant_id || NO_TENANT}
                onValueChange={(v) =>
                  setEditForm((p) => ({
                    ...p,
                    tenant_id: v === NO_TENANT ? '' : v,
                    status:
                      v === NO_TENANT && p.status === 'occupied'
                        ? 'vacant'
                        : v !== NO_TENANT
                          ? 'occupied'
                          : p.status,
                  }))
                }
              >
                <SelectTrigger className="h-11 mt-1">
                  <SelectValue placeholder="Chưa có khách" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TENANT}>Chưa có khách</SelectItem>
                  {editTenantOptions.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} — {t.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ghi chú</Label>
              <Input
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Tuỳ chọn"
                className="h-11 mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full h-12"
              onClick={async () => {
                try {
                  await apiPatch('/api/rooms', {
                    room_id: editForm.room_id,
                    name: editForm.name,
                    floor: Number(editForm.floor),
                    base_rent: Number(editForm.base_rent),
                    status: editForm.status as RoomWithTenant['status'],
                    notes: editForm.notes || null,
                    tenant_id: editForm.tenant_id ? editForm.tenant_id : null,
                  })
                  toast.success('Đã cập nhật phòng')
                  setEditDialogOpen(false)
                  refetch()
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Lỗi')
                }
              }}
              disabled={!editForm.room_id}
            >
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(next) => {
          setDeleteDialogOpen(next)
          if (!next) setRoomToDelete(null)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xoá phòng?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Thao tác này sẽ xoá phòng và dữ liệu liên quan.
          </p>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Huỷ
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-11"
              onClick={async () => {
                if (!roomToDelete) return
                try {
                  await fetch('/api/rooms', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ room_id: roomToDelete.id }),
                  })
                  toast.success('Đã xoá phòng')
                  setDeleteDialogOpen(false)
                  setRoomToDelete(null)
                  refetch()
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
