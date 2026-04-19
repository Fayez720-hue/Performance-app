"use client"

import Link from "next/link"
import { useSession } from '@/components/providers/session-provider'
import { ClipboardList, Users, BarChart3, Settings } from "lucide-react"
import { UserNav } from "@/components/auth/user-nav"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { ROLE_PERMISSIONS } from "@/types/user"
import type { UserRole } from "@/types/user"

export function Header() {
  const { data: session } = useSession()
  const role = session?.user?.role as UserRole
  const permissions = role ? ROLE_PERMISSIONS[role] : null
  const isAdmin = role === "Admin" || permissions?.canManageUsers

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" suppressHydrationWarning />
            </div>
            <span className="text-lg font-semibold text-foreground">Task Manager</span>
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Dashboard
            </Link>
            <Link
              href="/tasks"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Tasks
            </Link>
            <Link
              href="/reports"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <BarChart3 className="h-4 w-4" suppressHydrationWarning />
              Reports
            </Link>
            {isAdmin && (
              <Link
                href="/admin/users"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <Users className="h-4 w-4" suppressHydrationWarning />
                Users
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {session && <NotificationBell />}
          <Link
            href="/settings"
            className="p-2 rounded-full hover:bg-muted text-muted-foreground"
            title="Settings"
          >
            <Settings className="h-5 w-5" suppressHydrationWarning />
          </Link>
          <UserNav />
        </div>
      </div>
    </header>
  )
}
