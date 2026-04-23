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
    const now = new Date()
    let updateData = {
      ...data,
      noOfEdits: existingTask.noOfEdits || 0
    }

    // 1. Calculate Submission Date and Adherence for every submission update
    const isSubmissionUpdate = data.submissionLink && data.submissionLink !== existingTask.submissionLink
    let performanceHistory = existingTask.performanceHistory || ""

    if (isSubmissionUpdate) {
      updateData.submissionDate = now.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(',', '')

      // Calculate Deadline Adherence as Latency Percentage
      let adherence = "Pending"
      if (data.deadline) {
        try {
          const deadDate = new Date(data.deadline)
          if (!isNaN(deadDate.getTime())) {
            const submissionTime = now.getTime()
            const deadlineTime = deadDate.getTime()

            if (submissionTime <= deadlineTime) {
              adherence = "100%"
            } else {
              const latencyMs = submissionTime - deadlineTime
              const estTimeStr = data.taskEstimatedTime || existingTask.taskEstimatedTime || "01:00"
              const [estH, estM] = estTimeStr.split(":").map(Number)
              const estMs = ((estH || 0) * 3600000) + ((estM || 0) * 60000)

              if (estMs > 0) {
                const latencyPercentage = (latencyMs / estMs) * 100
                const calculatedAdherence = Math.max(0, 100 - latencyPercentage)
                adherence = `${calculatedAdherence.toFixed(1)}%`
              } else {
                adherence = "0%"
              }
            }
          }
        } catch (e) {
          console.error("Deadline adherence calculation error:", e)
        }
      }
      updateData.deadlineAdherence = adherence

      // Calculate Task Time Taken
      let timeTaken = "N/A"
      if (data.taskStartingDate || existingTask.taskStartingDate) {
        try {
          const startDateStr = data.taskStartingDate || existingTask.taskStartingDate
          const start = new Date(startDateStr)
          if (!isNaN(start.getTime())) {
            const diffMs = now.getTime() - start.getTime()
            const totalMins = Math.floor(diffMs / (1000 * 60))
            const hrs = Math.floor(totalMins / 60)
            const mins = totalMins % 60
            timeTaken = `${hrs}h ${mins}m`
          }
        } catch (e) {
          console.error("Error calculating time taken:", e)
        }
      }
      updateData.taskTimeTaken = timeTaken

      // Update Performance History
      const timestamp = now.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      const newHistoryEntry = `[${timestamp}] Adherence: ${adherence}, Time: ${timeTaken}`
      performanceHistory = performanceHistory
        ? `${performanceHistory} | ${newHistoryEntry}`
        : newHistoryEntry
      updateData.performanceHistory = performanceHistory
    } else {
      // Preserve existing values if the link hasn't changed
      updateData.submissionDate = existingTask.submissionDate
      updateData.deadlineAdherence = existingTask.deadlineAdherence
      updateData.taskTimeTaken = existingTask.taskTimeTaken
      updateData.performanceHistory = existingTask.performanceHistory
    }

    // 3. Increment Edits count if Manager adds new feedback
    if ((data.userRole === "Admin" || data.userRole === "Manager") && data.edits && data.edits !== existingTask.edits) {
      updateData.noOfEdits = (Number(existingTask.noOfEdits) || 0) + 1
    }

    // Ensure progress is preserved:
    // 1. If the task is already "Completed", it stays "Completed"
    // 2. UNLESS the user explicitly sent a different progress (Manager changing it)
    if (existingTask.progress === "Completed" && !data.progress) {
      updateData.progress = "Completed"
    } else if (data.progress) {
      updateData.progress = data.progress
    } else {
      updateData.progress = existingTask.progress
    }

    // 4. Calculate Overall Score (Grade - Penalty if Late)
    if (data.grading) {
      // Extract numeric value from grading (handles "90" or "90%")
      let rawGrade = parseFloat(String(data.grading).replace(/%/g, "")) || 0

      // Update the grading field itself to have % suffix
      updateData.grading = `${rawGrade}%`

      let score = rawGrade
      if (updateData.deadlineAdherence === "0%") {
        score = score * 0.9 // 10% penalty for late
      }
      updateData.overallScore = `${score.toFixed(1)}%`
    } else {
      updateData.overallScore = existingTask.overallScore
    }

    // Update the task with calculated values
    await updateTask(taskId, updateData)

    // Fetch updated task for notifications
    const updatedTask = await getTaskById(taskId)
    if (updatedTask) {
      // 1. Notify about progress change
      if (data.progress && data.progress !== existingTask.progress) {
        await notifyProgressUpdate(updatedTask, existingTask.progress)
      }

      // 2. Notify specifically about "Review" status from Team Members
      else if (data.userRole === "Team Member" && data.progress === "Review" && existingTask.progress !== "Review") {
        await notifyProgressUpdate(updatedTask, existingTask.progress)
      }

      // 3. Notify Team Member if Manager adds edits
      if ((data.userRole === "Admin" || data.userRole === "Manager") && data.userRole !== undefined) {
        if (data.edits && data.edits !== existingTask.edits) {
          await notifyRevisionsRequested(updatedTask)
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
