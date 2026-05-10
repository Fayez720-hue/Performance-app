import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getTaskById, updateTask, deleteTask } from "@/lib/db-queries"
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

    const existingTask = await getTaskById(taskId)
    if (!existingTask) return NextResponse.json({ error: "Task not found" }, { status: 404 })

    const now = new Date()

    // 1. Accumulate Time Taken
    let totalTimeTakenStr = existingTask.taskTimeTaken || "0h 0m"
    if (existingTask.progress === "In Progress" && data.progress && data.progress !== "In Progress") {
      if (existingTask.taskStartingDate) {
        try {
          const start = new Date(existingTask.taskStartingDate)
          if (!isNaN(start.getTime())) {
            const diffMs = now.getTime() - start.getTime()
            const diffMins = Math.floor(diffMs / (1000 * 60))
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

    // 2. Set Starting Date when transitioning TO "In Progress"
    let taskStartingDate = data.taskStartingDate || existingTask.taskStartingDate || ""
    if (data.progress === "In Progress" && existingTask.progress !== "In Progress") {
      taskStartingDate = now.toISOString()
    }

    // Initialize updateData
    let updateData: any = {
      ...existingTask,
      ...data,
      taskStartingDate,
      taskTimeTaken: totalTimeTakenStr,
      noOfEdits: Number(existingTask.noOfEdits) || 0,
      deadlineAdherence: existingTask.deadlineAdherence || "",
      overallScore: existingTask.overallScore || "",
      submissionDate: existingTask.submissionDate || "",
    }

    // 3. Handle Submission (Review/Completed)
    const isStatusTransitionToFinished = (data.progress === "Review" || data.progress === "Completed") &&
                                         (existingTask.progress !== "Review" && existingTask.progress !== "Completed")
    const isSubmissionUpdate = (data.submissionLink && data.submissionLink !== existingTask.submissionLink) || isStatusTransitionToFinished

    let performanceHistory = existingTask.performanceHistory || ""

    if (isSubmissionUpdate) {
      updateData.submissionDate = now.toISOString()

      // Calculate adherence: 100% on time, 90% if late
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
                adherence = "90%"
              }
            }
          } catch (e) {
            adherence = "Pending"
          }
        }
        updateData.deadlineAdherence = adherence
      }

      // Add to History
      const timestamp = now.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      const newEntry = `[${timestamp}] Submitted (${data.progress || existingTask.progress}) - Adh: ${adherence}`
      performanceHistory = performanceHistory ? `${performanceHistory} | ${newEntry}` : newEntry
      updateData.performanceHistory = performanceHistory
    }

    // 4. Handle Edits Requested (Manager feedback)
    if ((data.userRole === "Admin" || data.userRole === "Manager") && data.edits && data.edits !== existingTask.edits) {
      updateData.noOfEdits = (Number(existingTask.noOfEdits) || 0) + 1

      const timestamp = now.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      const newEntry = `[${timestamp}] Revision Requested #${updateData.noOfEdits}`
      performanceHistory = performanceHistory ? `${performanceHistory} | ${newEntry}` : newEntry
      updateData.performanceHistory = performanceHistory

      if (existingTask.progress === "Review") {
        updateData.progress = "To-do"
      }
    }

    // 5. Preserve progress
    if (existingTask.progress === "Completed" && !data.progress) {
      updateData.progress = "Completed"
    } else if (data.progress) {
      updateData.progress = data.progress
    } else {
      updateData.progress = existingTask.progress
    }

    // 6. Calculate Overall Score
    if (data.grading) {
      let rawGrade = parseFloat(String(data.grading).replace(/%/g, "")) || 0
      updateData.grading = `${rawGrade}%`
      
      let score = rawGrade
      const adherenceValue = parseFloat(updateData.deadlineAdherence?.replace(/%/g, "") || "100")
      if (adherenceValue < 100) {
        score = score * 0.9
      }
      updateData.overallScore = `${score.toFixed(1)}%`
    }

    // Save
    await updateTask(taskId, updateData)

    // Notifications
    const updatedTask = await getTaskById(taskId)
    if (updatedTask && session.user?.email) {
      if (data.name && data.name !== existingTask.name) {
        await notifyTaskAssigned(updatedTask, session.user.email, session.user.name || undefined)
      }
      if (data.progress && data.progress !== existingTask.progress) {
        await notifyProgressUpdate(updatedTask, existingTask.progress, session.user.email)
      }
      if ((data.userRole === "Admin" || data.userRole === "Manager") && data.edits && data.edits !== existingTask.edits) {
        await notifyRevisionsRequested(updatedTask, session.user.email)
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
