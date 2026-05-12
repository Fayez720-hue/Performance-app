import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getProjectById, getTasksByProject, getProjectProgress, deleteProject, updateProject, createNotification, getUsers } from "@/lib/db-queries"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const project = await getProjectById(parseInt(params.id))
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    const tasks = await getTasksByProject(parseInt(params.id))
    const progress = await getProjectProgress(parseInt(params.id))

    return NextResponse.json({ project, tasks, progress })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userRole = (session.user as any)?.role
    if (userRole !== "Admin" && userRole !== "Manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const data = await req.json()
    await updateProject(parseInt(params.id), data)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userRole = (session.user as any)?.role
    if (userRole !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const projectId = parseInt(params.id)
    const project = await getProjectById(projectId)
    
    await deleteProject(projectId)

    if (project) {
      const users = await getUsers()
      const recipients = new Set<string>()

      if (project.assignedTo) {
        const assignee = users.find(u => u.name === project.assignedTo || u.email === project.assignedTo)
        if (assignee) recipients.add(assignee.email)
      }

      users.filter(u => u.role === "Admin" || u.role === "Manager").forEach(u => {
        if (u.email !== session.user?.email) recipients.add(u.email)
      })

      const { sendNotification } = await import("@/lib/notifications")

      for (const email of recipients) {
        await createNotification({
          userEmail: email,
          type: "task_assigned",
          taskId: projectId,
          message: `Project "${project.name}" has been deleted by ${session.user?.name || session.user?.email}`,
          read: false,
          timestamp: new Date().toISOString(),
        })

        try {
          await sendNotification({
            type: "task_assigned",
            task: { id: projectId, task: project.name, name: project.assignedTo || "Unassigned", progress: "To-do", deadline: "" } as any,
            recipientEmail: email,
            senderName: session.user?.name || undefined,
          })
        } catch (e) {
          console.error("Push notification failed:", e)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}