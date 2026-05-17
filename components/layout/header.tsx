"use client"

import Image from 'next/image';
import Link from "next/link"
import { useSession } from '@/components/providers/session-provider'
import { Settings } from "lucide-react"
import { UserNav } from "@/components/auth/user-nav"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { SidebarToggle } from "./sidebar-toggle"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <SidebarToggle />
          
          {/* Logo and Company Name */}
          <Link href="/dashboard" className="flex items-center gap-2 ml-2 transition-opacity hover:opacity-80">
            <div className="relative w-8 h-8 overflow-hidden rounded-lg bg-primary/10 flex items-center justify-center">
              <Image
                src="/CANSHIFTTT-02.png"
                alt="CAN SHIFT"
                width={32}
                height={32}
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <span className="text-foreground font-bold text-sm leading-tight block">
                CANSHIFT
              </span>
              <span className="text-primary text-[8px] font-medium tracking-wide block">
                MARKETING & PRODUCTION
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {session && <NotificationBell />}
          <Link
            href="/settings"
            className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border"
            title="Settings"
          >
            <Settings className="h-5 w-5" suppressHydrationWarning />
          </Link>
          <div className="h-8 w-px bg-border mx-1" />
          <UserNav />
        </div>
      </div>
    </header>
  )
}