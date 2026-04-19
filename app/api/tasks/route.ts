import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getTasks, createTask, getUserByEmail } from "@/lib/google-sheets"
import { ROLE_PERMISSIONS } from "@/types/user"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await getUserByEmail(session.user.email)
    const role = user?.role || "Team Member"
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["Team Member"]

    let tasks = await getTasks()

    // If user cannot view all tasks, filter by name
    if (!permissions.canViewAllTasks) {
      tasks = tasks.filter(t => t.name.toLowerCase() === user?.name?.toLowerCase() || t.name.toLowerCase() === session.user?.name?.toLowerCase())
    }

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Tasks API Error:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const data = await request.json()
    const id = await createTask(data)
    return NextResponse.json({ id })
  } catch (error) {
    console.error("Create Task Error:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
