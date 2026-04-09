"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { ClipboardList, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/auth/user-nav"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { ROLE_PERMISSIONS } from "@/types/user"
import type { UserRole } from "@/types/user"

export function Header() {
  const { data: session } = useSession()
  
  const userRole = session?.user?.role as UserRole | undefined
  const canCreateTasks = userRole ? ROLE_PERMISSIONS[userRole]?.canCreateTasks : false

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold text-foreground">Task Manager</span>
        </Link>

        <div className="flex items-center gap-3">
          {session && <NotificationBell />}
          
          <UserNav />
        </div>
      </div>

      {/* Floating Action Button for mobile/Android experience */}
      {canCreateTasks && (
        <Link
          href="/tasks/new"
          className="fixed bottom-8 right-8 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95 sm:bottom-12 sm:right-12"
        >
          <Plus className="h-7 w-7" />
          <span className="sr-only">Add New Task</span>
        </Link>
      )}
    </header>
  )
}
