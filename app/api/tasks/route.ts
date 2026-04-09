import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTasks, createTask, getUserByEmail } from "@/lib/google-sheets"
import { taskFormSchema } from "@/lib/validations/task"
import { ROLE_PERMISSIONS } from "@/types/user"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByEmail(session.user.email) || {
      email: session.user.email,
      name: session.user.name || "Guest",
      role: "Admin"
    }

    const tasks = await getTasks() || []
    if (!Array.isArray(tasks)) {
       return NextResponse.json([], { status: 200 })
    }

    const userRole = (user.role as string) || "Viewer"
    const permissions = (ROLE_PERMISSIONS as any)[userRole] || ROLE_PERMISSIONS["Viewer"]

    // Filter tasks based on role
    const filteredTasks = permissions.canViewAllTasks
      ? tasks
      : tasks.filter((task) => task && task.name === user.name)

    return NextResponse.json(filteredTasks || [])
  } catch (error: any) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({
      error: "Failed to fetch tasks",
      details: error.message,
      code: error.code
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByEmail(session.user.email) || {
      email: session.user.email,
      name: session.user.name || "Guest",
      role: "Admin"
    }

    const permissions = ROLE_PERMISSIONS[user.role]
    if (!permissions.canCreateTasks) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = taskFormSchema.parse(body)

    const taskId = await createTask(validatedData)

    return NextResponse.json({ id: taskId, message: "Task created successfully" })
  } catch (error: any) {
    console.error("Critical Task Creation Error:", error)
    return NextResponse.json({
      error: "Failed to create task",
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
