"use client"

import { useSession } from '@/components/providers/session-provider'
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState, useCallback } from "react"
import { Header } from "@/components/layout/header"
import { TaskDeck } from "@/components/tasks/task-deck"
import { Loader2, Plus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { User, UserRole } from "@/types/user"
import { ROLE_PERMISSIONS } from "@/types/user"

function TasksPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const filter = searchParams?.get('filter')
  const statusFilter = searchParams?.get('status')
  
  const isReviewFilter = filter === 'review' || statusFilter === 'REVIEW'
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    if (!session?.user?.email) return

    try {
      const res = await fetch("/api/employees")
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

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Safe permission access
  const userRole = (user?.role || (session?.user as any)?.role || "Viewer") as UserRole
  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS["Viewer"]

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      {loading || !user ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
          {/* Back button when in review mode */}
          {isReviewFilter && (
            <Button
              variant="ghost"
              onClick={() => router.push('/tasks')}
              className="mb-4 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to All Tasks
            </Button>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {isReviewFilter ? 'Review Tasks' : 'Tasks'}
              </h1>
              <p className="text-muted-foreground">
                {isReviewFilter 
                  ? 'Tasks that need your review and approval' 
                  : 'Manage and track team progress'}
              </p>
            </div>
            {!isReviewFilter && permissions.canCreateTasks && (
              <Button onClick={() => router.push("/tasks/new")} className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Create Task
              </Button>
            )}
          </div>

          {/* Pass the review filter to TaskList component */}
          <TaskDeck user={user} reviewOnly={isReviewFilter} />
        </main>
      )}
    </div>
  );
}

export default function TasksPageClient() {
  return (
    <Suspense fallback={
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
}>
  <TaskDeck user={user} reviewOnly={isReviewFilter} />
</Suspense>
  );
}