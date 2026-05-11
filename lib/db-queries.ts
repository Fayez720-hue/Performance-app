import { db } from "@/lib/db"
import { employees, tasks, notifications, attendance, projects } from "@/lib/db/schema"
import { eq, and, desc, sql, inArray } from "drizzle-orm"
import { format } from "date-fns"
import type { Task, TaskFormData } from "@/types/task"
import type { User, Notification, UserRole } from "@/types/user"

// ============ USERS ============

export async function getUsers(): Promise<User[]> {
  const rows = await db.select().from(employees).orderBy(employees.name)
  return rows.map(row => ({
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    image: row.image || undefined,
    pushToken: row.pushToken || undefined,
    title: row.title || undefined,
  }))
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await db.select().from(employees).where(eq(employees.email, email.toLowerCase())).limit(1)
  if (rows.length === 0) return null
  const row = rows[0]
  return {
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    image: row.image || undefined,
    pushToken: row.pushToken || undefined,
    title: row.title || undefined,
  }
}

export async function getUserByEmailAndPassword(email: string, password: string): Promise<User | null> {
  const { neon } = await import("@neondatabase/serverless")
  const sql = neon(process.env.DATABASE_URL!)
  
  const rows = await sql`SELECT * FROM employees WHERE LOWER(email) = ${email.toLowerCase()} AND password = ${password} LIMIT 1`
  
  console.log("DIRECT SQL RESULT:", rows)
  
  if (rows.length === 0) return null
  const row = rows[0]
  return { email: row.email as string, name: row.name as string, role: row.role as UserRole, title: row.title as string || undefined }
}
export async function addUser(data: { email: string; name: string; role: UserRole; title?: string }): Promise<void> {
  const existing = await getUserByEmail(data.email)
  if (existing) throw new Error("User already exists")

  await db.insert(employees).values({
    email: data.email.toLowerCase(),
    name: data.name,
    role: data.role,
    title: data.title || "",
  })
} 

export async function updateUser(email: string, data: Partial<User>, oldEmail?: string): Promise<void> {
  const searchEmail = (oldEmail || email).toLowerCase()
  const existing = await db.select().from(employees).where(eq(employees.email, searchEmail)).limit(1)
  if (existing.length === 0) throw new Error("User not found")

  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.role !== undefined) updateData.role = data.role
  if (data.title !== undefined) updateData.title = data.title
  if (data.email !== undefined) updateData.email = data.email.toLowerCase()

  await db.update(employees).set(updateData).where(eq(employees.email, searchEmail))
}

export async function deleteUserByEmail(email: string): Promise<void> {
  await db.delete(employees).where(eq(employees.email, email.toLowerCase()))
}

// ============ TASKS ============

export async function getTasks(): Promise<Task[]> {
  const rows = await db.select().from(tasks).orderBy(desc(tasks.id))
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    date: row.date,
    task: row.task,
    references: row.references,
    comments: row.comments,
    progress: row.progress as Task["progress"],
    taskStartingDate: row.taskStartingDate,
    deadline: row.deadline,
    taskEstimatedTime: row.taskEstimatedTime,
    taskTimeTaken: row.taskTimeTaken,
    submissionLink: row.submissionLink,
    submissionDate: row.submissionDate,
    deadlineAdherence: row.deadlineAdherence,
    grading: row.grading,
    overallScore: row.overallScore,
    taskTimeStamp: row.taskTimeStamp,
    edits: row.edits,
    noOfEdits: row.noOfEdits,
    performanceHistory: row.performanceHistory || undefined,
  }))
}

export async function getTaskById(id: number): Promise<Task | null> {
  const rows = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
  if (rows.length === 0) return null
  const row = rows[0]
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    task: row.task,
    references: row.references,
    comments: row.comments,
    progress: row.progress as Task["progress"],
    taskStartingDate: row.taskStartingDate,
    deadline: row.deadline,
    taskEstimatedTime: row.taskEstimatedTime,
    taskTimeTaken: row.taskTimeTaken,
    submissionLink: row.submissionLink,
    submissionDate: row.submissionDate,
    deadlineAdherence: row.deadlineAdherence,
    grading: row.grading,
    overallScore: row.overallScore,
    taskTimeStamp: row.taskTimeStamp,
    edits: row.edits,
    noOfEdits: row.noOfEdits,
    performanceHistory: row.performanceHistory || undefined,
    projectId: row.projectId,
  }
}

export async function createTask(data: any): Promise<number> {
  const currentTimestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss")

  const result = await db.insert(tasks).values({
    name: data.name,
    date: data.date || currentTimestamp,
    task: data.task,
    references: data.references || "",
    comments: data.comments || "",
    progress: data.progress || "To-do",
    taskStartingDate: data.taskStartingDate || "",
    deadline: data.deadline || "",
    taskEstimatedTime: data.taskEstimatedTime || "00:00",
    taskTimeTaken: "",
    submissionLink: data.submissionLink || "",
    submissionDate: data.submissionDate || "",
    deadlineAdherence: "",
    grading: data.grading || "",
    overallScore: "",
    taskTimeStamp: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    edits: data.edits || "",
    noOfEdits: 0,
    performanceHistory: `Created: ${new Date().toLocaleString()}`,
    createdBy: data.createdBy || null,
    projectId: data.projectId || null,
  }).returning({ id: tasks.id })

  return result[0].id
}

export async function updateTask(id: number, data: any): Promise<void> {
  // Update in place
  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.date !== undefined) updateData.date = data.date
  if (data.task !== undefined) updateData.task = data.task
  if (data.references !== undefined) updateData.references = data.references
  if (data.comments !== undefined) updateData.comments = data.comments
  if (data.progress !== undefined) updateData.progress = data.progress
  if (data.taskStartingDate !== undefined) updateData.taskStartingDate = data.taskStartingDate
  if (data.deadline !== undefined) updateData.deadline = data.deadline
  if (data.taskEstimatedTime !== undefined) updateData.taskEstimatedTime = data.taskEstimatedTime
  if (data.taskTimeTaken !== undefined) updateData.taskTimeTaken = data.taskTimeTaken
  if (data.submissionLink !== undefined) updateData.submissionLink = data.submissionLink
  if (data.submissionDate !== undefined) updateData.submissionDate = data.submissionDate
  if (data.deadlineAdherence !== undefined) updateData.deadlineAdherence = data.deadlineAdherence
  if (data.grading !== undefined) updateData.grading = data.grading
  if (data.overallScore !== undefined) updateData.overallScore = data.overallScore
  if (data.edits !== undefined) updateData.edits = data.edits
  if (data.noOfEdits !== undefined) updateData.noOfEdits = data.noOfEdits
  if (data.performanceHistory !== undefined) updateData.performanceHistory = data.performanceHistory
  if (data.projectId !== undefined) updateData.projectId = data.projectId
  updateData.updatedAt = new Date()

  await db.update(tasks).set(updateData).where(eq(tasks.id, id))
}

export async function deleteTask(id: number): Promise<void> {
  await db.delete(tasks).where(eq(tasks.id, id))
}

// ============ ATTENDANCE ============

export async function getAttendance(email: string): Promise<any[]> {
  const rows = await db.select().from(attendance).where(eq(attendance.email, email.toLowerCase())).orderBy(desc(attendance.date))
  return rows.map(row => ({
    name: row.name,
    date: row.date,
    trackedTime: row.trackedTime,
    clockIn: row.clockIn,
    clockOut: row.clockOut,
  }))
}

export async function clockIn(email: string, name: string): Promise<void> {
  const date = format(new Date(), "yyyy-MM-dd")
  const time = format(new Date(), "HH:mm:ss")

  await db.insert(attendance).values({
    name,
    email: email.toLowerCase(),
    date,
    trackedTime: "Working...",
    clockIn: time,
    clockOut: "",
  })
}

export async function clockOut(email: string): Promise<void> {
  const date = format(new Date(), "yyyy-MM-dd")
  const time = format(new Date(), "HH:mm:ss")

  // Find today's open clock-in for this user
  const rows = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.email, email.toLowerCase()),
        eq(attendance.date, date),
        eq(attendance.clockOut, "")
      )
    )
    .orderBy(desc(attendance.id))
    .limit(1)

  if (rows.length === 0) throw new Error("No active clock-in found for today")

  const row = rows[0]

  // Calculate tracked time
  let trackedTime = "Working..."
  if (row.clockIn) {
    try {
      const start = new Date(`${date}T${row.clockIn}`)
      const end = new Date(`${date}T${time}`)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      trackedTime = `${hours.toFixed(2)} hours`
    } catch (e) {
      trackedTime = "Error calc"
    }
  }

  await db
    .update(attendance)
    .set({ clockOut: time, trackedTime })
    .where(eq(attendance.id, row.id))
}

// ============ NOTIFICATIONS ============

export async function createNotification(notification: Notification): Promise<void> {
  await db.insert(notifications).values({
    userEmail: notification.userEmail,
    type: notification.type,
    taskId: notification.taskId,
    message: notification.message,
    read: notification.read,
    timestamp: notification.timestamp,
  })
}

export async function getNotifications(email: string): Promise<Notification[]> {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userEmail, email.toLowerCase()))
    .orderBy(desc(notifications.timestamp))

  return rows.map(row => ({
    id: `notification-${row.id}`,
    userEmail: row.userEmail,
    type: row.type as Notification["type"],
    taskId: row.taskId,
    message: row.message,
    read: row.read,
    timestamp: row.timestamp,
  }))
}

export async function markNotificationAsRead(email: string, timestamp: string): Promise<void> {
  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.userEmail, email.toLowerCase()),
        eq(notifications.timestamp, timestamp)
      )
    )
}
export async function markAllNotificationsAsRead(email: string): Promise<void> {
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userEmail, email.toLowerCase()))
}
// ============ DASHBOARD STATS ============

export async function getDashboardStats(startDate?: string, endDate?: string, userEmail?: string, userRole?: string) {
  const allEmployees = await db.select().from(employees)
  const allTasks = await db.select().from(tasks)

  let relevantEmployees = allEmployees
  let relevantTasks = allTasks

  const isAdminOrManager = userRole === "Admin" || userRole === "Manager"

  if (!isAdminOrManager && userEmail) {
    const currentEmployee = allEmployees.find(emp => emp.email === userEmail.toLowerCase())
    if (currentEmployee) {
      relevantEmployees = [currentEmployee]
      relevantTasks = allTasks.filter(t => {
        const taskName = t.name.toLowerCase().trim()
        const empName = currentEmployee.name.toLowerCase()
        const empEmail = currentEmployee.email.toLowerCase()
        return taskName === empName || taskName === empEmail || taskName === userEmail.toLowerCase()
      })
    } else {
      relevantEmployees = []
    }
  }

  const totalTasks = relevantTasks.length
  const completedTasks = relevantTasks.filter(t => t.progress === "Completed").length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Calculate average adherence
  let totalAdherence = 0
  let adherenceCount = 0
  relevantTasks.forEach(t => {
    if (t.deadlineAdherence?.includes("%")) {
      totalAdherence += parseFloat(t.deadlineAdherence)
      adherenceCount++
    }
  })
  const avgAdherence = adherenceCount > 0 ? Math.round(totalAdherence / adherenceCount) : 0

  // Score distribution
  const distribution = [
    { range: "0-20", count: 0 },
    { range: "21-40", count: 0 },
    { range: "41-60", count: 0 },
    { range: "61-80", count: 0 },
    { range: "81-100", count: 0 },
  ]
  relevantTasks.forEach(t => {
    if (t.overallScore?.includes("%")) {
      const score = parseFloat(t.overallScore)
      if (score <= 20) distribution[0].count++
      else if (score <= 40) distribution[1].count++
      else if (score <= 60) distribution[2].count++
      else if (score <= 80) distribution[3].count++
      else distribution[4].count++
    }
  })

      const employeeStats = relevantEmployees.map(emp => ({
    email: emp.email,
    name: emp.name,
    role: emp.role || "Team Member",
    title: emp.title || "Employee",
    tasks: emp.tasks || 0,
    completed: emp.completed || 0,
    overallScore: emp.overallScore || 0,
    shiftAdherence: emp.shiftAdherence || 0,
    edits: emp.edits || 0,
    performance: emp.performance || "Good",
  }))

  // Top performer
  const topPerformer = employeeStats.length > 0
    ? employeeStats.reduce((best, curr) => curr.overallScore > best.overallScore ? curr : best, employeeStats[0])
    : null

  const trend = [
    { week: "Week 1", adherence: avgAdherence * 0.9 },
    { week: "Week 2", adherence: avgAdherence * 0.95 },
    { week: "Week 3", adherence: avgAdherence * 0.98 },
    { week: "Week 4", adherence: avgAdherence },
  ]

    return {
    totalEmployees: relevantEmployees.length,
    avgScore: topPerformer?.overallScore || 0,
    completionRate,
    totalTasks,
    completedTasks,
    avgShiftAdherence: avgAdherence,
    totalEdits: relevantTasks.reduce((sum, t) => sum + (t.noOfEdits || 0), 0),
    topPerformer: topPerformer?.name || "N/A",
    topPerformerScore: topPerformer?.overallScore || 0,
    employees: employeeStats,
    scoreDistribution: distribution,
    shiftTrend: trend,
  }
}

export async function savePushToken(email: string, token: string): Promise<void> {
  await db
    .update(employees)
    .set({ pushToken: token })
    .where(eq(employees.email, email.toLowerCase()))
}
export async function getProjects(): Promise<any[]> {
  const rows = await db.select().from(projects).orderBy(desc(projects.createdAt))
  return rows
}

export async function getProjectById(id: number): Promise<any | null> {
  const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
  return rows.length > 0 ? rows[0] : null
}

export async function createProject(data: { name: string; description?: string; references?: string; assignedTo?: string; createdBy?: string }): Promise<number> {
  const result = await db.insert(projects).values({
    name: data.name,
    description: data.description || "",
    references: data.references || "",
    assignedTo: data.assignedTo || "",
    createdBy: data.createdBy || null,
  }).returning({ id: projects.id })
  return result[0].id
}
export async function updateProject(id: number, data: { name?: string; description?: string; references?: string; assignedTo?: string }): Promise<void> {
  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.references !== undefined) updateData.references = data.references
  if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo
  updateData.updatedAt = new Date()
  await db.update(projects).set(updateData).where(eq(projects.id, id))
}
export async function deleteProject(id: number): Promise<void> {
  // First unlink all tasks from this project
  await db.update(tasks).set({ projectId: null }).where(eq(tasks.projectId, id))
  // Then delete the project
  await db.delete(projects).where(eq(projects.id, id))
}

export async function getTasksByProject(projectId: number): Promise<Task[]> {
  const rows = await db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(desc(tasks.id))
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    date: row.date,
    task: row.task,
    references: row.references,
    comments: row.comments,
    progress: row.progress as Task["progress"],
    taskStartingDate: row.taskStartingDate,
    deadline: row.deadline,
    taskEstimatedTime: row.taskEstimatedTime,
    taskTimeTaken: row.taskTimeTaken,
    submissionLink: row.submissionLink,
    submissionDate: row.submissionDate,
    deadlineAdherence: row.deadlineAdherence,
    grading: row.grading,
    overallScore: row.overallScore,
    taskTimeStamp: row.taskTimeStamp,
    edits: row.edits,
    noOfEdits: row.noOfEdits,
    performanceHistory: row.performanceHistory || undefined,
    projectId: row.projectId,
  }))
}

export async function getProjectProgress(projectId: number): Promise<number> {
  const rows = await db.select({ progress: tasks.progress }).from(tasks).where(eq(tasks.projectId, projectId))
  if (rows.length === 0) return 0

  let totalScore = 0
  rows.forEach(row => {
    switch (row.progress) {
      case "Completed": totalScore += 100; break
      case "Review": totalScore += 75; break
      case "In Progress": totalScore += 50; break
      default: totalScore += 0
    }
  })
  return Math.round(totalScore / rows.length)
}