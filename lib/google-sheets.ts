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

// Cache for the Google Sheets Access Token
let cachedToken: { token: string; expiry: number } | null = null;
// Cache for users list to speed up authentication and dashboard
let cachedUsers: { data: User[]; expiry: number } | null = null;

// ============ HELPER: get last non-empty row ============
async function getLastNonEmptyRow(sheetName: string, column: string = 'A'): Promise<number> {
  try {
    // Quote sheet name to handle spaces and special characters
    const range = `'${sheetName}'!${column}:${column}`;
    const data = await sheetsRequest(`/values/${encodeURIComponent(range)}`);
    const values = data.values || [];
    return values.length;
  } catch (error) {
    console.error(`Row Detection Error for ${sheetName}:`, error);
    return 0;
  }
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  // Use cached token if it's still valid (with a 60s buffer)
  if (cachedToken && cachedToken.expiry > now + 60) {
    return cachedToken.token
  }

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

  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
    scope: "https://www.googleapis.com/auth/spreadsheets",
  }

  const header = { alg: "RS256", typ: "JWT" }
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
    console.error("OAuth Token Error Response:", data);
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`)
  }

  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiry: now + (data.expires_in || 3600)
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
  const now = Date.now();
  if (cachedUsers && cachedUsers.expiry > now) {
    return cachedUsers.data;
  }

  try {
    const data = await sheetsRequest("/values/Employees!A:Z")
    let rows = data.values || []
    rows = rows.filter(row => row[0] || row[1])

    if (rows.length === 0) return []

    const headers = rows[0].map((h: any) => String(h).trim())
    // Clean headers: remove leading/trailing dots, spaces, and lowercase
    const cleanHeaders = headers.map(h => h.replace(/^[.\s]+|[.\s]+$/g, '').toLowerCase())

    // Exact or prioritized mapping
    let nameIndex = cleanHeaders.findIndex(h => h === 'name' || h === '.name' || h === 'employee name');
    let emailIndex = cleanHeaders.findIndex(h => h === 'email' || h === 'emp email' || h === 'employee email');
    let roleIndex = cleanHeaders.findIndex(h => h === 'role' || h === 'user role');
    let titleIndex = cleanHeaders.findIndex(h => h === 'title');
    let pushTokenIndex = cleanHeaders.findIndex(h => h.includes('push token') || h.includes('pushtoken'));

    // Fallback to substring search for role
    if (roleIndex === -1) {
      roleIndex = headers.findIndex(h => h.toLowerCase().includes('role') || h.toLowerCase().includes('title'));
    }
    // Fallback for name and email
    if (nameIndex === -1) nameIndex = headers.findIndex(h => h.toLowerCase().includes('name'));
    if (emailIndex === -1) emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
    // Title fallback: if not found, title will be undefined (no column)
    if (titleIndex === -1) titleIndex = -1;

    const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean)
    const managerEmails = (process.env.MANAGER_EMAILS || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean)

    const userMap = new Map<string, User>()

    rows.slice(1).forEach((row: any[], index: number) => {
      let email = emailIndex !== -1 ? String(row[emailIndex] || "").trim().toLowerCase() : ""
      let name = nameIndex !== -1 ? String(row[nameIndex] || "").trim() : ""
      let roleStr = roleIndex !== -1 ? String(row[roleIndex] || "").trim() : ""
      let title = titleIndex !== -1 ? String(row[titleIndex] || "").trim() : ""
      let pushToken = pushTokenIndex !== -1 ? String(row[pushTokenIndex] || "").trim() : ""

      if (!name && !email) return

      let role: UserRole = "Team Member"
      const lowerRole = roleStr.toLowerCase()
      if (lowerRole.includes("admin") || adminEmails.includes(email)) role = "Admin"
      else if (lowerRole.includes("manager") || managerEmails.includes(email)) role = "Manager"
      else if (lowerRole.includes("viewer")) role = "Viewer"

      const user: User = {
        email: email || `no-email-${index}`,
        name: name || email.split("@")[0] || "Unknown",
        role,
        title: title || undefined,
        pushToken: pushToken || undefined,
      }

      if (email) {
        userMap.set(email, user)
      } else {
        userMap.set(`no-email-${index}`, user)
      }
    })

    const users = Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    cachedUsers = { data: users, expiry: now + (5 * 60 * 1000) };
    return users;
  } catch (error) {
    console.error("getUsers error:", error)
    return []
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getUsers()
  return users.find((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()) || null
}

export async function addUser(data: { email: string; name: string; role: UserRole; title?: string }): Promise<void> {
  const users = await getUsers();
  const existingUser = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
  if (existingUser) throw new Error("User already exists");

  const lastRow = await getLastNonEmptyRow('Employees', 'A');
  const newRowIndex = lastRow + 1;

  // Prepare row: email, name, role, title, then 0s and "Good"
  const values = [[
    data.email.toLowerCase(),
    data.name,
    data.role,
    data.title || "",          // title column (Column D)
    0, 0, 0, 0, 0,             // stats columns
    "Good"                     // performance
  ]];

  await sheetsRequest(`/values/Employees!A${newRowIndex}:J${newRowIndex}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values }),
  });

  cachedUsers = null;
}

export async function updateUser(email: string, data: Partial<User>, oldEmail?: string): Promise<void> {
  const res = await sheetsRequest("/values/Employees!A:Z")
  const rows = res.values || []
  const headers = (rows[0] || []).map((h: any) => String(h).toLowerCase().trim())
  const emailIndex = headers.findIndex((h: string) => h.includes("email"))

  if (emailIndex === -1) throw new Error("Email column not found in Employees sheet")

  const searchEmail = (oldEmail || email).toLowerCase()
  let rowIndex = -1

  if (searchEmail.startsWith("no-email-")) {
    const placeholderIndex = parseInt(searchEmail.replace("no-email-", ""))
    rowIndex = placeholderIndex + 1 // +1 because data starts at row 2 (index 1)
  } else {
    rowIndex = rows.findIndex((row: any[]) =>
      String(row[emailIndex] || "").trim().toLowerCase() === searchEmail
    )
  }

  if (rowIndex === -1 || !rows[rowIndex]) throw new Error("User not found")

  const currentRow = rows[rowIndex]
  const nameIndex = headers.findIndex((h: string) => h.includes("name"))
  const roleIndex = headers.findIndex((h: string) => h.includes("role") || h.includes("title"))

  // Update email if it changed
  if (email !== searchEmail && !email.startsWith("no-email-") && emailIndex !== -1) {
    currentRow[emailIndex] = email.toLowerCase()
  }

  if (data.name !== undefined && nameIndex !== -1) currentRow[nameIndex] = data.name
  if (data.role !== undefined && roleIndex !== -1) currentRow[roleIndex] = data.role

  const realRowNumber = rowIndex + 1
  await sheetsRequest(`/values/Employees!A${realRowNumber}:Z${realRowNumber}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values: [currentRow] })
  })

  cachedUsers = null
}

export async function deleteUserByEmail(email: string): Promise<void> {
  const res = await sheetsRequest("/values/Employees!A:Z")
  const rows = res.values || []
  const headers = (rows[0] || []).map((h: any) => String(h).toLowerCase().trim())
  const emailIndex = headers.findIndex((h: string) => h.includes("email"))

  if (emailIndex === -1) throw new Error("Email column not found")

  let rowIndex = -1
  const searchEmail = email.toLowerCase()

  if (searchEmail.startsWith("no-email-")) {
    const placeholderIndex = parseInt(searchEmail.replace("no-email-", ""))
    rowIndex = placeholderIndex + 1
  } else {
    rowIndex = rows.findIndex((row: any[]) =>
      String(row[emailIndex] || "").trim().toLowerCase() === searchEmail
    )
  }

  if (rowIndex === -1) return // Already gone

  const realRowNumber = rowIndex + 1
  await sheetsRequest(`/values/Employees!A${realRowNumber}:Z${realRowNumber}:clear`, {
    method: "POST"
  })

  cachedUsers = null
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
          performanceHistory: (row[19] || "").trim(),
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
  const lastId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) : 0
  const nextId = lastId + 1

  // Use a format that Google Sheets is less likely to strip time from
  const currentTimestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss")

  const values = [
    [
      nextId,
      data.name,
      data.date || currentTimestamp,
      data.task,
      data.references || "",
      data.comments || "",
      data.progress || "To-do",
      data.taskStartingDate || "",
      data.deadline || "",
      data.taskEstimatedTime || "00:00",
      "", // taskTimeTaken
      data.submissionLink || "",
      data.submissionDate || "",
      "", // deadlineAdherence
      data.grading || "",
      "", // overallScore
      format(new Date(), "yyyy-MM-dd HH:mm:ss"), // taskTimeStamp
      data.edits || "",
      0, // noOfEdits
      `Created: ${new Date().toLocaleString()}` // Metadata/Col 20
    ]
  ]

  const lastRow = await getLastNonEmptyRow('Performance', 'A');
  const nextRow = lastRow + 1;

  await sheetsRequest(`/values/Performance!A${nextRow}:T${nextRow}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values })
  })

  // Optional: Sync to user-specific sheet
  const userSheetName = String(data.name || "").trim()
  if (userSheetName) {
    try {
      const userLastRow = await getLastNonEmptyRow(userSheetName, 'A');
      const userNextRow = userLastRow + 1;
      await sheetsRequest(`/values/'${userSheetName}'!A${userNextRow}:S${userNextRow}?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        body: JSON.stringify({ values })
      });
    } catch (err) {
      console.log(`User sheet ${userSheetName} not found or sync failed, skipping.`);
    }
  }

  return nextId
}

export async function updateTask(id: number, data: any): Promise<void> {
  // Search in a larger range to find the ID
  const res = await sheetsRequest("/values/Performance!A1:A2000")
  const rows = res.values || []

  // Find row index by matching ID (handling both string and number)
  const rowIndex = rows.findIndex((row: any[]) => {
    if (!row[0]) return false
    const rowId = String(row[0]).trim()
    return rowId === String(id).trim()
  })

  if (rowIndex === -1) {
    console.error(`Task ID ${id} not found. Available IDs:`, rows.slice(0, 10).map(r => r[0]))
    throw new Error(`Task ID ${id} not found in main sheet. Please ensure the ID exists in Column A.`)
  }

  const realRowNumber = rowIndex + 1
  const values = [
    [
      id,
      data.name || "",
      data.date || "",
      data.task || "",
      data.references || "",
      data.comments || "",
      data.progress || "To-do",
      data.taskStartingDate || "",
      data.deadline || "",
      data.taskEstimatedTime || "",
      data.taskTimeTaken || "",
      data.submissionLink || "",
      data.submissionDate || "",
      data.deadlineAdherence || "",
      data.grading || "",
      data.overallScore || "",
      data.taskTimeStamp || "",
      data.edits || "",
      data.noOfEdits || 0,
      data.performanceHistory || ""
    ]
  ]

  await sheetsRequest(`/values/Performance!A${realRowNumber}:T${realRowNumber}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values })
  })

  // Silent sync to user sheet
  const userSheetName = String(data.name || "").trim()
  if (userSheetName) {
    sheetsRequest(`/values/'${userSheetName}'!A:S:append?valueInputOption=USER_ENTERED`, {
      method: "POST",
      body: JSON.stringify({ values: [[...values[0], `Last Sync: ${new Date().toLocaleString()}`]] })
    }).catch(() => {/* Ignore errors for individual user sheets */})
  }
}

export async function deleteTask(id: number): Promise<void> {
  const res = await sheetsRequest("/values/Performance!A1:A500")
  const rows = res.values || []
  const rowIndex = rows.findIndex((row: any[]) => parseInt(row[0]) === id)

  if (rowIndex === -1) return

  const realRowNumber = rowIndex + 1
  await sheetsRequest(`/values/Performance!A${realRowNumber}:S${realRowNumber}:clear`, {
    method: "POST"
  })
}

export async function getDashboardStats(startDate?: string, endDate?: string, userEmail?: string, userRole?: string) {
  try {
    const [summaryData, employeeData, tasksData] = await Promise.all([
      sheetsRequest("/values/Summary!A2:I2"),
      sheetsRequest("/values/Employees!A2:I"),
      sheetsRequest("/values/Performance!A2:T")
    ])

    const summary = summaryData.values?.[0] || []
    const employeeRows = employeeData.values || []

    // Map employee stats
    let employeeStats = employeeRows.map((row: any[]) => ({
      email: String(row[0] || "").trim().toLowerCase(),
      name: String(row[1] || "Unknown").trim(),
      title: String(row[2] || "Employee").trim(),
      tasks: parseInt(row[3]) || 0,
      completed: parseInt(row[4]) || 0,
      overallScore: parseFloat(row[5]) || 0,
      shiftAdherence: parseFloat(row[6]) || 0,
      edits: parseInt(row[7]) || 0,
      performance: String(row[8] || "Good").trim() as any,
    }))

    // Get real-time task data from Performance sheet to ensure consistency with Tasks page
    const taskRows = (tasksData.values || []).filter((row: any[]) => row[1] && row[1] !== "Name")

    let totalTasks = 0
    let completedTasks = 0
    let relevantTasks: any[] = []

    const isAdminOrManager = userRole === "Admin" || userRole === "Manager"

    if (!isAdminOrManager && userEmail) {
      // Team Member View: Filter by their specific records
      const currentEmployee = employeeStats.find(emp => emp.email === userEmail.toLowerCase())

      relevantTasks = taskRows.filter((row: any[]) => {
        const taskName = String(row[1] || "").trim().toLowerCase()
        const empName = currentEmployee?.name.toLowerCase() || ""
        const empEmail = currentEmployee?.email.toLowerCase() || ""
        return taskName === empName || taskName === empEmail || taskName === userEmail.toLowerCase()
      })

      totalTasks = relevantTasks.length
      completedTasks = relevantTasks.filter((row: any[]) => String(row[6] || "").trim().toLowerCase() === "completed").length

      // Also filter the employees list returned to only include the current user
      if (currentEmployee) {
        employeeStats = [currentEmployee]
      } else {
        employeeStats = []
      }
    } else {
      // Admin/Manager View: Show Global Stats
      relevantTasks = taskRows
      totalTasks = relevantTasks.length
      completedTasks = relevantTasks.filter((row: any[]) => String(row[6] || "").trim().toLowerCase() === "completed").length
    }

    // Generate Score Distribution
    const distribution = [
      { range: "0-20", count: 0 },
      { range: "21-40", count: 0 },
      { range: "41-60", count: 0 },
      { range: "61-80", count: 0 },
      { range: "81-100", count: 0 },
    ]

    // Calculate real-time adherence and distribution
    let totalAdherence = 0
    let adherenceCount = 0

    relevantTasks.forEach(row => {
      const adhStr = String(row[13] || "")
      if (adhStr.includes("%")) {
        const val = parseFloat(adhStr)
        totalAdherence += val
        adherenceCount++
      }

      const scoreStr = String(row[15] || "")
      if (scoreStr.includes("%")) {
        const score = parseFloat(scoreStr)
        if (score <= 20) distribution[0].count++
        else if (score <= 40) distribution[1].count++
        else if (score <= 60) distribution[2].count++
        else if (score <= 80) distribution[3].count++
        else distribution[4].count++
      }
    })

    const avgAdherence = adherenceCount > 0 ? Math.round(totalAdherence / adherenceCount) : 0

    // Generate Weekly Trend (for the area chart)
    // In a real app, this would come from a "Trends" sheet
    const trend = [
      { week: "Week 1", adherence: avgAdherence * 0.9 },
      { week: "Week 2", adherence: avgAdherence * 0.95 },
      { week: "Week 3", adherence: avgAdherence * 0.98 },
      { week: "Week 4", adherence: avgAdherence },
    ]

    return {
      totalEmployees: parseInt(summary[0]) || employeeStats.length,
      avgScore: parseFloat(summary[1]) || 0,
      completionRate: parseFloat(summary[2]) || 0,
      totalTasks,
      completedTasks,
      avgShiftAdherence: avgAdherence,
      totalEdits: parseInt(summary[4]) || 0,
      topPerformer: summary[5] || "N/A",
      topPerformerScore: parseFloat(summary[6]) || 0,
      employees: employeeStats,
      scoreDistribution: distribution,
      shiftTrend: trend
    }
  } catch (error) {
    console.error("Dashboard Stats Error:", error)
    return { employees: [], scoreDistribution: [], shiftTrend: [] } as any
  }
}

export async function savePushToken(email: string, token: string): Promise<void> {
  const res = await sheetsRequest("/values/Employees!A:Z")
  const rows = res.values || []
  const headers = (rows[0] || []).map((h: any) => String(h).toLowerCase().trim())
  const emailIndex = headers.findIndex((h: string) => h.includes("email"))
  let pushTokenIndex = headers.findIndex((h: string) => h.includes("push token") || h.includes("pushtoken"))

  if (emailIndex === -1) throw new Error("Email column not found")

  // If header doesn't exist, use column J (index 9) and add header
  if (pushTokenIndex === -1) {
    pushTokenIndex = 9;
    await sheetsRequest(`/values/Employees!J1?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      body: JSON.stringify({ values: [["Push Token"]] })
    })
  }

  const rowIndex = rows.findIndex((row: any[]) =>
    String(row[emailIndex] || "").trim().toLowerCase() === email.toLowerCase()
  )

  if (rowIndex === -1) throw new Error("User not found")

  const realRowNumber = rowIndex + 1
  const colLetter = String.fromCharCode(65 + pushTokenIndex)

  await sheetsRequest(`/values/Employees!${colLetter}${realRowNumber}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values: [[token]] })
  })

  // Invalidate cache
  cachedUsers = null;
}

// ============ ATTENDANCE ============

export async function getAttendance(email: string): Promise<any[]> {
  try {
    // Member(A), Date(B), TrackedTime(C), ShiftTime(D), Adherence(E), ClockIn(F), ClockOut(G)
    const data = await sheetsRequest("/values/Attendance!A2:G")
    const rows = data.values || []

    // Since we don't have email in the new headers, we'll match by name
    // or return all records for now. For security, we should ideally have email.
    // Let's assume Member column might contain name or email.
    return (rows || [])
      .map((row: any[]) => ({
        name: row[0],
        date: row[1],
        trackedTime: row[2],
        clockIn: row[5],
        clockOut: row[6],
      }))
  } catch (error: any) {
    console.error("getAttendance error:", error.message)
    return []
  }
}

export async function clockIn(email: string, name: string): Promise<void> {
  const date = format(new Date(), "yyyy-MM-dd")
  const time = format(new Date(), "HH:mm:ss")

  // [Member(A), Date(B), TrackedTime(C), ShiftTime(D), Adherence(E), ClockIn(F), ClockOut(G), UserEmail(H)]
  // Column H (UserEmail) is a hidden helper to identify user uniquely
  const values = [[name, date, "Working...", "", "", time, "", email]]

  const lastRow = await getLastNonEmptyRow('Attendance', 'A');
  const nextRow = lastRow + 1;

  await sheetsRequest(`/values/Attendance!A${nextRow}:H${nextRow}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values })
  })
}

export async function clockOut(email: string): Promise<void> {
  const date = format(new Date(), "yyyy-MM-dd")
  const time = format(new Date(), "HH:mm:ss")

  const res = await sheetsRequest("/values/Attendance!A1:H2000")
  const rows = res.values || []

  // Find today's clock-in for this member (matching by email helper in Col H/Index 7)
  const rowIndex = rows.findLastIndex((row: any[]) =>
    String(row[7] || "").toLowerCase() === email.toLowerCase() &&
    row[1] === date &&
    (!row[6] || row[6] === "")
  )

  if (rowIndex === -1) throw new Error("No active clock-in found for today")

  const realRowNumber = rowIndex + 1
  const row = rows[rowIndex]

  // Fill in helper columns for calculation
  row[6] = time // Set clock-out time in Col G

  // Calculate Tracked Time (Duration)
  if (row[5]) { // If we have ClockIn time in Col F
    try {
      const start = new Date(`${date}T${row[5]}`)
      const end = new Date(`${date}T${time}`)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      row[2] = `${hours.toFixed(2)} hours` // Set Tracked Time in Col C
    } catch (e) {
      row[2] = "Error calc"
    }
  }

  await sheetsRequest(`/values/Attendance!A${realRowNumber}:H${realRowNumber}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values: [row] })
  })
}

// ============ NOTIFICATIONS ============

export async function createNotification(notification: Notification): Promise<void> {
  const values = [
    [
      notification.userEmail,
      notification.type,
      notification.taskId || "",
      notification.message,
      notification.read ? "TRUE" : "FALSE",
      notification.timestamp,
    ],
  ]

  const lastRow = await getLastNonEmptyRow('Notifications', 'A');
  const nextRow = lastRow + 1;

  await sheetsRequest(`/values/Notifications!A${nextRow}:F${nextRow}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values }),
  })
}

export async function getNotifications(email: string): Promise<Notification[]> {
  try {
    const data = await sheetsRequest("/values/Notifications!A2:F")
    const rows = data.values || []
    return rows
      .filter((row: any[]) => row && row[0] && String(row[0]).toLowerCase() === email.toLowerCase())
      .map((row: any[], index: number) => ({
        id: `notification-${index}-${row[5]}`, // Generate a semi-stable ID
        userEmail: row[0],
        type: row[1] as any,
        taskId: parseInt(row[2]) || 0,
        message: row[3],
        read: row[4] === "TRUE",
        timestamp: row[5],
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch (error) {
    console.error("getNotifications error:", error)
    return []
  }
}

export async function markNotificationAsRead(email: string, timestamp: string): Promise<void> {
  const res = await sheetsRequest("/values/Notifications!A1:F2000")
  const rows = res.values || []

  const rowIndex = rows.findIndex(
    (row: any[]) => row[0].toLowerCase() === email.toLowerCase() && row[5] === timestamp
  )

  if (rowIndex !== -1) {
    const realRowNumber = rowIndex + 1
    const row = rows[rowIndex]
    row[4] = "TRUE"

    await sheetsRequest(`/values/Notifications!A${realRowNumber}:F${realRowNumber}?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      body: JSON.stringify({ values: [row] }),
    })
  }
}
