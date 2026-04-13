"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ROLE_PERMISSIONS, type User, type UserRole } from "@/types/user"
import { TaskForm } from "@/components/tasks/task-form"
import { Header } from "@/components/layout/header"
import { Loader2 } from "lucide-react"
import { getApiUrl } from "@/lib/api"

export default function NewTaskPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [employeeNames, setEmployeeNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      const res = await fetch(getApiUrl("/api/users"))
      const users = await res.json()

      const currentUser = users.find((u: User) => u.email === session?.user?.email)

      const names = users.length > 0
        ? users.map((u: User) => u.name).filter(Boolean)
        : ["Abdel Rahman Talaat", "Ahmed Fayez", "Malak Abdel Aziz", "Mohamed Abdel Sattar", "Haneen Abdel Fattah", "Amira Sobhy", "Obada Hisham"];

      setEmployeeNames(names)

      if (currentUser) {
        setUser(currentUser)
      } else {
        setUser({
          email: session?.user?.email || "",
          name: session?.user?.name || "Guest",
          role: ((session?.user as any).role || "Admin") as UserRole
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
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

  if (!user || !ROLE_PERMISSIONS[user.role].canCreateTasks) {
    router.replace("/")
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <TaskForm
          mode="create"
          userRole={user.role}
          userName={user.name}
          employees={employeeNames}
        />
      </main>
    </div>
  )
}
