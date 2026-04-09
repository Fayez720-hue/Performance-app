import { google } from "googleapis"
import type { Task, TaskFormData } from "@/types/task"
import type { User, Notification, UserRole } from "@/types/user"

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
  try {
    const sheets = getSheets()
    if (!SPREADSHEET_ID) return []

    // Range A2:T to include all columns up to Task ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Performance!A2:T",
    }).catch(e => {
      console.error("Error fetching Performance sheet (A2:T):", e.message)
      return { data: { values: [] } }
    })

    const rows = response.data.values || []
    return rows.map((row, index) => ({
      id: index + 2, // Using row number as internal ID for easier updates
      name: (row[1] || "").trim(), // Name is Column B
      date: (row[2] || "").trim(), // Date is Column C
      task: (row[3] || "").trim(), // Task is Column D
      references: (row[4] || "").trim(), // References is Column E
      comments: (row[5] || "").trim(), // Comments is Column F
      progress: ((row[6] || "To-do") as string).trim() as any, // progress is Column G
      taskStartingDate: (row[7] || "").trim(), // Task Starting Date is Column H
      deadline: (row[8] || "").trim(), // Deadline is Column I
      taskEstimatedTime: (row[9] || "").trim(), // Task Estimated Time is Column J
      taskTimeTaken: (row[10] || "").trim(), // Task Time taken is Column K
      submissionLink: (row[11] || "").trim(), // Submission Link is Column L
      submissionDate: (row[12] || "").trim(), // Submission Date is Column M
      deadlineAdherence: (row[13] || "").trim(), // deadline adherence is Column N
      grading: (row[14] || "").trim(), // grading is Column O
      overallScore: (row[15] || "").trim(), // overall score is Column P
      taskTimeStamp: (row[16] || "").trim(), // Task Time Stamp is Column Q
      edits: (row[17] || "").trim(), // Edits is Column R
      noOfEdits: parseInt(row[18]) || 0, // No. of edits is Column S
    }))
  } catch (error) {
    console.error("getTasks fatal error:", error)
    return []
  }
}

export async function getTaskById(id: number): Promise<Task | null> {
  try {
    const sheets = getSheets()
    if (!SPREADSHEET_ID) return null

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Performance!A${id}:T${id}`,
    }).catch(e => {
      console.error(`Error fetching Task ${id}:`, e.message)
      return { data: { values: [] } }
    })

    const row = response.data.values?.[0]
    if (!row) return null

    return {
      id,
      name: (row[1] || "").trim(),
      date: (row[2] || "").trim(),
      task: (row[3] || "").trim(),
      references: (row[4] || "").trim(),
      comments: (row[5] || "").trim(),
      progress: ((row[6] || "To-do") as string).trim() as any,
      taskStartingDate: (row[7] || "").trim(),
      deadline: (row[8] || "").trim(),
      taskEstimatedTime: (row[9] || "").trim(),
      taskTimeTaken: (row[10] || "").trim(),
      submissionLink: (row[11] || "").trim(),
      submissionDate: (row[12] || "").trim(),
      deadlineAdherence: (row[13] || "").trim(),
      grading: (row[14] || "").trim(),
      overallScore: (row[15] || "").trim(),
      taskTimeStamp: (row[16] || "").trim(),
      edits: (row[17] || "").trim(),
      noOfEdits: parseInt(row[18]) || 0,
    }
  } catch (error) {
    console.error("getTaskById error:", error)
    return null
  }
}

export async function createTask(data: TaskFormData): Promise<number> {
  const sheets = getSheets()
  const timestamp = new Date().toISOString()
  
  // Calculate deadline adherence
  const deadlineAdherence = data.deadline && data.submissionDate
    ? new Date(data.submissionDate) <= new Date(data.deadline) ? "On Time" : "Late"
    : "Pending"

  // Matching headers: EMP ID(A), Name(B), Date(C), Task(D), References(E), Comments(F), progress(G),
  // Task Starting Date(H), Deadline(I), Task Estimated Time(J), Task Time taken(K),
  // Submission Link(L), Submission Date(M), deadline adherence(N), grading(O),
  // overall score(P), Task Time Stamp(Q), Edits(R), No. of edits(S), Task ID(T)
  const row = [
    "", // EMP ID (Column A)
    data.name, // Name (Column B)
    data.date, // Date (Column C)
    data.task, // Task (Column D)
    data.references, // References (Column E)
    data.comments, // Comments (Column F)
    data.progress, // progress (Column G)
    data.taskStartingDate, // Task Starting Date (Column H)
    data.deadline, // Deadline (Column I)
    data.taskEstimatedTime, // Task Estimated Time (Column J)
    data.taskTimeTaken, // Task Time taken (Column K)
    data.submissionLink, // Submission Link (Column L)
    data.submissionDate, // Submission Date (Column M)
    deadlineAdherence, // deadline adherence (Column N)
    data.grading, // grading (Column O)
    "", // overall score (Column P)
    timestamp, // Task Time Stamp (Column Q)
    data.edits, // Edits (Column R)
    "0", // No. of edits (Column S)
    "", // Task ID (Column T)
  ]

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Performance!A:T",
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

  let noOfEdits = existingTask.noOfEdits
  if (data.edits && data.edits !== currentEdits && data.edits.trim() !== "") {
    noOfEdits += 1
  }

  const deadline = data.deadline || existingTask.deadline
  const submissionDate = data.submissionDate || existingTask.submissionDate
  const deadlineAdherence = deadline && submissionDate
    ? new Date(submissionDate) <= new Date(deadline) ? "On Time" : "Late"
    : "Pending"

  const row = [
    "", // EMP ID (A) - Keep empty or handle if needed
    data.name ?? existingTask.name, // Name (B)
    data.date ?? existingTask.date, // Date (C)
    data.task ?? existingTask.task, // Task (D)
    data.references ?? existingTask.references, // References (E)
    data.comments ?? existingTask.comments, // Comments (F)
    data.progress ?? existingTask.progress, // progress (G)
    data.taskStartingDate ?? existingTask.taskStartingDate, // Task Starting Date (H)
    data.deadline ?? existingTask.deadline, // Deadline (I)
    data.taskEstimatedTime ?? existingTask.taskEstimatedTime, // Task Estimated Time (J)
    data.taskTimeTaken ?? existingTask.taskTimeTaken, // Task Time taken (K)
    data.submissionLink ?? existingTask.submissionLink, // Submission Link (L)
    data.submissionDate ?? existingTask.submissionDate, // Submission Date (M)
    deadlineAdherence, // deadline adherence (N)
    data.grading ?? existingTask.grading, // grading (O)
    existingTask.overallScore, // overall score (P)
    existingTask.taskTimeStamp, // Task Time Stamp (Q)
    data.edits ?? existingTask.edits, // Edits (R)
    noOfEdits.toString(), // No. of edits (S)
    "", // Task ID (T)
  ]

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Performance!A${id}:T${id}`,
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
  try {
    const sheets = getSheets()
    if (!SPREADSHEET_ID) {
      console.error("GOOGLE_SHEETS_SPREADSHEET_ID is missing")
      return []
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Employees!A2:C",
    }).catch(e => {
      console.error("Error fetching Employees sheet (A2:C):", e.message)
      return { data: { values: [] } }
    })

    const rows = response.data.values || []
    return rows.map((row) => ({
      email: (row[0] || "").trim(),
      name: (row[1] || "").trim(),
      role: ((row[2] || "Viewer") as string).trim() as UserRole,
    }))
  } catch (error) {
    console.error("getUsers error:", error)
    return []
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    if (!email) return null
    const users = await getUsers()
    const searchEmail = email.trim().toLowerCase()
    return users.find((u) => u.email.trim().toLowerCase() === searchEmail) || null
  } catch (error) {
    console.error("getUserByEmail error:", error)
    return null
  }
}

export async function createUser(user: User): Promise<void> {
  const sheets = getSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Employees!A:C",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[user.email, user.name, user.role]] },
  })
}

export async function updateUserRole(email: string, role: string): Promise<void> {
  const sheets = getSheets()
  const users = await getUsers()
  const searchEmail = email.trim().toLowerCase()
  const userIndex = users.findIndex((u) => u.email.trim().toLowerCase() === searchEmail)
  
  if (userIndex === -1) throw new Error("User not found")

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Employees!C${userIndex + 2}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[role]] },
  })
}

// ============ NOTIFICATIONS ============

export async function getNotifications(userEmail: string): Promise<Notification[]> {
  try {
    const sheets = getSheets()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Notifications!A2:G",
    }).catch(e => {
      console.warn("Notifications sheet not found or inaccessible:", e.message)
      return { data: { values: [] } }
    })

    const rows = response.data.values || []
    const searchEmail = userEmail.trim().toLowerCase()
    return rows
      .map((row, index) => ({
        id: (index + 2).toString(),
        userEmail: (row[1] || "").trim(),
        type: (row[2] || "task_assigned") as any,
        taskId: parseInt(row[3]) || 0,
        message: (row[4] || "").trim(),
        read: row[5] === "TRUE",
        timestamp: (row[6] || "").trim(),
      }))
      .filter((n) => n.userEmail.toLowerCase() === searchEmail)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch (error) {
    console.error("getNotifications error:", error)
    return []
  }
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
  const searchEmail = userEmail.trim().toLowerCase()

  rows.forEach((row, index) => {
    if (row[1]?.trim().toLowerCase() === searchEmail && row[5] !== "TRUE") {
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
  try {
    const sheets = getSheets()
    if (!SPREADSHEET_ID) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not defined")

    // 1. Fetch main KPIs from Summary sheet
    const summaryResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Summary!A2:G2",
    }).catch(e => {
      console.error("Error fetching Summary sheet:", e.message)
      return { data: { values: [] } }
    })

    const summary = summaryResponse.data.values?.[0] || []

    // 2. Fetch Detailed Employee Stats from Employees sheet
    const employeeResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Employees!A2:I",
    }).catch(e => {
      console.error("Error fetching Employees sheet:", e.message)
      return { data: { values: [] } }
    })

    const employeeRows = employeeResponse.data.values || []

    const employeeStats = employeeRows.map(row => ({
      name: (row[1] || "Unknown").trim(),
      title: (row[2] || "Employee").trim(),
      tasks: parseInt(row[3]) || 0,
      completed: parseInt(row[4]) || 0,
      overallScore: parseFloat(row[5]) || 0,
      shiftAdherence: parseFloat(row[6]) || 0,
      edits: parseInt(row[7]) || 0,
      performance: ((row[8] || "Good") as string).trim() as "Excellent" | "Good" | "Needs Improvement",
    }))

    // Provide defaults if stats are empty to avoid "No data" UI error
    const totalEmployees = parseInt(summary[0]) || employeeStats.length || 0
    const avgScore = parseFloat(summary[1]) || 0
    const completionRate = parseFloat(summary[2]) || 0

    const scoreDistribution = [
      { range: "0-20%", count: employeeStats.filter(e => e.overallScore <= 20).length },
      { range: "21-40%", count: employeeStats.filter(e => e.overallScore > 20 && e.overallScore <= 40).length },
      { range: "41-60%", count: employeeStats.filter(e => e.overallScore > 40 && e.overallScore <= 60).length },
      { range: "61-80%", count: employeeStats.filter(e => e.overallScore > 60 && e.overallScore <= 80).length },
      { range: "81-100%", count: employeeStats.filter(e => e.overallScore > 80).length },
    ]

    return {
      totalEmployees,
      avgScore,
      completionRate,
      avgShiftAdherence: parseFloat(summary[3]) || 0,
      totalEdits: parseInt(summary[4]) || 0,
      topPerformer: summary[5] || "N/A",
      topPerformerScore: parseFloat(summary[6]) || 0,
      scoreDistribution,
      shiftTrend: [
        { week: "Current", adherence: parseFloat(summary[3]) || 100 }
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
  } catch (error) {
    console.error("Fatal Dashboard Aggregation Error:", error)
    // Return empty but valid structure to prevent UI crash
    return {
      totalEmployees: 0,
      avgScore: 0,
      completionRate: 0,
      avgShiftAdherence: 0,
      totalEdits: 0,
      topPerformer: "Error",
      topPerformerScore: 0,
      scoreDistribution: [],
      shiftTrend: [],
      taskCompletion: [],
      performanceData: [],
      employees: []
    }
  }
}

