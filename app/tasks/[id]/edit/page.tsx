export const runtime = 'edge'
"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { TaskForm } from "@/components/tasks/task-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Task } from "@/types/task"
import { getApiUrl } from "@/lib/api"

export default function EditTaskPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchTask()
    }
  }, [status, params.id])

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
              initialData={task}
              onSuccess={() => router.push("/tasks")}
              isEditing
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
