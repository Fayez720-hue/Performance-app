import { google } from "googleapis"
import type { Task, TaskFormData } from "@/types/task"
import type { User, Notification } from "@/types/user"

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

function getAuth() {
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n")
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL

  if (!privateKey || !clientEmail) {
    throw new Error("Missing Google Sheets credentials")
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  })
}

function getSheets() {
  const auth = getAuth()
  return google.sheets({ version: "v4", auth })
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

// ============ TASKS ============

export async function getTasks(): Promise<Task[]> {
  const sheets = getSheets()
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Performance!A2:S",
  })

  const rows = response.data.values || []
  return rows.map((row, index) => ({
    id: index + 2, // Row number (1-indexed, skip header)
    name: row[0] || "",
    date: row[1] || "",
    task: row[2] || "",
    references: row[3] || "",
    comments: row[4] || "",
    progress: row[5] || "To-do",
    taskStartingDate: row[6] || "",
    deadline: row[7] || "",
    taskEstimatedTime: row[8] || "",
    taskTimeTaken: row[9] || "",
    submissionLink: row[10] || "",
    submissionDate: row[11] || "",
    deadlineAdherence: row[12] || "",
    grading: row[13] || "",
    overallScore: row[14] || "",
    taskTimeStamp: row[15] || "",
    edits: row[16] || "",
    noOfEdits: parseInt(row[17]) || 0,
  }))
}

export async function getTaskById(id: number): Promise<Task | null> {
  const sheets = getSheets()
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `Performance!A${id}:S${id}`,
  })

  const row = response.data.values?.[0]
  if (!row) return null

  return {
    id,
    name: row[0] || "",
    date: row[1] || "",
    task: row[2] || "",
    references: row[3] || "",
    comments: row[4] || "",
    progress: row[5] || "To-do",
    taskStartingDate: row[6] || "",
    deadline: row[7] || "",
    taskEstimatedTime: row[8] || "",
    taskTimeTaken: row[9] || "",
    submissionLink: row[10] || "",
    submissionDate: row[11] || "",
    deadlineAdherence: row[12] || "",
    grading: row[13] || "",
    overallScore: row[14] || "",
    taskTimeStamp: row[15] || "",
    edits: row[16] || "",
    noOfEdits: parseInt(row[17]) || 0,
  }
}

export async function createTask(data: TaskFormData): Promise<number> {
  const sheets = getSheets()
  const timestamp = new Date().toISOString()
  
  // Calculate deadline adherence
  const deadlineAdherence = data.deadline && data.submissionDate
    ? new Date(data.submissionDate) <= new Date(data.deadline) ? "On Time" : "Late"
    : "Pending"

  const row = [
    data.name,
    data.date,
    data.task,
    data.references,
    data.comments,
    data.progress,
    data.taskStartingDate,
    data.deadline,
    data.taskEstimatedTime,
    data.taskTimeTaken,
    data.submissionLink,
    data.submissionDate,
    deadlineAdherence,
    data.grading,
    "", // overall score - calculated
    timestamp,
    data.edits,
    "0", // no of edits
    "", // column S - empty placeholder for consistency
  ]

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Performance!A:S",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  })

  const updatedRange = response.data.updates?.updatedRange || ""
  const match = updatedRange.match(/A(\d+)/)
  return match ? parseInt(match[1]) : -1
}

export async function updateTask(id: number, data: Partial<TaskFormData>, currentEdits?: string): Promise<void> {
  const sheets = getSheets()
  const existingTask = await getTaskById(id)
  if (!existingTask) throw new Error("Task not found")

  // If edits field is being updated and has new content, increment counter
  let noOfEdits = existingTask.noOfEdits
  if (data.edits && data.edits !== currentEdits && data.edits.trim() !== "") {
    noOfEdits += 1
  }

  // Calculate deadline adherence
  const deadline = data.deadline || existingTask.deadline
  const submissionDate = data.submissionDate || existingTask.submissionDate
  const deadlineAdherence = deadline && submissionDate
    ? new Date(submissionDate) <= new Date(deadline) ? "On Time" : "Late"
    : "Pending"

  const row = [
    data.name ?? existingTask.name,
    data.date ?? existingTask.date,
    data.task ?? existingTask.task,
    data.references ?? existingTask.references,
    data.comments ?? existingTask.comments,
    data.progress ?? existingTask.progress,
    data.taskStartingDate ?? existingTask.taskStartingDate,
    data.deadline ?? existingTask.deadline,
    data.taskEstimatedTime ?? existingTask.taskEstimatedTime,
    data.taskTimeTaken ?? existingTask.taskTimeTaken,
    data.submissionLink ?? existingTask.submissionLink,
    data.submissionDate ?? existingTask.submissionDate,
    deadlineAdherence,
    data.grading ?? existingTask.grading,
    existingTask.overallScore,
    existingTask.taskTimeStamp,
    data.edits ?? existingTask.edits,
    noOfEdits.toString(),
    "", // column S placeholder
  ]

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Performance!A${id}:S${id}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  })
}

export async function deleteTask(id: number): Promise<void> {
  const sheets = getSheets()
  
  // Get spreadsheet to find sheet ID
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  })
  
  const performanceSheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === "Performance"
  )
  
  if (!performanceSheet?.properties?.sheetId) {
    throw new Error("Performance sheet not found")
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: performanceSheet.properties.sheetId,
              dimension: "ROWS",
              startIndex: id - 1,
              endIndex: id,
            },
          },
        },
      ],
    },
  })
}

// ============ USERS ============

export async function getUsers(): Promise<User[]> {
  const sheets = getSheets()
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Users!A2:C",
  })

  const rows = response.data.values || []
  return rows.map((row) => ({
    email: row[0] || "",
    name: row[1] || "",
    role: row[2] || "Viewer",
  }))
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getUsers()
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
}

export async function createUser(user: User): Promise<void> {
  const sheets = getSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Users!A:C",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[user.email, user.name, user.role]] },
  })
}

export async function updateUserRole(email: string, role: string): Promise<void> {
  const sheets = getSheets()
  const users = await getUsers()
  const userIndex = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase())
  
  if (userIndex === -1) throw new Error("User not found")

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Users!C${userIndex + 2}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[role]] },
  })
}

// ============ NOTIFICATIONS ============

export async function getNotifications(userEmail: string): Promise<Notification[]> {
  const sheets = getSheets()
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Notifications!A2:G",
  })

  const rows = response.data.values || []
  return rows
    .map((row, index) => ({
      id: (index + 2).toString(),
      userEmail: row[1] || "",
      type: row[2] || "task_assigned",
      taskId: parseInt(row[3]) || 0,
      message: row[4] || "",
      read: row[5] === "TRUE",
      timestamp: row[6] || "",
    }))
    .filter((n) => n.userEmail.toLowerCase() === userEmail.toLowerCase())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export async function createNotification(notification: Omit<Notification, "id">): Promise<void> {
  const sheets = getSheets()
  const id = `notif_${Date.now()}`
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Notifications!A:G",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        id,
        notification.userEmail,
        notification.type,
        notification.taskId.toString(),
        notification.message,
        "FALSE",
        notification.timestamp,
      ]],
    },
  })
}

export async function markNotificationsRead(userEmail: string): Promise<void> {
  const sheets = getSheets()
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Notifications!A2:G",
  })

  const rows = response.data.values || []
  const updates: { range: string; values: string[][] }[] = []

  rows.forEach((row, index) => {
    if (row[1]?.toLowerCase() === userEmail.toLowerCase() && row[5] !== "TRUE") {
      updates.push({
        range: `Notifications!F${index + 2}`,
        values: [["TRUE"]],
      })
    }
  })

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: updates,
      },
    })
  }
}

// ============ DASHBOARD AGGREGATION ============

export async function getDashboardStats() {
  const tasks = await getTasks()
  const users = await getUsers()

  const totalEmployees = users.length
  
  // Filter only tasks with numeric scores
  const tasksWithScores = tasks.filter(t => t.overallScore && !isNaN(parseFloat(t.overallScore)))
  const avgScore = tasksWithScores.length > 0 
    ? tasksWithScores.reduce((acc, t) => acc + parseFloat(t.overallScore), 0) / tasksWithScores.length 
    : 0

  const completedTasks = tasks.filter(t => t.progress === "Completed")
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0
  
  const totalEdits = tasks.reduce((acc, t) => acc + (t.noOfEdits || 0), 0)

  // Map employee stats
  const employeeStats = users.map(user => {
    const userTasks = tasks.filter(t => t.name.toLowerCase() === user.name.toLowerCase())
    const userCompleted = userTasks.filter(t => t.progress === "Completed")
    const userScores = userTasks.filter(t => t.overallScore && !isNaN(parseFloat(t.overallScore)))
    const userAvgScore = userScores.length > 0
      ? userScores.reduce((acc, t) => acc + parseFloat(t.overallScore), 0) / userScores.length
      : 0
    
    // Performance label logic
    let performance: "Excellent" | "Good" | "Needs Improvement" = "Good"
    if (userAvgScore >= 85) performance = "Excellent"
    else if (userAvgScore < 70) performance = "Needs Improvement"

    return {
      name: user.name,
      title: user.role, // Use role as title or default
      tasks: userTasks.length,
      completed: userCompleted.length,
      overallScore: Math.round(userAvgScore * 10) / 10,
      shiftAdherence: 100, // Placeholder as not in Sheet
      edits: userTasks.reduce((acc, t) => acc + (t.noOfEdits || 0), 0),
      performance,
    }
  })

  // Find top performer
  const sortedEmployees = [...employeeStats].sort((a, b) => b.overallScore - a.overallScore)
  const topPerformer = sortedEmployees[0]

  // KPI calculations
  return {
    totalEmployees,
    avgScore: Math.round(avgScore * 10) / 10,
    completionRate: Math.round(completionRate * 10) / 10,
    avgShiftAdherence: 100, // Placeholder
    totalEdits,
    topPerformer: topPerformer?.name || "None",
    topPerformerScore: topPerformer?.overallScore || 0,
    scoreDistribution: [
      { range: "0-20%", count: tasksWithScores.filter(t => parseFloat(t.overallScore) <= 20).length },
      { range: "21-40%", count: tasksWithScores.filter(t => parseFloat(t.overallScore) > 20 && parseFloat(t.overallScore) <= 40).length },
      { range: "41-60%", count: tasksWithScores.filter(t => parseFloat(t.overallScore) > 40 && parseFloat(t.overallScore) <= 60).length },
      { range: "61-80%", count: tasksWithScores.filter(t => parseFloat(t.overallScore) > 60 && parseFloat(t.overallScore) <= 80).length },
      { range: "81-100%", count: tasksWithScores.filter(t => parseFloat(t.overallScore) > 80).length },
    ],
    shiftTrend: [
      { week: "Current", adherence: 100 }
    ],
    taskCompletion: [
      { name: "Overall", completion: Math.round(completionRate) }
    ],
    performanceData: employeeStats.map(emp => ({
      score: emp.overallScore,
      adherence: emp.shiftAdherence,
      size: (emp.tasks || 1) * 10
    })),
    employees: employeeStats
  }
}

