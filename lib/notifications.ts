import { Resend } from "resend"
import { createNotification, getUserByEmail, getUsers } from "./google-sheets"
import type { NotificationType } from "@/types/user"
import type { Task } from "@/types/task"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

async function sendPushNotification(token: string, title: string, body: string, data: any = {}) {
  const fcmKey = process.env.FCM_SERVER_KEY;
  if (!fcmKey) {
    console.log("Skipping push notification: FCM_SERVER_KEY is missing");
    return;
  }

  try {
    await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${fcmKey}`,
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title,
          body,
          sound: 'default',
        },
        data: {
          ...data,
        },
        priority: 'high',
      }),
    });
  } catch (error) {
    console.error("Failed to send FCM push notification:", error);
  }
}

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
  const title = emailSubjects[type](task)

  // 1. Create in-app notification
  await createNotification({
    userEmail: recipientEmail,
    type,
    taskId: task.id,
    message,
    read: false,
    timestamp: new Date().toISOString(),
  })

  // 2. Send native push notification if user has a token
  const recipient = await getUserByEmail(recipientEmail);
  if (recipient?.pushToken) {
    await sendPushNotification(recipient.pushToken, title, message, { taskId: task.id.toString() });
  }

  // 3. Send email notification if Resend is configured
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

export async function notifyTaskAssigned(task: Task, assignedByEmail?: string, assignedByName?: string): Promise<void> {
  const users = await getUsers()
  const recipients = new Set<string>()

  // 1. Add Assignee
  const assignee = users.find(u => u.name === task.name)
  if (assignee) recipients.add(assignee.email)

  // 2. Add Assigner (the person who just created/updated it)
  if (assignedByEmail) recipients.add(assignedByEmail)

  // 3. Add all Managers and Admins
  const managers = users.filter((u) => u.role === "Manager" || u.role === "Admin")
  managers.forEach(m => recipients.add(m.email))

  for (const email of recipients) {
    await sendNotification({
      type: "task_assigned",
      task,
      recipientEmail: email,
      senderName: assignedByName,
    })
  }
}

export async function notifyProgressUpdate(task: Task, previousProgress: string, updatedByEmail?: string): Promise<void> {
  if (task.progress === previousProgress) return

  const users = await getUsers()
  const recipients = new Set<string>()

  // 1. Add Assignee
  const assignee = users.find(u => u.name === task.name)
  if (assignee) recipients.add(assignee.email)

  // 2. Add the person who made the update
  if (updatedByEmail) recipients.add(updatedByEmail)

  // 3. Add all Managers and Admins
  const managers = users.filter((u) => u.role === "Manager" || u.role === "Admin")
  managers.forEach(m => recipients.add(m.email))

  const type = task.progress === "Review" ? "submitted_for_review" :
               task.progress === "Completed" ? "task_completed" : "progress_updated"

  for (const email of recipients) {
    await sendNotification({
      type,
      task,
      recipientEmail: email,
    })
  }
}

export async function notifyRevisionsRequested(task: Task, managerEmail?: string): Promise<void> {
  const users = await getUsers()
  const recipients = new Set<string>()

  // 1. Add Assignee
  const assignee = users.find(u => u.name === task.name)
  if (assignee) recipients.add(assignee.email)

  // 2. Add the manager who requested revisions
  if (managerEmail) recipients.add(managerEmail)

  // 3. Add all Managers and Admins
  const managers = users.filter((u) => u.role === "Manager" || u.role === "Admin")
  managers.forEach(m => recipients.add(m.email))
  
  for (const email of recipients) {
    await sendNotification({
      type: "revisions_requested",
      task,
      recipientEmail: email,
    })
  }
}
