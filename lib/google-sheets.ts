import { format } from "date-fns"
import type { Task, TaskFormData } from "@/types/task"
import type { User, Notification, UserRole } from "@/types/user"

// Helper to encode/decode Base64 across both browser and server
const encodeBase64 = (str: string) => {
  if (typeof btoa === 'function') return btoa(str)
  return Buffer.from(str).toString('base64')
}

const decodeBase64 = (b64: string) => {
  if (typeof atob === 'function') return atob(b64)
  return Buffer.from(b64, 'base64').toString('binary')
}

const base64url = (str: string) => {
  return encodeBase64(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

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

  const encodedHeader = base64url(JSON.stringify(header))
  const encodedPayload = base64url(JSON.stringify(payload))
  const unsignedToken = `${encodedHeader}.${encodedPayload}`

  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  
  let pemContents = "";
  if (privateKey.includes(pemHeader) && privateKey.includes(pemFooter)) {
    pemContents = privateKey.split(pemHeader)[1].split(pemFooter)[0].replace(/\s/g, "");
  } else {
    pemContents = privateKey.replace(/\s/g, "");
  }

  let binaryKey: Uint8Array;
  try {
    binaryKey = Uint8Array.from(decodeBase64(pemContents), c => c.charCodeAt(0));
  } catch (err) {
    console.error("SHEETS_AUTH: Failed to decode Base64 PEM content.");
    throw new Error("Invalid Google Sheets Private Key format");
  }

  const importedKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    importedKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = encodeBase64(String.fromCharCode(...new Uint8Array(signature)))
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

export async function addUser(data: { email: string; name: string; role: UserRole }): Promise<void> {
  const users = await getUsers()
  const existingUser = users.find(u => u.email.toLowerCase() === data.email.toLowerCase())
  if (existingUser) throw new Error("User already exists")

  const values = [
    [
      data.email.toLowerCase(),
      data.name,
      data.role,
      0, // Tasks
      0, // Completed
      0, // Overall Score
      0, // Shift Adherence
      0, // Edits
      "Good" // Performance
    ]
  ]

  await sheetsRequest("/values/Employees!A:I:append?valueInputOption=USER_ENTERED", {
    method: "POST",
    body: JSON.stringify({ values })
  })
}

export async function updateUser(email: string, data: Partial<User>): Promise<void> {
  const res = await sheetsRequest("/values/Employees!A1:Z100")
  const rows = res.values || []
  const headers = (rows[0] || []).map((h: any) => String(h).toLowerCase().trim())
  const emailIndex = headers.findIndex((h: string) => h.includes("email"))

  if (emailIndex === -1) throw new Error("Email column not found in Employees sheet")

  const rowIndex = rows.findIndex((row: any[]) =>
    String(row[emailIndex] || "").trim().toLowerCase() === email.toLowerCase()
  )

  if (rowIndex === -1) throw new Error("User not found")

  const currentRow = rows[rowIndex]
  const nameIndex = headers.findIndex((h: string) => h.includes("name"))
  const roleIndex = headers.findIndex((h: string) => h.includes("role") || h.includes("title"))

  if (data.name !== undefined && nameIndex !== -1) currentRow[nameIndex] = data.name
  if (data.role !== undefined && roleIndex !== -1) currentRow[roleIndex] = data.role

  const realRowNumber = rowIndex + 1
  await sheetsRequest(`/values/Employees!A${realRowNumber}:Z${realRowNumber}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values: [currentRow] })
  })
}

export async function deleteUserByEmail(email: string): Promise<void> {
  const res = await sheetsRequest("/values/Employees!A1:Z100")
  const rows = res.values || []
  const headers = (rows[0] || []).map((h: any) => String(h).toLowerCase().trim())
  const emailIndex = headers.findIndex((h: string) => h.includes("email"))

  if (emailIndex === -1) throw new Error("Email column not found")

  const rowIndex = rows.findIndex((row: any[]) =>
    String(row[emailIndex] || "").trim().toLowerCase() === email.toLowerCase()
  )

  if (rowIndex === -1) return // Already gone

  const realRowNumber = rowIndex + 1
  await sheetsRequest(`/values/Employees!A${realRowNumber}:Z${realRowNumber}:clear`, {
    method: "POST"
  })
}

// ============ TASKS & OTHER METHODS ============
// (Keeping other methods but they are not critical for login flow right now)

export async function getTasks(): Promise<Task[]> {
  try {
    const data = await sheetsRequest("/values/Performance!A2:T")
    const rows = data.values || []
    return rows
      .map((row: any[], index: number) => {
        const rowId = parseInt(row[0]) || (index + 2)
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
    console.error("getTasks error:", error)
    return []
  }
}

export async function getTaskById(id: number): Promise<Task | null> {
  try {
    const tasks = await getTasks()
    return tasks.find(t => t.id === id) || null
  } catch { return null }
}

export async function createTask(data: any): Promise<number> {
  const tasks = await getTasks()
  const lastId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) : 1
  const nextRow = lastId + 1

  const values = [
    [
      nextRow, // ID in Column A? Wait, getTasks says name is row[1], so Column B.
      data.name,
      data.date || format(new Date(), "yyyy-MM-dd"),
      data.task,
      data.references || "",
      data.comments || "",
      data.progress || "To-do",
      data.taskStartingDate || "",
      data.deadline || "",
      data.taskEstimatedTime || "00:00",
      "", // taskTimeTaken (calculated by sheet usually)
      data.submissionLink || "",
      data.submissionDate || "",
      "", // deadlineAdherence
      data.grading || "",
      "", // overallScore
      format(new Date(), "yyyy-MM-dd HH:mm:ss"), // taskTimeStamp
      data.edits || "",
      0, // noOfEdits
    ]
  ]

  await sheetsRequest("/values/Performance!A" + nextRow + ":S" + nextRow + "?valueInputOption=USER_ENTERED", {
    method: "PUT", // Using PUT to a specific row is one way, or APPEND
    body: JSON.stringify({ values })
  })

  return nextRow
}

export async function updateTask(id: number, data: any): Promise<void> {
  const values = [
    [
      id, // Keep the ID in Column A
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
      data.deadlineAdherence,
      data.grading,
      data.overallScore,
      data.taskTimeStamp,
      data.edits,
      data.noOfEdits
    ]
  ]

  const rowId = id
  await sheetsRequest(`/values/Performance!A${rowId}:S${rowId}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values })
  })
}

export async function deleteTask(id: number): Promise<void> {
  // Clearing the entire row A:S
  await sheetsRequest(`/values/Performance!A${id}:S${id}:clear`, {
    method: "POST"
  })
}

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
