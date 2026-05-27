'use client'

import { Home, Building2, Gauge, Receipt, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

type TabId = 'dashboard' | 'rooms' | 'meters' | 'bills' | 'payments'

interface BottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: Home },
  { id: 'rooms', label: 'Phòng', icon: Building2 },
  { id: 'meters', label: 'Điện nước', icon: Gauge },
  { id: 'bills', label: 'Hóa đơn', icon: Receipt },
  { id: 'payments', label: 'Thu tiền', icon: CreditCard },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('w-6 h-6', isActive && 'stroke-[2.5]')} />
              <span className={cn('text-xs', isActive ? 'font-semibold' : 'font-medium')}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
