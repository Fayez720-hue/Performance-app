"use client"

import { useSession } from '@/components/providers/session-provider'
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ROLE_PERMISSIONS, type User, type UserRole } from "@/types/user"
import { Header } from "@/components/layout/header"
import { UserManagement } from "@/components/admin/user-management"
import { Loader2 } from "lucide-react"
import { getApiUrl } from "@/lib/api"

export default function AdminUsersPageClient() {
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

  if (!user || !ROLE_PERMISSIONS[user.role].canManageUsers) {
    router.replace("/")
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <UserManagement />
      </main>
    </div>
  )
}
