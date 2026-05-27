'use client'

import { LayoutGrid, Table2 } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { MeterInputView } from '@/lib/constants/meter-input'
import { cn } from '@/lib/utils'

interface MeterViewToggleProps {
  value: MeterInputView
  onChange: (view: MeterInputView) => void
  className?: string
}

export function MeterViewToggle({ value, onChange, className }: MeterViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v === 'cards' || v === 'spreadsheet') onChange(v)
      }}
      variant="outline"
      size="sm"
      className={cn('w-full', className)}
    >
      <ToggleGroupItem
        value="cards"
        aria-label="Chế độ thẻ"
        className="flex-1 gap-1.5 text-xs sm:text-sm"
      >
        <LayoutGrid className="w-4 h-4 shrink-0" />
        Thẻ
      </ToggleGroupItem>
      <ToggleGroupItem
        value="spreadsheet"
        aria-label="Chế độ bảng"
        className="flex-1 gap-1.5 text-xs sm:text-sm"
      >
        <Table2 className="w-4 h-4 shrink-0" />
        Bảng
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
