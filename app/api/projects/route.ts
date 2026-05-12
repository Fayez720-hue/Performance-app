import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createNotification, getProjects, createProject, getProjectProgress, getUsers } from "@/lib/db-queries"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const projects = await getProjects()
    
    const projectsWithProgress = await Promise.all(
      projects.map(async (p) => ({
        ...p,
        progress: await getProjectProgress(p.id),
      }))
    )

    return NextResponse.json(projectsWithProgress)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userRole = (session.user as any)?.role
    if (userRole !== "Admin" && userRole !== "Manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const data = await req.json()
    const id = await createProject({ ...data, createdBy: session.user?.email || "" })

    const users = await getUsers()
    const recipients = new Set<string>()

    if (data.assignedTo) {
      const assignee = users.find(u => u.name === data.assignedTo || u.email === data.assignedTo)
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
        taskId: id,
        message: `New project "${data.name}" has been created${data.assignedTo ? ` and assigned to ${data.assignedTo}` : ""} by ${session.user?.name || session.user?.email}`,
        read: false,
        timestamp: new Date().toISOString(),
      })
      
      try {
        await sendNotification({
          type: "task_assigned",
          task: { id, task: data.name, name: data.assignedTo || "Unassigned", progress: "To-do", deadline: "" } as any,
          recipientEmail: email,
          senderName: session.user?.name || undefined,
        })
      } catch (e) {
        console.error("Push notification failed:", e)
      }
    }

    return NextResponse.json({ id })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}