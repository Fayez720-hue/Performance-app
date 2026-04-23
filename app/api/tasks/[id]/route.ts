import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getTaskById, updateTask, deleteTask } from "@/lib/google-sheets"
import { notifyProgressUpdate, notifyRevisionsRequested } from "@/lib/notifications"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const task = await getTaskById(parseInt(params.id))
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 })

    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const data = await request.json()
    const taskId = parseInt(params.id)

    // Get existing task to compare changes
    const existingTask = await getTaskById(taskId)
    if (!existingTask) return NextResponse.json({ error: "Task not found" }, { status: 404 })

    // Update the task
    await updateTask(taskId, data)

    // Fetch updated task for notifications
    const updatedTask = await getTaskById(taskId)
    if (updatedTask) {
      // 1. Notify Manager if Team Member sets to "Review"
      if (data.userRole === "Team Member" && data.progress === "Review" && existingTask.progress !== "Review") {
        await notifyProgressUpdate(updatedTask, existingTask.progress)
      }

      // 2. Notify Team Member if Manager adds edits or changes status
      if ((data.userRole === "Admin" || data.userRole === "Manager") && data.userRole !== undefined) {
        // If edits were added or changed
        if (data.edits && data.edits !== existingTask.edits) {
          await notifyRevisionsRequested(updatedTask)
        }
        // Or if status changed (e.g., sent back to "In Progress")
        else if (data.progress !== existingTask.progress) {
          await notifyProgressUpdate(updatedTask, existingTask.progress)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PUT Task Error:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await deleteTask(parseInt(params.id))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
