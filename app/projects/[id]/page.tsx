"use client"

import { useSession } from '@/components/providers/session-provider'
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { TaskDeck } from "@/components/tasks/task-deck"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Plus } from "lucide-react"
import type { User } from "@/types/user"
import { MediaRenderer } from "@/components/tasks/media-renderer"

export default function ProjectDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [project, setProject] = useState<any>(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  const userRole = (session?.user as any)?.role
  const canManage = userRole === "Admin" || userRole === "Manager"

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && !canManage) {
      router.push("/dashboard")
    }
  }, [status])

  useEffect(() => {
    if (session?.user) {
      fetchProject()
      setUser({
        email: session.user.email || "",
        name: session.user.name || "User",
        role: userRole || "Team Member",
      })
    }
  }, [session, params.id])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setProject(data.project)
        setProgress(data.progress)
      }
    } catch (error) {
      console.error("Failed to fetch project:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

    return (
    <div className="flex-1 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/projects")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{project?.name}</h1>
            {project?.description && (
              <p className="text-muted-foreground text-sm">{project.description}</p>
            )}
            {project?.assignedTo && (
            <p className="text-sm text-muted-foreground mt-1">
           👤 Assigned to: <span className="font-medium text-foreground">{project.assignedTo}</span>
           </p>
          )}
            {project?.attachments && (
              <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Attachments</h3>
                <MediaRenderer text={project.attachments} />
              </div>
            )}
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">{progress}%</span>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-3 mb-8">
          <div
            className="bg-primary h-3 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {user && <TaskDeck user={user} projectId={parseInt(params.id as string)} />}
      </main>

      {canManage && (
        <button
          onClick={() => router.push(`/tasks/new?projectId=${params.id}`)}
          className="fixed bottom-8 right-8 h-14 w-14 bg-teal-500 rounded-2xl shadow-[0_10px_30px_rgba(20,184,166,0.3)] flex items-center justify-center group active:scale-90 transition-all z-40 border border-teal-400/20"
        >
          <Plus className="text-white h-7 w-7 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      )}
    </div>
  )
}