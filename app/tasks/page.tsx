"use client"

export const runtime = 'edge'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { TaskDeck } from "@/components/tasks/task-deck"
import { Plus, Loader2 } from "lucide-react"
import Link from "next/link"
import type { User, UserRole } from "@/types/user"
import { getApiUrl } from "@/lib/api"

export default function TasksPage() {
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
      const res = await fetch(getApiUrl("/api/users"))
      const users = await res.json()
      const currentUser = users.find((u: User) => u.email === session?.user?.email)

      if (currentUser) {
        setUser(currentUser)
      } else {
        // Fallback
        setUser({
          email: session?.user?.email || "",
          name: session?.user?.name || "Guest",
          role: ((session?.user as any).role || "Viewer") as UserRole
        })
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session || !user) return null

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            ← Back to Dashboard
          </Link>
        </div>
        
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Task Dashboard</h1>
          <p className="text-muted-foreground">
            {user.role === "Team Member"
              ? "View and manage your assigned tasks"
              : "Manage and track all team tasks"}
          </p>
        </div>
        
        <TaskDeck userRole={user.role} userName={user.name} />

        {/* Floating Action Button - Only for Admins and Managers */}
        {(user.role?.toLowerCase() === "admin" || user.role?.toLowerCase() === "manager") && (
          <div className="fixed bottom-28 left-0 right-0 pointer-events-none z-50">
            <div className="container mx-auto px-4 relative h-0">
              <Link
                href="/tasks/new"
                className="absolute right-4 bottom-0 pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl transition-transform hover:scale-110 active:scale-95 sm:right-8"
              >
                <Plus className="h-8 w-8" />
                <span className="sr-only">Add New Task</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
