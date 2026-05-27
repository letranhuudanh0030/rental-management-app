'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Building2, Gauge, Receipt, CreditCard, LogOut, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  METER_INPUT_VIEW_EVENT,
  readMeterInputView,
  type MeterInputView,
} from '@/lib/constants/meter-input'

const tabs = [
  { href: '/', label: 'Tổng quan', icon: Home },
  { href: '/rooms', label: 'Phòng', icon: Building2 },
  { href: '/meters', label: 'Điện nước', icon: Gauge },
  { href: '/bills', label: 'Hóa đơn', icon: Receipt },
  { href: '/payments', label: 'Thu tiền', icon: CreditCard },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const [meterView, setMeterView] = useState<MeterInputView>('spreadsheet')

  useEffect(() => {
    if (!pathname.startsWith('/meters')) return
    setMeterView(readMeterInputView())
    const onViewChange = () => setMeterView(readMeterInputView())
    window.addEventListener(METER_INPUT_VIEW_EVENT, onViewChange)
    return () => window.removeEventListener(METER_INPUT_VIEW_EVENT, onViewChange)
  }, [pathname])

  const isWidePage = pathname.startsWith('/meters') && meterView === 'spreadsheet'

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className={cn('mx-auto', isWidePage ? 'max-w-3xl w-full' : 'max-w-lg')}>
        {children}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive =
              tab.href === '/'
                ? pathname === '/'
                : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className={cn('w-6 h-6', isActive && 'stroke-[2.5]')} />
                <span className={cn('text-xs', isActive ? 'font-semibold' : 'font-medium')}>
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {(pathname === '/payments' || pathname === '/') && (
        <Link
          href="/reminders"
          className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
          aria-label="Mẫu nhắc nợ"
        >
          <MessageSquare className="w-5 h-5" />
        </Link>
      )}

      {pathname === '/settings' && (
        <div className="fixed top-4 right-4 z-40 max-w-lg mx-auto w-full flex justify-end px-4">
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </Button>
        </div>
      )}
    </div>
  )
}
