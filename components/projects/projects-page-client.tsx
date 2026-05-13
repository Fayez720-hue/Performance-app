"use client"

import { useSession } from '@/components/providers/session-provider'
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, Plus, FolderKanban, Trash2, Pencil } from "lucide-react"
import { MediaUpload } from "@/components/tasks/media-upload"
import { MediaRenderer } from "@/components/tasks/media-renderer"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ROLE_PERMISSIONS, type UserRole } from '@/types/user'

export default function ProjectsPageClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const [attachments, setAttachments] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [editingProject, setEditingProject] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  
  const userRole = (session?.user as any)?.role as UserRole || "Team Member"
  const permissions = ROLE_PERMISSIONS[userRole]

  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => setEmployees([]))
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      // Allow both Admin and Manager to view projects
      if (permissions.canViewAllProjects) {
        fetchProjects()
      } else {
        router.push("/dashboard")
      }
    }
  }, [status, permissions.canViewAllProjects])

  const handleDelete = async (id: number, name: string) => {
    // Only allow if user has delete permissions
    if (!permissions.canDeleteProjects) {
      toast.error("You don't have permission to delete projects")
      return
    }
    
    if (!confirm(`Delete project "${name}"? Tasks will not be deleted, just unlinked.`)) return
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Project deleted")
        fetchProjects()
      } else {
        toast.error("Failed to delete project")
      }
    } catch (error) {
      toast.error("Error deleting project")
    }
  }
  
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject) return
    setCreating(true)
    try {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: editingProject.name, 
          description: editingProject.description,
          attachments: editingProject.attachments,
          assignedTo: editingProject.assignedTo 
        }),
      })
      if (res.ok) {
        toast.success("Project updated")
        setEditingProject(null)
        fetchProjects()
      } else {
        toast.error("Failed to update project")
      }
    } catch (error) {
      toast.error("Error updating project")
    } finally {
      setCreating(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects")
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, attachments, assignedTo: assignedTo === "none" ? "" : assignedTo }),
      })
      if (res.ok) {
        toast.success("Project created")
        setName("")
        setDescription("")
        setAttachments("")
        setAssignedTo("")
        setShowCreate(false)
        fetchProjects()
      } else {
        toast.error("Failed to create project")
      }
    } catch (error) {
      toast.error("Error creating project")
    } finally {
      setCreating(false)
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
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects</h1>
            <p className="text-muted-foreground text-sm">Manage project-based tasks</p>
          </div>
          {permissions.canCreateProjects && (
            <Button onClick={() => setShowCreate(!showCreate)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          )}
        </div>

        {/* Create Project Form */}
        {showCreate && permissions.canCreateProjects && (
          <Card className="mb-8 border-border">
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>Projects group related tasks together</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project Name</label>
                    <Input
                      placeholder="Project name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assigned To</label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.email} value={emp.name}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Attachments</label>
                  <Textarea
                    placeholder="Add any references or links..."
                    className="min-h-[80px] resize-none"
                    value={attachments}
                    onChange={(e) => setAttachments(e.target.value)}
                  />
                  <MediaUpload
                    onUpload={(attachment) => setAttachments(prev => `${prev}${prev ? '\n' : ''}${attachment}`)}
                  />
                  <MediaRenderer text={attachments} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Project
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        {/* Edit Project Form */}
        {editingProject && permissions.canEditProjects && (
          <Card className="mb-8 border-border">
            <CardHeader>
              <CardTitle>Edit Project</CardTitle>
              <CardDescription>Update project details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project Name</label>
                    <Input
                      value={editingProject.name}
                      onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assigned To</label>
                    <Select
                      value={editingProject.assignedTo || ""}
                      onValueChange={(val) => setEditingProject({ ...editingProject, assignedTo: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.email} value={emp.name}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={editingProject.description || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Attachments</label>
                  <Textarea
                    className="min-h-[80px] resize-none"
                    value={editingProject.attachments || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, attachments: e.target.value })}
                  />
                  <MediaUpload
                    onUpload={(attachment) => setEditingProject(prev => ({ ...prev, attachments: `${prev.attachments || ''}${prev.attachments ? '\n' : ''}${attachment}` }))}
                  />
                  <MediaRenderer text={editingProject.attachments || ""} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>Save Changes</Button>
                  <Button type="button" variant="outline" onClick={() => setEditingProject(null)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No projects yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {permissions.canCreateProjects ? "Create your first project to get started" : "No projects available"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="border-border hover:border-primary/50 cursor-pointer transition-all"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription className="truncate">{project.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    {permissions.canEditProjects && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingProject(project)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {permissions.canDeleteProjects && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(project.id, project.name)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}