'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { apiPatch, apiPost } from '@/hooks/use-fetch'
import type { LandlordSettings } from '@/lib/types/database'

export default function SettingsPage() {
  const [settings, setSettings] = useState<LandlordSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then(setSettings)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!settings) return
    try {
      const updated = await apiPatch<LandlordSettings>('/api/settings', {
        property_name: settings.property_name,
        electric_price: settings.electric_price,
        water_price: settings.water_price,
        invoice_due_day: settings.invoice_due_day,
        garbage_price: settings.garbage_price
      })
      setSettings(updated)
      toast.success('Đã lưu cài đặt')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi')
    }
  }

  const handleSeed = async () => {
    try {
      const result = await apiPost<{ message: string }>('/api/seed')
      toast.success(result.message)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi')
    }
  }

  if (loading || !settings) {
    return <div className="p-4">Đang tải...</div>
  }

  return (
    <div className="pb-6 px-4 pt-4 space-y-4">
      <h1 className="text-xl font-bold">Cài đặt</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin nhà trọ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tên nhà trọ</Label>
            <Input
              className="h-12 mt-1"
              value={settings.property_name}
              onChange={(e) =>
                setSettings({ ...settings, property_name: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Giá điện (đ/kWh)</Label>
              <Input
                type="number"
                className="h-12 mt-1"
                value={settings.electric_price}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    electric_price: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label>Giá nước (đ/m³)</Label>
              <Input
                type="number"
                className="h-12 mt-1"
                value={settings.water_price}
                onChange={(e) =>
                  setSettings({ ...settings, water_price: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div>
            <Label>Tiền rác</Label>
            <Input
                type="number"
                className="h-12 mt-1"
                value={settings.garbage_price}
                onChange={(e) =>
                  setSettings({ ...settings, garbage_price: Number(e.target.value) })
                }
              />
          </div>
          <div>
            <Label>Ngày hạn thanh toán (tháng sau)</Label>
            <Input
              type="number"
              min={1}
              max={28}
              className="h-12 mt-1"
              value={settings.invoice_due_day}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  invoice_due_day: Number(e.target.value),
                })
              }
            />
          </div>
          <Button className="w-full h-12" onClick={handleSave}>
            Lưu cài đặt
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Tải 12 phòng mẫu, khách thuê và số điện nước để dùng thử nhanh.
          </p>
          <Button variant="outline" className="w-full h-12" onClick={handleSeed}>
            Tải dữ liệu demo
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
