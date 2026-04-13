"use client"

import { useState } from "react"
import useSWR from "swr"
import { formatDistanceToNow } from "date-fns"
import { Bell, CheckCheck, ClipboardList, MessageSquare, Send, Loader2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Notification, NotificationType } from "@/types/user"
import { getApiUrl } from "@/lib/api"

const _fetcher = (url: string) => fetch(getApiUrl(url)).then((res) => res.json())

const notificationIcons: Record<NotificationType, typeof Bell> = {
  task_assigned: ClipboardList,
  progress_updated: Send,
  submitted_for_review: Send,
  revisions_requested: MessageSquare,
  task_completed: CheckCheck,
}

const notificationColors: Record<NotificationType, string> = {
  task_assigned: "text-primary",
  progress_updated: "text-amber-400",
  submitted_for_review: "text-blue-400",
  revisions_requested: "text-amber-400",
  task_completed: "text-emerald-400",
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data: notifications, mutate, isLoading } = useSWR<Notification[]>(
    "/api/notifications",
    _fetcher,
    { refreshInterval: 60000 }
  )

  const unreadCount = notifications?.filter((n) => !n.read).length || 0

  async function handleMarkAsRead() {
    await fetch(getApiUrl("/api/notifications"), { method: "PUT" })
    mutate()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground"
              onClick={handleMarkAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type]
                const color = notificationColors[notification.type]

                return (
                  <Link
                    key={notification.id}
                    href={`/tasks/${notification.taskId}/edit`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                      !notification.read && "bg-primary/5"
                    )}
                  >
                    <div className={cn("mt-0.5 flex-shrink-0", color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "line-clamp-2 text-sm",
                        !notification.read && "font-medium"
                      )}>
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                    )}
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
