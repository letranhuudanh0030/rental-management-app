'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, User, Phone } from 'lucide-react'
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
import { useFetch, apiPost } from '@/hooks/use-fetch'
import type { RoomWithTenant } from '@/lib/types/database'
import {
  formatCurrency,
  getRoomStatusColor,
  getRoomStatusText,
} from '@/lib/utils/format'

export default function RoomsPage() {
  const { data: rooms, loading, refetch } = useFetch<RoomWithTenant[]>('/api/rooms')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    floor: '1',
    base_rent: '',
    status: 'vacant',
  })

  const floors = useMemo(
    () => [...new Set((rooms ?? []).map((r) => r.floor))].sort((a, b) => a - b),
    [rooms]
  )

  const filteredRooms = (rooms ?? []).filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFloor = selectedFloor === null || room.floor === selectedFloor
    return matchesSearch && matchesFloor
  })

  const handleAddRoom = async () => {
    try {
      await apiPost('/api/rooms', {
        name: form.name,
        floor: Number(form.floor),
        base_rent: Number(form.base_rent),
        status: form.status,
      })
      toast.success('Đã thêm phòng')
      setDialogOpen(false)
      setForm({ name: '', floor: '1', base_rent: '', status: 'vacant' })
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

      <div className="px-4 grid grid-cols-2 gap-3">
        {filteredRooms.map((room) => {
          const tenant = room.tenant
          return (
            <Card key={room.id} className="overflow-hidden active:scale-[0.98] transition-transform">
              <CardContent className="p-0">
                <div className={`px-3 py-2 ${getRoomStatusColor(room.status)}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-lg">{room.name}</span>
                    <span className="text-white/90 text-xs font-medium px-2 py-0.5 bg-white/20 rounded-full">
                      {getRoomStatusText(room.status)}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-primary mb-2">
                    {formatCurrency(room.base_rent)}/tháng
                  </p>
                  {tenant ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="truncate">{tenant.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{tenant.phone}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {room.status === 'maintenance' ? 'Đang bảo trì' : 'Chưa có khách'}
                    </p>
                  )}
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
                <Input
                  type="number"
                  value={form.base_rent}
                  onChange={(e) => setForm({ ...form, base_rent: e.target.value })}
                  placeholder="3000000"
                  className="h-11 mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Trạng thái</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
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
          </div>
          <DialogFooter>
            <Button className="w-full h-12" onClick={handleAddRoom}>
              Lưu phòng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
