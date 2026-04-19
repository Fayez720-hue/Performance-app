"use client"

import { useSession } from '@/components/providers/session-provider'
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { TaskDeck as TaskList } from "@/components/tasks/task-deck"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { User, UserRole } from "@/types/user"
import { ROLE_PERMISSIONS } from "@/types/user"
import { getApiUrl } from "@/lib/api"

export default function TasksPageClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchUser()
    }
  }, [status, router])

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/employees")
      if (!res.ok) throw new Error("Failed to fetch users")
      const users = await res.json()
      const currentUser = users.find((u: User) => u.email.toLowerCase() === session?.user?.email?.toLowerCase())

      if (currentUser) {
        setUser(currentUser)
      } else {
        const role = (session?.user as any).role || "Team Member";
        setUser({
          email: session?.user?.email || "",
          name: session?.user?.name || "Guest",
          role: (ROLE_PERMISSIONS[role as UserRole] ? role : "Team Member") as UserRole
        })
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      // Fallback to session data if API fails
      const role = (session?.user as any).role || "Team Member";
      setUser({
        email: session?.user?.email || "",
        name: session?.user?.name || "Guest",
        role: (ROLE_PERMISSIONS[role as UserRole] ? role : "Team Member") as UserRole
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const permissions = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS["Viewer"]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Tasks</h1>
            <p className="text-muted-foreground">Manage and track team progress</p>
          </div>
          {permissions.canCreateTasks && (
            <Button onClick={() => router.push("/tasks/new")} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Create Task
            </Button>
          )}
        </div>
        <TaskList user={user!} />
      </main>
    </div>
  )
}
