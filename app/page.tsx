'use client'

import { useState } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { Dashboard } from '@/components/dashboard'
import { RoomList } from '@/components/room-list'
import { MeterInput } from '@/components/meter-input'
import { BillingPage } from '@/components/billing-page'
import { PaymentTracking } from '@/components/payment-tracking'

type TabId = 'dashboard' | 'rooms' | 'meters' | 'bills' | 'payments'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')

  const handleNavigate = (tab: TabId) => {
    setActiveTab(tab)
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      {activeTab === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
      {activeTab === 'rooms' && <RoomList />}
      {activeTab === 'meters' && <MeterInput />}
      {activeTab === 'bills' && <BillingPage />}
      {activeTab === 'payments' && <PaymentTracking />}
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  )
}
