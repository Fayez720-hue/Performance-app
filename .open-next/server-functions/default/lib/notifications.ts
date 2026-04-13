import { Resend } from "resend"
import { createNotification, getUserByEmail, getUsers } from "./google-sheets"
import type { NotificationType } from "@/types/user"
import type { Task } from "@/types/task"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface NotificationData {
  type: NotificationType
  task: Task
  recipientEmail: string
  senderName?: string
}

const notificationMessages: Record<NotificationType, (task: Task, senderName?: string) => string> = {
  task_assigned: (task, senderName) => 
    `You have been assigned a new task: "${task.task}"${senderName ? ` by ${senderName}` : ""}`,
  progress_updated: (task) => 
    `Task "${task.task}" has been updated to ${task.progress}`,
  submitted_for_review: (task) => 
    `Task "${task.task}" has been submitted for review by ${task.name}`,
  revisions_requested: (task) => 
    `Revisions have been requested for task "${task.task}"`,
  task_completed: (task) => 
    `Task "${task.task}" has been marked as completed`,
}

const emailSubjects: Record<NotificationType, (task: Task) => string> = {
  task_assigned: () => "New Task Assigned",
  progress_updated: (task) => `Task Update: ${task.progress}`,
  submitted_for_review: () => "Task Submitted for Review",
  revisions_requested: () => "Revisions Requested",
  task_completed: () => "Task Completed",
}

export async function sendNotification(data: NotificationData): Promise<void> {
  const { type, task, recipientEmail, senderName } = data
  const message = notificationMessages[type](task, senderName)

  // Create in-app notification
  await createNotification({
    userEmail: recipientEmail,
    type,
    taskId: task.id,
    message,
    read: false,
    timestamp: new Date().toISOString(),
  })

  // Send email notification if Resend is configured
  if (resend) {
    try {
      await resend.emails.send({
        from: "Task Manager <noreply@resend.dev>",
        to: recipientEmail,
        subject: emailSubjects[type](task),
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${emailSubjects[type](task)}</h2>
            <p style="color: #555; font-size: 16px;">${message}</p>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #333;"><strong>Task:</strong> ${task.task}</p>
              <p style="margin: 8px 0 0; color: #333;"><strong>Assigned to:</strong> ${task.name}</p>
              ${task.deadline ? `<p style="margin: 8px 0 0; color: #333;"><strong>Deadline:</strong> ${task.deadline}</p>` : ""}
              <p style="margin: 8px 0 0; color: #333;"><strong>Status:</strong> ${task.progress}</p>
            </div>
            <p style="color: #888; font-size: 14px;">
              Log in to the Task Manager to view more details.
            </p>
          </div>
        `,
      })
    } catch (error) {
      console.error("Failed to send email notification:", error)
    }
  }
}

export async function notifyTaskAssigned(task: Task, assignedByName?: string): Promise<void> {
  // Notify the assignee
  const assignee = await getUserByEmail(task.name)
  if (assignee) {
    await sendNotification({
      type: "task_assigned",
      task,
      recipientEmail: assignee.email,
      senderName: assignedByName,
    })
  }

  // Notify managers
  const users = await getUsers()
  const managers = users.filter((u) => u.role === "Manager" || u.role === "Admin")
  
  for (const manager of managers) {
    if (manager.email !== assignee?.email) {
      await sendNotification({
        type: "task_assigned",
        task,
        recipientEmail: manager.email,
        senderName: assignedByName,
      })
    }
  }
}

export async function notifyProgressUpdate(task: Task, previousProgress: string): Promise<void> {
  // Don't notify if progress hasn't changed
  if (task.progress === previousProgress) return

  // Notify managers about progress updates
  const users = await getUsers()
  const managers = users.filter((u) => u.role === "Manager" || u.role === "Admin")

  for (const manager of managers) {
    await sendNotification({
      type: task.progress === "Review" ? "submitted_for_review" : "progress_updated",
      task,
      recipientEmail: manager.email,
    })
  }

  // If completed, also notify the assignee
  if (task.progress === "Completed") {
    const assignee = await getUserByEmail(task.name)
    if (assignee) {
      await sendNotification({
        type: "task_completed",
        task,
        recipientEmail: assignee.email,
      })
    }
  }
}

export async function notifyRevisionsRequested(task: Task): Promise<void> {
  // Find the assignee by name and notify them
  const users = await getUsers()
  const assignee = users.find((u) => u.name === task.name)
  
  if (assignee) {
    await sendNotification({
      type: "revisions_requested",
      task,
      recipientEmail: assignee.email,
    })
  }
}
