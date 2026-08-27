'use client'

import { useState } from 'react'
import { FileText, History, RefreshCw, SquarePen, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { apiPost, useFetch } from '@/hooks/use-fetch'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ContractStatus } from '@/lib/types/database'

type ContractRow = {
  id: string
  start_date: string
  end_date: string | null
  monthly_rent: number
  status: ContractStatus
  termination_reason: string | null
  rooms: { name: string } | { name: string }[] | null
  tenants: { name: string; phone: string } | { name: string; phone: string }[] | null
}

const formatRoom = (room: ContractRow['rooms']) =>
  Array.isArray(room) ? room[0]?.name : room?.name
const formatTenant = (tenant: ContractRow['tenants']) =>
  Array.isArray(tenant) ? tenant[0] : tenant

function ContractCard({ contract, onRefresh }: { contract: ContractRow; onRefresh: () => void }) {
  const [busy, setBusy] = useState(false)
  const tenant = formatTenant(contract.tenants)
  const roomName = formatRoom(contract.rooms)

  const terminate = async () => {
    const reason = window.prompt('Lý do kết thúc hợp đồng')
    if (!reason) return
    setBusy(true)
    try {
      await apiPost(`/api/contracts/${contract.id}/terminate`, {
        termination_date: new Date().toISOString().slice(0, 10),
        termination_reason: reason,
      })
      toast.success('Đã kết thúc hợp đồng')
      onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể kết thúc hợp đồng')
    } finally {
      setBusy(false)
    }
  }

  const renew = async () => {
    const startDate = window.prompt('Ngày bắt đầu hợp đồng mới (YYYY-MM-DD)', new Date().toISOString().slice(0, 10))
    if (!startDate) return
    setBusy(true)
    try {
      await apiPost(`/api/contracts/${contract.id}/renew`, {
        start_date: startDate,
        end_date: null,
        monthly_rent: contract.monthly_rent,
        deposit: 0,
      })
      toast.success('Đã gia hạn hợp đồng')
      onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gia hạn hợp đồng')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold truncate">{tenant?.name ?? 'Khách thuê'}</p>
            <p className="text-sm text-muted-foreground">Phòng {roomName ?? 'Không xác định'}</p>
          </div>
          <span className="text-xs rounded-full bg-muted px-2 py-1 shrink-0">{contract.status}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><p className="text-muted-foreground">Bắt đầu</p><p>{contract.start_date}</p></div>
          <div><p className="text-muted-foreground">Kết thúc</p><p>{contract.end_date ?? 'Không thời hạn'}</p></div>
        </div>
        {contract.termination_reason && (
          <p className="text-sm text-muted-foreground">Lý do: {contract.termination_reason}</p>
        )}
        {contract.status === 'active' ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" disabled={busy} onClick={terminate}>
              <XCircle className="w-4 h-4" /> Kết thúc
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" disabled={busy} onClick={renew}>
              <RefreshCw className="w-4 h-4" /> Gia hạn
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5" disabled={busy} onClick={renew}>
            <RefreshCw className="w-4 h-4" /> Gia hạn
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function ContractsPage() {
  const { data, loading, refetch } = useFetch<ContractRow[]>('/api/contracts?include_history=true')
  const contracts = data ?? []

  if (loading) {
    return <div className="p-4 space-y-3"><Skeleton className="h-8" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
  }

  return (
    <div className="pb-6">
      <header className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">Hợp đồng</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Theo dõi hợp đồng hiện tại và lịch sử thuê</p>
      </header>
      <Tabs defaultValue="active" className="px-4">
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1 gap-1"><SquarePen className="w-4 h-4" />Đang hiệu lực</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 gap-1"><History className="w-4 h-4" />Lịch sử</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-3 mt-3">
          {contracts.filter((contract) => contract.status === 'active').map((contract) => <ContractCard key={contract.id} contract={contract} onRefresh={refetch} />)}
          {contracts.every((contract) => contract.status !== 'active') && <p className="text-sm text-muted-foreground text-center py-8">Chưa có hợp đồng đang hiệu lực</p>}
        </TabsContent>
        <TabsContent value="history" className="space-y-3 mt-3">
          {contracts.map((contract) => <ContractCard key={contract.id} contract={contract} onRefresh={refetch} />)}
          {contracts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Chưa có lịch sử hợp đồng</p>}
        </TabsContent>
      </Tabs>
    </div>
  )
}
