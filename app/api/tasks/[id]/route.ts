import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTaskById, updateTask, deleteTask, getUserByEmail } from "@/lib/google-sheets"
import { taskFormSchema } from "@/lib/validations/task"
import { ROLE_PERMISSIONS } from "@/types/user"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const taskId = parseInt(id)
    const task = await getTaskById(taskId)

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const permissions = ROLE_PERMISSIONS[user.role]
    
    // Check if user can view this task
    if (!permissions.canViewAllTasks && task.name !== user.name) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error fetching task:", error)
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const taskId = parseInt(id)
    const existingTask = await getTaskById(taskId)

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const permissions = ROLE_PERMISSIONS[user.role]
    
    // Check if user can edit this task
    const canEdit = permissions.canEditAllTasks || 
      (permissions.canEditOwnTasks && existingTask.name === user.name)
    
    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = taskFormSchema.partial().parse(body)

    await updateTask(taskId, validatedData, existingTask.edits)

    return NextResponse.json({ message: "Task updated successfully" })
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    if (!permissions.canDeleteTasks) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const taskId = parseInt(id)
    await deleteTask(taskId)

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
