import { Resend } from "resend"
import { createNotification, getUserByEmail, getUsers } from "./db-queries"
import type { NotificationType } from "@/types/user"
import type { Task } from "@/types/task"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

async function sendPushNotification(token: string, title: string, body: string, data: any = {}) {
  const privateKey = process.env.FCM_SERVER_KEY || process.env.GOOGLE_SHEETS_PRIVATE_KEY
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.GOOGLE_SHEETS_CLIENT_EMAIL
  const projectId = process.env.FIREBASE_PROJECT_ID || 'performance-app-24669'

  if (!privateKey || !clientEmail) {
    console.log("Skipping push: FCM credentials missing")
    return
  }

  try {
    const accessToken = await getFCMAccessToken(privateKey, clientEmail)
    await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ message: { token, notification: { title, body }, data, android: { priority: 'high', notification: { sound: 'default' } } } }),
    })
  } catch (error) {
    console.error("Failed to send FCM push notification:", error)
  }
}

async function getFCMAccessToken(privateKey: string, clientEmail: string): Promise<string> {
  let cleanKey = privateKey.replace(/\\n/g, '\n')
  if (cleanKey.startsWith('"')) cleanKey = cleanKey.slice(1, -1)
  if (!cleanKey.includes('-----BEGIN PRIVATE KEY-----')) cleanKey = `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----\n`
  const now = Math.floor(Date.now() / 1000)
  const jwt = await signJWT({ alg: 'RS256', typ: 'JWT' }, { iss: clientEmail, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now }, cleanKey)
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` })
  const tokenData = await res.json()
  if (!tokenData.access_token) throw new Error(`Failed to get FCM token: ${JSON.stringify(tokenData)}`)
  return tokenData.access_token
}

async function signJWT(header: any, payload: any, privateKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const encodedHeader = base64url(JSON.stringify(header))
  const encodedPayload = base64url(JSON.stringify(payload))
  const toSign = `${encodedHeader}.${encodedPayload}`
  const pemContents = privateKey.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '')
  let binaryKey: Uint8Array
  try { binaryKey = Uint8Array.from(Buffer.from(pemContents, 'base64').toString('binary'), (c: string) => c.charCodeAt(0)) }
  catch { binaryKey = new Uint8Array(Buffer.from(pemContents, 'base64')) }
  const key = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(toSign))
  return `${toSign}.${Buffer.from(signature).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`
}

function base64url(str: string): string { return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }

interface NotificationData { type: NotificationType; task: Task; recipientEmail: string; senderName?: string }

const notificationMessages: Record<NotificationType, (task: Task, senderName?: string) => string> = {
  task_assigned: (task, senderName) => `You have been assigned a new task: "${task.task}"${senderName ? ` by ${senderName}` : ""}`,
  progress_updated: (task) => `Task "${task.task}" has been updated to ${task.progress}`,
  submitted_for_review: (task) => `Task "${task.task}" has been submitted for review by ${task.name}`,
  revisions_requested: (task) => `Revisions have been requested for task "${task.task}"`,
  task_completed: (task) => `Task "${task.task}" has been marked as completed`,
}

const emailSubjects: Record<NotificationType, (task: Task) => string> = {
  task_assigned: () => "New Task Assigned", progress_updated: (task) => `Task Update: ${task.progress}`,
  submitted_for_review: () => "Task Submitted for Review", revisions_requested: () => "Revisions Requested", task_completed: () => "Task Completed",
}

export async function sendNotification(data: NotificationData): Promise<void> {
  const { type, task, recipientEmail, senderName } = data
  const message = notificationMessages[type](task, senderName)
  const title = emailSubjects[type](task)

  console.log("=== SEND NOTIFICATION ===", { type, recipientEmail, taskId: task.id })

  await createNotification({ userEmail: recipientEmail, type, taskId: task.id, message, read: false, timestamp: new Date().toISOString() })

  const recipient = await getUserByEmail(recipientEmail)
  console.log("=== PUSH CHECK ===", { recipientEmail, hasPushToken: !!recipient?.pushToken })
  
  if (recipient?.pushToken) {
    console.log("=== CALLING FCM ===")
    await sendPushNotification(recipient.pushToken, title, message, { taskId: task.id.toString() })
  }

  if (resend) {
    try {
      await resend.emails.send({
        from: "Task Manager <noreply@resend.dev>", to: recipientEmail, subject: emailSubjects[type](task),
        html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;"><h2>${emailSubjects[type](task)}</h2><p>${message}</p></div>`,
      })
    } catch (error) { console.error("Failed to send email notification:", error) }
  }
}

export async function notifyTaskAssigned(task: Task, assignedByEmail?: string, assignedByName?: string): Promise<void> {
  const users = await getUsers(); const recipients = new Set<string>()
  const assignee = users.find(u => u.name === task.name || u.email === task.name)
  if (assignee) recipients.add(assignee.email)
  users.filter(u => u.role === "Manager" || u.role === "Admin").forEach(m => { if (m.email !== assignedByEmail) recipients.add(m.email) })
  for (const email of recipients) { await sendNotification({ type: "task_assigned", task, recipientEmail: email, senderName: assignedByName }) }
}

export async function notifyProgressUpdate(task: Task, previousProgress: string, updatedByEmail?: string): Promise<void> {
  if (task.progress === previousProgress) return
  const users = await getUsers(); const recipients = new Set<string>()
  const assignee = users.find(u => u.name === task.name || u.email === task.name)
  if (assignee) recipients.add(assignee.email)
  users.filter(u => u.role === "Manager" || u.role === "Admin").forEach(m => { if (m.email !== updatedByEmail) recipients.add(m.email) })
  const type = task.progress === "Review" ? "submitted_for_review" : task.progress === "Completed" ? "task_completed" : "progress_updated"
  if (updatedByEmail) recipients.delete(updatedByEmail)
  for (const email of recipients) { await sendNotification({ type, task, recipientEmail: email }) }
}

export async function notifyRevisionsRequested(task: Task, managerEmail?: string): Promise<void> {
  const users = await getUsers(); const recipients = new Set<string>()
  const assignee = users.find(u => u.name === task.name || u.email === task.name)
  if (assignee) recipients.add(assignee.email)
  users.filter(u => u.role === "Manager" || u.role === "Admin").forEach(m => { if (m.email !== managerEmail) recipients.add(m.email) })
  if (managerEmail) recipients.delete(managerEmail)
  for (const email of recipients) { await sendNotification({ type: "revisions_requested", task, recipientEmail: email }) }
}