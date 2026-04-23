"use client"

import { useSession } from '@/components/providers/session-provider'
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { TaskForm } from "@/components/tasks/task-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Task } from "@/types/task"
import { getApiUrl } from "@/lib/api"

export default function EditTaskPageClient({ id }: { id?: string }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const taskId = id || (params?.id as string)

  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  const [employees, setEmployees] = useState<any[]>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated" && taskId) {
      fetchTask()
      fetchEmployees()
    }
  }, [status, taskId])

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees")
      if (res.ok) {
        const data = await res.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
    }
  }

  const fetchTask = async () => {
    try {
      const res = await fetch(getApiUrl(`/api/tasks/${params.id}`))
      if (!res.ok) throw new Error("Task not found")
      const data = await res.json()
      setTask(data)
    } catch (error) {
      console.error("Error fetching task:", error)
      router.replace("/tasks")
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

  if (!task) return null

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tasks
        </Button>
        <Card className="max-w-2xl mx-auto border-border">
          <CardHeader>
            <CardTitle>Edit Task: {task.task}</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskForm
              task={task}
              mode="edit"
              userRole={(session?.user as any)?.role}
              userName={session?.user?.name || ""}
              employees={employees}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
