"use client"

import Link from "next/link"
import { useSession } from '@/components/providers/session-provider'
import { ClipboardList, Settings } from "lucide-react"
import { UserNav } from "@/components/auth/user-nav"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { SidebarToggle } from "./sidebar-toggle"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#090a11]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#090a11]/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <SidebarToggle />
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