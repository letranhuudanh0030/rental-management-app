'use client'

import { useState } from 'react'
import { Plus, User, Phone } from 'lucide-react'
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
import { useFetch, apiPost } from '@/hooks/use-fetch'
import type { RoomWithTenant, Tenant } from '@/lib/types/database'

export default function TenantsPage() {
  const { data: rooms, refetch: refetchRooms } = useFetch<RoomWithTenant[]>('/api/rooms')
  const { data: tenants, loading, refetch } = useFetch<Tenant[]>('/api/tenants')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    id_number: '',
    room_id: '',
  })

  const vacantRooms = (rooms ?? []).filter((r) => r.status === 'vacant')

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
      <header className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Khách thuê</h1>
        <Button size="sm" className="h-10 gap-1" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          Thêm
        </Button>
      </header>

      <div className="px-4 space-y-2">
        {(tenants ?? []).map((tenant) => (
          <Card key={tenant.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{tenant.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {tenant.phone}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-10"
                onClick={() => window.open(`tel:${tenant.phone}`)}
              >
                Gọi
              </Button>
            </CardContent>
          </Card>
        ))}
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
    </div>
  )
}
