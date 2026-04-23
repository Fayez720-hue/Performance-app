"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Header } from "@/components/layout/header"
import { TaskForm } from "@/components/tasks/task-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function NewTaskPageClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [employees, setEmployees] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)

  const fetchEmployees = useCallback(async () => {
    setIsLoadingEmployees(true)
    try {
      const res = await fetch("/api/employees")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setEmployees(data)
        }
      } else {
        console.error("Failed to fetch employees:", res.status)
      }
    } catch (err) {
      console.error("Error fetching employees:", err)
    } finally {
      setIsLoadingEmployees(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchEmployees()
    }
  }, [status, router, fetchEmployees])

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  // Fallback role/name to avoid undefined crashes
  const userRole = (session?.user as any)?.role || "Team Member"
  const userName = session?.user?.name || ""

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

        {error ? (
          <Alert variant="destructive" className="max-w-2xl mx-auto mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="max-w-2xl mx-auto border-border shadow-sm">
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent>
            {/* We pass a key to force re-render when name/role is finally ready */}
            <TaskForm
              key={`${userName}-${userRole}`}
              mode="create"
              userRole={userRole}
              userName={userName}
              employees={employees}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
