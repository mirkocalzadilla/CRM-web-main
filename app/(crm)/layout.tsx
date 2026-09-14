import type { ReactNode } from 'react'

import { AuthGuard } from '@/components/auth/auth-guard'
import { RealtimeSync } from '@/components/crm/realtime-sync'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export default function CrmLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <RealtimeSync />
      <div className="relative min-h-screen overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[400px] w-[600px] rounded-full bg-violet-900/15 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[500px] rounded-full bg-fuchsia-900/10 blur-[120px]" />
        </div>

        <div className="relative z-10 flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
