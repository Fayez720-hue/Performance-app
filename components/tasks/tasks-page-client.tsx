"use client"

import { useSession } from '@/components/providers/session-provider'
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState, useCallback } from "react"
import { Header } from "@/components/layout/header"
import { TaskDeck } from "@/components/tasks/task-deck"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { User, UserRole } from "@/types/user"
import { ROLE_PERMISSIONS } from "@/types/user"

function TasksPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const filter = searchParams?.get('filter')
  const isReviewOnly = filter === 'review'

  const fetchUser = useCallback(async () => {
    if (!session?.user?.email) return

    try {
      const res = await fetch("/api/users")
      let currentUser: User | undefined

      if (res.ok) {
        const users = await res.json()
        if (Array.isArray(users)) {
          currentUser = users.find((u: User) => u.email.toLowerCase() === session.user?.email?.toLowerCase())
        }
      }

      if (currentUser) {
        setUser(currentUser)
      } else {
        const rawRole = (session?.user as any)?.role || "Team Member"
        const finalRole = (ROLE_PERMISSIONS[rawRole as UserRole] ? rawRole : "Team Member") as UserRole
        setUser({
          email: session.user.email,
          name: session.user.name || "Guest",
          role: finalRole
        })
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      const rawRole = (session?.user as any)?.role || "Team Member"
      const finalRole = (ROLE_PERMISSIONS[rawRole as UserRole] ? rawRole : "Team Member") as UserRole
      setUser({
        email: session?.user?.email || "",
        name: session?.user?.name || "Guest",
        role: finalRole
      })
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchUser()
    }
  }, [status, router, fetchUser])

  if (status === "loading" || loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const userRole = user.role as UserRole
  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS["Viewer"]

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {isReviewOnly ? "Review Tasks" : "Tasks"}
            </h1>
            <p className="text-muted-foreground">
              {isReviewOnly ? "Approve or request revisions for submissions" : "Manage and track team progress"}
            </p>
          </div>
          {permissions.canCreateTasks && !isReviewOnly && (
            <Button onClick={() => router.push("/tasks/new")} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Create Task
            </Button>
          )}
        </div>
        <TaskDeck user={user} reviewOnly={isReviewOnly} />
      </main>
    </div>
  )
}

export default function TasksPageClient() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <TasksPageContent />
    </Suspense>
  )
}
