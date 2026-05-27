'use client'

import { useEffect, useState } from 'react'
import { MeterCards } from '@/components/meter-cards'
import { MeterSpreadsheet } from '@/components/meter-spreadsheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  readMeterInputView,
  syncMeterInputViewDataset,
  writeMeterInputView,
  type MeterInputView,
} from '@/lib/constants/meter-input'
import { currentPeriodMonth } from '@/lib/utils/format'

export function MetersPage() {
  const [view, setView] = useState<MeterInputView>('spreadsheet')
  const [hydrated, setHydrated] = useState(false)
  const [periodMonth, setPeriodMonth] = useState(currentPeriodMonth)

  useEffect(() => {
    const saved = readMeterInputView()
    setView(saved)
    syncMeterInputViewDataset(saved)
    setHydrated(true)
  }, [])

  const handleViewChange = (next: MeterInputView) => {
    setView(next)
    writeMeterInputView(next)
  }

  if (!hydrated) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  const shared = {
    periodMonth,
    onPeriodChange: setPeriodMonth,
    view,
    onViewChange: handleViewChange,
  }

  if (view === 'cards') {
    return <MeterCards {...shared} />
  }

  return <MeterSpreadsheet {...shared} />
}
