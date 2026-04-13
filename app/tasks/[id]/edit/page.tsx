"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState, use } from "react"
import { ROLE_PERMISSIONS, type User, type UserRole } from "@/types/user"
import { TaskForm } from "@/components/tasks/task-form"
import { Header } from "@/components/layout/header"
import { Loader2 } from "lucide-react"
import type { Task } from "@/types/task"
import { getApiUrl } from "@/lib/api"

export default function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [task, setTask] = useState<Task | null>(null)
  const [employeeNames, setEmployeeNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchData()
    }
  }, [status, router, id])

  const fetchData = async () => {
    try {
      // Fetch users and task in parallel
      const [usersRes, taskRes] = await Promise.all([
        fetch(getApiUrl("/api/users")),
        fetch(getApiUrl(`/api/tasks/${id}`))
      ])

      if (!taskRes.ok) {
        router.replace("/tasks")
        return
      }

      const users = await usersRes.json()
      const taskData = await taskRes.json()

      const currentUser = users.find((u: User) => u.email === session?.user?.email)
      const names = users.map((u: User) => u.name).filter(Boolean)

      setTask(taskData)
      setEmployeeNames(names)

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

  if (!user || !task) return null

  const permissions = ROLE_PERMISSIONS[user.role]
  const canEdit = permissions.canEditAllTasks ||
    (permissions.canEditOwnTasks && task.name === user.name)

  if (!canEdit) {
    router.replace("/")
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <TaskForm
          task={task}
          mode="edit"
          userRole={user.role}
          userName={user.name}
          employees={employeeNames}
        />
      </main>
    </div>
  )
}
