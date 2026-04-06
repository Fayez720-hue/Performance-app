import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTasks, createTask, getUserByEmail } from "@/lib/google-sheets"
import { taskFormSchema } from "@/lib/validations/task"
import { ROLE_PERMISSIONS } from "@/types/user"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const tasks = await getTasks()
    const permissions = ROLE_PERMISSIONS[user.role]

    // Filter tasks based on role
    const filteredTasks = permissions.canViewAllTasks
      ? tasks
      : tasks.filter((task) => task.name === user.name)

    return NextResponse.json(filteredTasks)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const permissions = ROLE_PERMISSIONS[user.role]
    if (!permissions.canCreateTasks) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = taskFormSchema.parse(body)

    const taskId = await createTask(validatedData)

    return NextResponse.json({ id: taskId, message: "Task created successfully" })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
