"use client"

import Link from "next/link"
import { useSession } from '@/components/providers/session-provider'
import { ClipboardList, Users, BarChart3, Settings } from "lucide-react"
import { UserNav } from "@/components/auth/user-nav"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ROLE_PERMISSIONS } from "@/types/user"
import type { UserRole } from "@/types/user"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-1" />
          <div className="h-6 w-px bg-border/50 mx-2 hidden md:block" />
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10">
              <ClipboardList className="h-5 w-5 text-teal-400" suppressHydrationWarning />
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight hidden sm:block">Can shift</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {session && <NotificationBell />}
          <Link
            href="/settings"
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" suppressHydrationWarning />
          </Link>
          <div className="h-8 w-px bg-border/50 mx-1" />
          <UserNav />
        </div>
      </div>
    </header>
  )
}
