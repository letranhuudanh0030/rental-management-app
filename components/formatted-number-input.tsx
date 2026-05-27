'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatDigitsWithDots, stripNumberFormatting } from '@/lib/utils/format'

interface FormattedNumberInputProps {
  value: string
  onChange: (rawDigits: string) => void
  className?: string
  placeholder?: string
  id?: string
}

/** Input lưu chuỗi số thô; hiển thị dạng 1.000.000 khi không focus */
export function FormattedNumberInput({
  value,
  onChange,
  className,
  placeholder,
  id,
}: FormattedNumberInputProps) {
  const [focused, setFocused] = useState(false)
  const raw = stripNumberFormatting(value)
  const displayValue = focused ? raw : raw ? formatDigitsWithDots(raw) : ''

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      value={displayValue}
      onChange={(e) => onChange(stripNumberFormatting(e.target.value))}
      onFocus={(e) => {
        setFocused(true)
        e.currentTarget.select()
      }}
      onBlur={() => setFocused(false)}
      className={cn(className)}
    />
  )
}
