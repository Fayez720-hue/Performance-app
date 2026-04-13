import { format } from "date-fns"
import type { Task, TaskFormData } from "@/types/task"
import type { User, Notification, UserRole } from "@/types/user"

// Edge-compatible Google Sheets API Implementation
// Replaces 'googleapis' which is not fully compatible with Cloudflare Edge

async function getAccessToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.replace(/\s/g, "")
  let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google Sheets credentials")
  }

  // Clean the Private Key
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.substring(1, privateKey.length - 1)
  }
  privateKey = privateKey.replace(/\\n/g, "\n").trim()
  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`
  }

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: "RS256", typ: "JWT" }
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
    scope: "https://www.googleapis.com/auth/spreadsheets",
  }

  const base64url = (str: string) => {
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  }

  const encodedHeader = base64url(JSON.stringify(header))
  const encodedPayload = base64url(JSON.stringify(payload))
  const unsignedToken = `${encodedHeader}.${encodedPayload}`

  // Sign the token using SubtleCrypto
  const pemHeader = "-----BEGIN PRIVATE KEY-----"
  const pemFooter = "-----END PRIVATE KEY-----"
  const pemContents = privateKey.substring(pemHeader.length, privateKey.length - pemFooter.length).replace(/\s/g, "")
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const importedKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    importedKey,
    new TextEncoder().encode(unsignedToken)
  )

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  const jwt = `${unsignedToken}.${encodedSignature}`

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  const data = await response.json()
  if (!data.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`)
  }
  return data.access_token
}

async function sheetsRequest(path: string, options: RequestInit = {}) {
  const token = await getAccessToken()
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim().replace(/^["']|["']$/g, "")
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is missing")

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const error = await response.json()
    console.error("Sheets API Error:", error)
    throw new Error(`Google Sheets API error: ${error.error?.message || response.statusText}`)
  }

  return response.json()
}

// ============ TASKS ============

export async function getTasks(): Promise<Task[]> {
  try {
    const data = await sheetsRequest("/values/Performance!A2:T")
    const rows = data.values || []
    return rows
      .map((row: any[], index: number) => {
        const rowId = index + 2
        const name = (row[1] || "").trim()
        if (!name && !row[3] && !row[2]) return null
        return {
          id: rowId,
          name,
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
      })
      .filter((task: any): task is Task => task !== null)
  } catch (error) {
    console.error("getTasks fatal error:", error)
    return []
  }
}

export async function getTaskById(id: number): Promise<Task | null> {
  try {
    const data = await sheetsRequest(`/values/Performance!A${id}:T${id}`)
    const row = data.values?.[0]
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
  } catch {
    return null
  }
}

export async function createTask(data: TaskFormData): Promise<number> {
  const allTasks = await getTasks()
  const nextRowIndex = allTasks.length + 2

  const safeData = {
    ...data,
    name: data.name || "Unassigned",
    task: data.task || "No description",
    progress: data.progress || "To-do",
    taskStartingDate: data.taskStartingDate || format(new Date(), "yyyy-MM-dd"),
    deadline: data.deadline || format(new Date(), "yyyy-MM-dd"),
    taskEstimatedTime: data.taskEstimatedTime || "0",
  }

  const updates = [
    { range: `Performance!B${nextRowIndex}`, values: [[safeData.name]] },
    { range: `Performance!D${nextRowIndex}:J${nextRowIndex}`, values: [[
      safeData.task,
      safeData.references || "",
      safeData.comments || "",
      safeData.progress,
      safeData.taskStartingDate,
      safeData.deadline,
      safeData.taskEstimatedTime,
    ]] },
    { range: `Performance!L${nextRowIndex}`, values: [[safeData.submissionLink || ""]] },
    { range: `Performance!O${nextRowIndex}`, values: [[safeData.grading || ""]] },
    { range: `Performance!R${nextRowIndex}`, values: [[safeData.edits || ""]] }
  ]

  await sheetsRequest("/values:batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data: updates,
    }),
  })

  return nextRowIndex
}

export async function updateTask(id: number, data: Partial<TaskFormData>, _currentEdits?: string): Promise<void> {
  const existingTask = await getTaskById(id)
  if (!existingTask) throw new Error("Task not found")

  const updates = [
    { range: `Performance!B${id}`, values: [[data.name ?? existingTask.name]] },
    { range: `Performance!D${id}:J${id}`, values: [[
        data.task ?? existingTask.task,
        data.references ?? existingTask.references,
        data.comments ?? existingTask.comments,
        data.progress ?? existingTask.progress,
        data.taskStartingDate ?? existingTask.taskStartingDate,
        data.deadline ?? existingTask.deadline,
        data.taskEstimatedTime ?? existingTask.taskEstimatedTime,
    ]] },
    { range: `Performance!L${id}`, values: [[data.submissionLink ?? existingTask.submissionLink]] },
    { range: `Performance!O${id}`, values: [[data.grading ?? existingTask.grading]] },
    { range: `Performance!R${id}`, values: [[data.edits ?? existingTask.edits]] }
  ]

  await sheetsRequest("/values:batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data: updates,
    }),
  })
}

export async function deleteTask(id: number): Promise<void> {
  const rangesToClear = [
    `Performance!B${id}`,
    `Performance!D${id}:J${id}`,
    `Performance!L${id}`,
    `Performance!O${id}`,
    `Performance!R${id}`
  ]

  await sheetsRequest("/values:batchClear", {
    method: "POST",
    body: JSON.stringify({ ranges: rangesToClear }),
  })
}

// ============ USERS ============

export async function getUsers(): Promise<User[]> {
  try {
    const data = await sheetsRequest("/values/Employees!A1:Z100")
    const rows = data.values || []
    if (rows.length === 0) return []

    const headers = (rows[0] || []).map((h: any) => String(h).toLowerCase().trim())
    const emailIndex = headers.findIndex((h: string) => h.includes("email"))
    const nameIndex = headers.findIndex((h: string) => h.includes("name"))
    const roleIndex = headers.findIndex((h: string) => h.includes("role") || h.includes("title"))

    const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean)
    const managerEmails = (process.env.MANAGER_EMAILS || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean)

    const userMap = new Map<string, User>()

    rows.slice(1).forEach((row: any[]) => {
      let email = emailIndex !== -1 ? String(row[emailIndex] || "").trim().toLowerCase() : ""
      if (!email || !email.includes("@")) return

      let name = nameIndex !== -1 ? String(row[nameIndex] || "").trim() : email.split("@")[0]
      let roleStr = roleIndex !== -1 ? String(row[roleIndex] || "").trim() : ""

      let role: UserRole = "Team Member"
      const lowerRole = roleStr.toLowerCase()
      if (lowerRole.includes("admin") || adminEmails.includes(email)) role = "Admin"
      else if (lowerRole.includes("manager") || managerEmails.includes(email)) role = "Manager"
      else if (lowerRole.includes("viewer")) role = "Viewer"

      userMap.set(email, { email, name, role })
    })

    return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error("getUsers error:", error)
    return []
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getUsers()
  return users.find((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()) || null
}

export async function createUser(user: User): Promise<void> {
  await sheetsRequest("/values/Employees!A:C:append?valueInputOption=USER_ENTERED", {
    method: "POST",
    body: JSON.stringify({ values: [[user.email, user.name, user.role]] }),
  })
}

export async function updateUser(email: string, data: { name?: string; role?: string }): Promise<void> {
  const users = await getUsers()
  const idx = users.findIndex(u => u.email === email)
  if (idx === -1) return
  await sheetsRequest(`/values/Employees!A${idx + 2}:C${idx + 2}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values: [[email, data.name || users[idx].name, data.role || users[idx].role]] }),
  })
}

export async function deleteUser(email: string): Promise<void> {
  const users = await getUsers()
  const idx = users.findIndex(u => u.email === email)
  if (idx === -1) return

  // To delete a row using REST API we need the sheetId
  const spreadsheet = await sheetsRequest("")
  const sheetId = spreadsheet.sheets?.find((s: any) => s.properties?.title === "Employees")?.properties?.sheetId
  if (!sheetId) return

  await sheetsRequest(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: [{
        deleteDimension: {
          range: { sheetId, dimension: "ROWS", startIndex: idx + 1, endIndex: idx + 2 }
        }
      }]
    }),
  })
}

// ============ NOTIFICATIONS ============

export async function getNotifications(userEmail: string): Promise<Notification[]> {
  try {
    const data = await sheetsRequest("/values/Notifications!A2:G")
    const rows = data.values || []
    return rows
      .map((row: any[], index: number) => ({
        id: (index + 2).toString(),
        userEmail: (row[1] || "").trim(),
        type: (row[2] || "task_assigned") as any,
        taskId: parseInt(row[3]) || 0,
        message: (row[4] || "").trim(),
        read: row[5] === "TRUE",
        timestamp: (row[6] || "").trim(),
      }))
      .filter((n: any) => n.userEmail.toLowerCase() === userEmail.toLowerCase())
  } catch { return [] }
}

export async function createNotification(n: Omit<Notification, "id">): Promise<void> {
  const id = `notif_${Date.now()}`
  await sheetsRequest("/values/Notifications!A:G:append?valueInputOption=USER_ENTERED", {
    method: "POST",
    body: JSON.stringify({
      values: [[id, n.userEmail, n.type, n.taskId.toString(), n.message, "FALSE", n.timestamp]]
    })
  })
}

export async function markNotificationsRead(userEmail: string): Promise<void> {
  const data = await sheetsRequest("/values/Notifications!A2:G")
  const rows = data.values || []
  const updates = rows.map((row: any[], i: number) =>
    row[1]?.trim().toLowerCase() === userEmail.toLowerCase() && row[5] !== "TRUE"
    ? { range: `Notifications!F${i + 2}`, values: [["TRUE"]] } : null
  ).filter(Boolean) as any[]

  if (updates.length > 0) {
    await sheetsRequest("/values:batchUpdate", {
      method: "POST",
      body: JSON.stringify({ valueInputOption: "USER_ENTERED", data: updates })
    })
  }
}

// ============ DASHBOARD AGGREGATION ============

export async function getDashboardStats() {
  try {
    const summaryData = await sheetsRequest("/values/Summary!A2:G2")
    const summary = summaryData.values?.[0] || []
    const employeeData = await sheetsRequest("/values/Employees!A2:I")
    const employeeRows = employeeData.values || []
    const employeeStats = employeeRows.map((row: any[]) => ({
      name: String(row[1] || "Unknown").trim(),
      title: String(row[2] || "Employee").trim(),
      tasks: parseInt(row[3]) || 0,
      completed: parseInt(row[4]) || 0,
      overallScore: parseFloat(row[5]) || 0,
      shiftAdherence: parseFloat(row[6]) || 0,
      edits: parseInt(row[7]) || 0,
      performance: String(row[8] || "Good").trim() as any,
    }))
    return {
      totalEmployees: parseInt(summary[0]) || employeeStats.length,
      avgScore: parseFloat(summary[1]) || 0,
      completionRate: parseFloat(summary[2]) || 0,
      avgShiftAdherence: parseFloat(summary[3]) || 0,
      totalEdits: parseInt(summary[4]) || 0,
      topPerformer: summary[5] || "N/A",
      topPerformerScore: parseFloat(summary[6]) || 0,
      employees: employeeStats
    }
  } catch { return { employees: [] } as any }
}
