'use client'

import { useState } from 'react'
import { Banknote, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { apiDelete, apiPost, useFetch } from '@/hooks/use-fetch'
import type { Expense, ExpenseCategory } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils/format'

const categoryLabels: Record<ExpenseCategory, string> = {
  maintenance: 'Sửa chữa',
  utilities: 'Tiện ích',
  tax: 'Thuế/phí',
  other: 'Khác',
}

export default function ExpensesPage() {
  const { data: expenses, loading, refetch } = useFetch<Expense[]>('/api/expenses')
  const [form, setForm] = useState({ category: 'maintenance' as ExpenseCategory, amount: '', expense_date: new Date().toISOString().slice(0, 10), description: '' })
  const [saving, setSaving] = useState(false)

  const addExpense = async () => {
    setSaving(true)
    try {
      await apiPost<Expense>('/api/expenses', { ...form, amount: Number(form.amount), description: form.description || undefined })
      setForm({ ...form, amount: '', description: '' })
      await refetch()
      toast.success('Đã thêm chi phí')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể thêm chi phí')
    } finally {
      setSaving(false)
    }
  }

  const removeExpense = async (id: string) => {
    try {
      await apiDelete(`/api/expenses/${id}`)
      await refetch()
      toast.success('Đã xóa chi phí')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa chi phí')
    }
  }

  return (
    <div className="pb-6 px-4 pt-4 space-y-4">
      <header className="flex items-center gap-2">
        <Banknote className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">Chi phí</h1>
      </header>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Danh mục</Label>
              <select className="h-10 mt-1 w-full rounded-md border bg-background px-3 text-sm" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as ExpenseCategory })}>
                {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <Label>Số tiền</Label>
              <Input className="h-10 mt-1" type="number" min="1" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Ngày</Label><Input className="h-10 mt-1" type="date" value={form.expense_date} onChange={(event) => setForm({ ...form, expense_date: event.target.value })} /></div>
            <div><Label>Mô tả</Label><Input className="h-10 mt-1" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
          </div>
          <Button className="w-full" onClick={addExpense} disabled={saving || !form.amount}><Plus className="w-4 h-4" /> Thêm chi phí</Button>
        </CardContent>
      </Card>

      <Card><CardContent className="p-0 divide-y">
        {loading && <p className="p-4 text-sm text-muted-foreground">Đang tải...</p>}
        {!loading && expenses?.length === 0 && <p className="p-4 text-sm text-muted-foreground">Chưa có chi phí</p>}
        {expenses?.map((expense) => (
          <div key={expense.id} className="p-3 flex items-center justify-between gap-3">
            <div className="min-w-0"><p className="font-medium">{categoryLabels[expense.category]} · {formatCurrency(expense.amount)}</p><p className="text-xs text-muted-foreground">{expense.expense_date}{expense.description ? ` · ${expense.description}` : ''}</p></div>
            <Button variant="ghost" size="icon" aria-label="Xóa chi phí" onClick={() => removeExpense(expense.id)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
      </CardContent></Card>
    </div>
  )
}
