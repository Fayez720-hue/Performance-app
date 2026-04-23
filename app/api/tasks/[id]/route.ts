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

    // --- AUTO-CALCULATION ENGINE ---
    let updateData = { ...data }

    // 1. Set Submission Date automatically if link is added/changed
    if (data.submissionLink && (!existingTask.submissionLink || data.submissionLink !== existingTask.submissionLink)) {
      updateData.submissionDate = new Date().toISOString()
    }

    // 2. Calculate Deadline Adherence
    if (updateData.submissionDate && data.deadline) {
      const subDate = new Date(updateData.submissionDate)
      const deadDate = new Date(data.deadline)
      updateData.deadlineAdherence = subDate <= deadDate ? "On Time" : "Late"
    }

    // 3. Increment Edits count if Manager adds new feedback
    if ((data.userRole === "Admin" || data.userRole === "Manager") && data.edits && data.edits !== existingTask.edits) {
      updateData.noOfEdits = (existingTask.noOfEdits || 0) + 1
    }

    // 4. Calculate Overall Score (Grade - Penalty if Late)
    if (data.grading) {
      let score = parseFloat(data.grading) || 0
      if (updateData.deadlineAdherence === "Late") {
        score = score * 0.9 // 10% penalty
      }
      updateData.overallScore = score.toFixed(1)
    }

    // 5. Calculate Task Time Taken
    if (updateData.submissionDate && data.taskStartingDate) {
      const start = new Date(data.taskStartingDate)
      const end = new Date(updateData.submissionDate)
      const diffMs = end.getTime() - start.getTime()
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      updateData.taskTimeTaken = `${diffHrs}h ${diffMins}m`
    }

    // Update the task with calculated values
    await updateTask(taskId, updateData)

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
