"use client"

import Link from "next/link"
import { useSession } from '@/components/providers/session-provider'
import { ClipboardList, Settings } from "lucide-react"
import { UserNav } from "@/components/auth/user-nav"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#090a11]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#090a11]/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-10 w-10 text-white/50 hover:text-teal-400 hover:bg-teal-500/10 rounded-xl transition-all" />
          <div className="h-6 w-px bg-white/10 mx-2 hidden md:block" />
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]">
              <ClipboardList className="h-5 w-5 text-teal-400" suppressHydrationWarning />
            </div>
            <span className="text-lg font-bold text-white tracking-tight hidden sm:block">Can shift</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {session && <NotificationBell />}
          <Link
            href="/settings"
            className="p-2.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all border border-transparent hover:border-white/5"
            title="Settings"
          >
            <Settings className="h-5 w-5" suppressHydrationWarning />
          </Link>
          <div className="h-8 w-px bg-white/10 mx-1" />
          <UserNav />
        </div>
      </div>
    </header>
  )
}
