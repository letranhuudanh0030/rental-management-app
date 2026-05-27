'use client'

import { Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Copy, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFetch } from '@/hooks/use-fetch'
import {
  DEBT_REMINDER_TEMPLATES,
  buildReminderBody,
} from '@/lib/constants/reminders'
import type { InvoiceWithDetails } from '@/lib/types/database'
import {
  formatCurrency,
  formatMonthLabel,
  isPaidStatus,
} from '@/lib/utils/format'

function RemindersContent() {
  const searchParams = useSearchParams()
  const invoiceId = searchParams.get('invoice')
  const { data: invoices } = useFetch<InvoiceWithDetails[]>('/api/invoices')
  const [selectedTemplate, setSelectedTemplate] = useState(DEBT_REMINDER_TEMPLATES[0].id)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoiceId ?? '')

  const unpaidInvoices = useMemo(
    () => (invoices ?? []).filter((i) => !isPaidStatus(i.payment_status)),
    [invoices]
  )

  const invoice =
    unpaidInvoices.find((i) => i.id === selectedInvoiceId) ?? unpaidInvoices[0]

  const template =
    DEBT_REMINDER_TEMPLATES.find((t) => t.id === selectedTemplate) ??
    DEBT_REMINDER_TEMPLATES[0]

  const message = invoice
    ? buildReminderBody(template, {
        tenantName: invoice.tenant?.name ?? 'Anh/Chị',
        roomName: invoice.room?.name ?? '',
        amount: formatCurrency(invoice.total_amount),
        dueDate: new Date(invoice.due_date).toLocaleDateString('vi-VN'),
        monthLabel: formatMonthLabel(invoice.period_month),
      })
    : 'Chọn hóa đơn để tạo tin nhắn nhắc nợ.'

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message)
    toast.success('Đã sao chép')
  }

  const openZalo = () => {
    if (!invoice?.tenant?.phone) return
    const phone = invoice.tenant.phone.replace(/^0/, '84')
    window.open(`https://zalo.me/${phone}`)
  }

  return (
    <div className="pb-6">
      <header className="px-4 pt-4 pb-3 flex items-center gap-3">
        <Link href="/payments">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Mẫu nhắc nợ</h1>
      </header>

      <div className="px-4 space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Chọn hóa đơn</p>
          <select
            className="w-full h-12 rounded-lg border bg-background px-3 text-base"
            value={selectedInvoiceId || invoice?.id || ''}
            onChange={(e) => setSelectedInvoiceId(e.target.value)}
          >
            {unpaidInvoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.room?.name} — {inv.tenant?.name} — {formatCurrency(inv.total_amount)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {DEBT_REMINDER_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTemplate(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedTemplate === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Nội dung tin nhắn</p>
            <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
              {message}
            </pre>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button className="flex-1 h-12 gap-2" onClick={copyMessage}>
            <Copy className="w-4 h-4" />
            Sao chép
          </Button>
          <Button variant="outline" className="flex-1 h-12" onClick={openZalo}>
            Mở Zalo
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function RemindersPage() {
  return (
    <Suspense fallback={<div className="p-4">Đang tải...</div>}>
      <RemindersContent />
    </Suspense>
  )
}
