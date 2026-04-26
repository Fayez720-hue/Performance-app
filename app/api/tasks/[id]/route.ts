import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getTaskById, updateTask, deleteTask } from "@/lib/google-sheets"
import { notifyProgressUpdate, notifyRevisionsRequested, notifyTaskAssigned } from "@/lib/notifications"

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

    // 1. Accumulate Time Taken ONLY when transition happens FROM "In Progress"
    let totalTimeTakenStr = existingTask.taskTimeTaken || "0h 0m"
    if (existingTask.progress === "In Progress" && data.progress && data.progress !== "In Progress") {
      if (existingTask.taskStartingDate) {
        try {
          const start = new Date(existingTask.taskStartingDate)
          if (!isNaN(start.getTime())) {
            const diffMs = now.getTime() - start.getTime()
            const diffMins = Math.floor(diffMs / (1000 * 60))

            // Parse existing time
            const timeMatch = totalTimeTakenStr.match(/(\d+)h\s*(\d+)m/)
            let totalMins = diffMins
            if (timeMatch) {
              totalMins += (parseInt(timeMatch[1]) * 60) + parseInt(timeMatch[2])
            }

            const h = Math.floor(totalMins / 60)
            const m = totalMins % 60
            totalTimeTakenStr = `${h}h ${m}m`
          }
        } catch (e) {
          console.error("Accumulation error:", e)
        }
      }
    }

    // 2. Set Starting Date when transition happens TO "In Progress"
    let taskStartingDate = data.taskStartingDate || existingTask.taskStartingDate || ""
    if (data.progress === "In Progress" && existingTask.progress !== "In Progress") {
      taskStartingDate = now.toISOString()
    }

    // Initialize updateData
    let updateData = {
      ...existingTask,
      ...data,
      taskStartingDate,
      taskTimeTaken: totalTimeTakenStr,
      noOfEdits: Number(existingTask.noOfEdits) || 0,
      deadlineAdherence: data.deadlineAdherence || existingTask.deadlineAdherence || "",
      overallScore: data.overallScore || existingTask.overallScore || "",
      submissionDate: data.submissionDate || existingTask.submissionDate || "",
    }

    // 3. Handle Submission specific logic (Review/Completed)
    const isStatusTransitionToFinished = (data.progress === "Review" || data.progress === "Completed") &&
                                         (existingTask.progress !== "Review" && existingTask.progress !== "Completed")
    const isSubmissionUpdate = (data.submissionLink && data.submissionLink !== existingTask.submissionLink) || isStatusTransitionToFinished

    let performanceHistory = existingTask.performanceHistory || ""

    if (isSubmissionUpdate) {
      // Use toISOString to avoid timezone shifts during storage
      updateData.submissionDate = now.toISOString()

      // Update Adherence only on first submission or if it was "0%"
      let adherence = existingTask.deadlineAdherence || "Pending"
      if (!existingTask.deadlineAdherence || existingTask.deadlineAdherence === "Pending" || existingTask.deadlineAdherence === "0%") {
        if (data.deadline || existingTask.deadline) {
          try {
            const deadDate = new Date(data.deadline || existingTask.deadline)
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
                  adherence = `${Math.round(calculatedAdherence)}%`
                } else {
                  adherence = "0%"
                }
              }
            }
          } catch (e) {}
        }
        updateData.deadlineAdherence = adherence
      }

      // Add to History
      const timestamp = now.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      const newEntry = `[${timestamp}] Submitted (${data.progress || existingTask.progress}) - Adh: ${adherence}`
      performanceHistory = performanceHistory ? `${performanceHistory} | ${newEntry}` : newEntry
      updateData.performanceHistory = performanceHistory
    }

    // 4. Log "Edits Requested" in history
    if ((data.userRole === "Admin" || data.userRole === "Manager") && data.edits && data.edits !== existingTask.edits) {
      updateData.noOfEdits = (Number(existingTask.noOfEdits) || 0) + 1

      const timestamp = now.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      const newEntry = `[${timestamp}] Revision Requested #${updateData.noOfEdits}`
      performanceHistory = performanceHistory ? `${performanceHistory} | ${newEntry}` : newEntry
      updateData.performanceHistory = performanceHistory

      // Automatically switch from Review back to To-do if manager adds an edit
      if (existingTask.progress === "Review") {
        updateData.progress = "To-do"
      }
    }

    // 3. Increment Edits count if Manager adds new feedback
    if ((data.userRole === "Admin" || data.userRole === "Manager") && data.edits && data.edits !== existingTask.edits) {
      updateData.noOfEdits = (Number(existingTask.noOfEdits) || 0) + 1
    }

    // Ensure progress is preserved:
    // 1. If the task is already "Completed", it stays "Completed"
    // 2. UNLESS the user explicitly sent a different progress (Manager changing it)
    if (updateData.progress !== existingTask.progress) {
      // If progress was already changed by auto-logic (like switching to To-do), keep it
    } else if (existingTask.progress === "Completed" && !data.progress) {
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

    const updatedTask = await getTaskById(taskId)
    if (updatedTask && session.user?.email) {
      // 0. Notify if assignee changed
      if (data.name && data.name !== existingTask.name) {
        await notifyTaskAssigned(updatedTask, session.user.email, session.user.name || undefined)
      }

      // 1. Notify about progress change
      if (data.progress && data.progress !== existingTask.progress) {
        await notifyProgressUpdate(updatedTask, existingTask.progress, session.user.email)
      }

      // 2. Notify specifically about "Review" status from Team Members
      else if (data.userRole === "Team Member" && data.progress === "Review" && existingTask.progress !== "Review") {
        await notifyProgressUpdate(updatedTask, existingTask.progress, session.user.email)
      }

      // 3. Notify Team Member if Manager adds edits
      if ((data.userRole === "Admin" || data.userRole === "Manager") && data.userRole !== undefined) {
        if (data.edits && data.edits !== existingTask.edits) {
          await notifyRevisionsRequested(updatedTask, session.user.email)
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
