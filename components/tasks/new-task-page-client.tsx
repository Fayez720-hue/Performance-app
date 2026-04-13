"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { TaskForm } from "@/components/tasks/task-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NewTaskPageClient() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.replace("/login")
    return null
  }

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
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskForm onSuccess={() => router.push("/tasks")} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
