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
    const range = `'${sheetName.replace(/'/g, "''")}'!${column}:${column}`;
    const data = await sheetsRequest(`/values/${range}`);
    const rows = data.values || [];
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      if (row && row.some((cell: any) => cell !== null && cell !== "" && String(cell).trim() !== "")) {
        return i + 1;
      }
    }
    return 0;
  } catch (error) {
    console.error(`Row Detection Error for ${sheetName}:`, error);
    return 0;
  }
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.expiry > now + 60) return cachedToken.token

  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.replace(/\s/g, "")
  let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY
  if (!clientEmail || !privateKey) throw new Error("Missing Google Sheets credentials")

  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.substring(1, privateKey.length - 1)
  }
  privateKey = privateKey.replace(/\\n/g, "\n").trim()
  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`
  }

  const payload = {
    iss: clientEmail, sub: clientEmail, aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600, iat: now, scope: "https://www.googleapis.com/auth/spreadsheets",
  }

  const encodedHeader = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const encodedPayload = base64url(JSON.stringify(payload))
  const unsignedToken = `${encodedHeader}.${encodedPayload}`

  const pemHeader = "-----BEGIN PRIVATE KEY-----", pemFooter = "-----END PRIVATE KEY-----";
  let pemContents = privateKey.includes(pemHeader) && privateKey.includes(pemFooter)
    ? privateKey.split(pemHeader)[1].split(pemFooter)[0].replace(/\s/g, "")
    : privateKey.replace(/\s/g, "");

  let binaryKey = Uint8Array.from(decodeBase64(pemContents), c => c.charCodeAt(0));
  const importedKey = await crypto.subtle.importKey(
    "pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", importedKey, new TextEncoder().encode(unsignedToken));
  const encodedSignature = encodeBase64(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

  const jwt = `${unsignedToken}.${encodedSignature}`
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  const data = await response.json()
  if (!data.access_token) throw new Error(`Failed to get access token: ${JSON.stringify(data)}`)
  cachedToken = { token: data.access_token, expiry: now + (data.expires_in || 3600) }
  return data.access_token
}

async function sheetsRequest(path: string, options: RequestInit = {}) {
  const token = await getAccessToken()
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim().replace(/^["']|["']$/g, "")
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is missing")

  // Cleanup path and ensure /values/ prefix
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!cleanPath.startsWith('/values/')) cleanPath = `/values${cleanPath}`;

  const [basePath, query] = cleanPath.split('?');
  const encodedPath = basePath.split('/').map(segment => {
    if (!segment || segment === "values") return segment;
    if (segment.includes('!')) {
      const [sheet, range] = segment.split('!');
      return `${encodeURIComponent(sheet)}!${range}`;
    }
    return encodeURIComponent(segment);
  }).join('/');

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}${encodedPath}${query ? '?' + query : ''}`;

  const response = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  })

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Sheets API Error (${response.status}) at ${url}:`, errorBody);
    throw new Error(`Google Sheets API error: ${response.status}`);
  }

  return response.json()
}

// ============ USERS ============
export async function getUsers(): Promise<User[]> {
  const now = Date.now();
  if (cachedUsers && cachedUsers.expiry > now) return cachedUsers.data;

  try {
    const data = await sheetsRequest("/Employees!A:Z")
    let rows = (data.values || []).filter((row: any[]) => row[0] || row[1])
    if (rows.length === 0) return []

    const headers = rows[0].map((h: any) => String(h).trim().toLowerCase())
    let nameIdx = headers.indexOf("name"), emailIdx = headers.indexOf("email"), roleIdx = headers.indexOf("role");

    const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim())
    const userMap = new Map<string, User>()

    rows.slice(1).forEach((row: any[], index: number) => {
      let email = emailIdx !== -1 ? String(row[emailIdx] || "").trim().toLowerCase() : ""
      let name = nameIdx !== -1 ? String(row[nameIdx] || "").trim() : ""
      if (!name && !email) return

      let role: UserRole = "Team Member"
      const roleStr = String(row[roleIdx] || "").toLowerCase()
      if (roleStr.includes("admin") || adminEmails.includes(email)) role = "Admin"
      else if (roleStr.includes("manager")) role = "Manager"

      userMap.set(email || `no-email-${index}`, { email, name, role })
    })

    const users = Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    cachedUsers = { data: users, expiry: now + (5 * 60 * 1000) };
    return users;
  } catch (error) { return [] }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getUsers(); return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function createTask(data: any): Promise<number> {
  const tasks = await getTasks()
  const nextId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1
  const currentTimestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss")

  const values = [[
    nextId, data.name, data.date || currentTimestamp, data.task, data.references || "",
    data.comments || "", data.progress || "To-do", data.taskStartingDate || "",
    data.deadline || "", data.taskEstimatedTime || "00:00", "", data.submissionLink || "",
    data.submissionDate || "", "", data.grading || "", "", format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    data.edits || "", 0, `Created: ${new Date().toLocaleString()}`
  ]]

  // Use append targeting the header to find the FIRST empty row and avoid zombie rows at the bottom
  await sheetsRequest("/Performance!A1:T1:append?valueInputOption=USER_ENTERED", {
    method: "POST", body: JSON.stringify({ values })
  })

  try {
    const userSheet = String(data.name || "").trim()
    if (userSheet) {
      // Also use the header-targeting append for individual user sheets
      await sheetsRequest(`/'${userSheet.replace(/'/g, "''")}'!A1:S1:append?valueInputOption=USER_ENTERED`, {
        method: "POST", body: JSON.stringify({ values })
      });
    }
  } catch {}

  return nextId
}

export async function getTasks(): Promise<Task[]> {
  try {
    const data = await sheetsRequest("/Performance!A2:T")
    return (data.values || []).map((row: any[], index: number) => {
      const name = (row[1] || "").trim()
      if (!name && !row[3]) return null
      return {
        id: parseInt(row[0]) || (index + 2), name, date: (row[2] || "").trim(),
        task: (row[3] || "").trim(), references: (row[4] || "").trim(),
        comments: (row[5] || "").trim(), progress: (row[6] || "To-do") as any,
        taskStartingDate: (row[7] || "").trim(), deadline: (row[8] || "").trim(),
        taskEstimatedTime: (row[9] || "").trim(), taskTimeTaken: (row[10] || "").trim(),
        submissionLink: (row[11] || "").trim(), submissionDate: (row[12] || "").trim(),
        deadlineAdherence: (row[13] || "").trim(), grading: (row[14] || "").trim(),
        overallScore: (row[15] || "").trim(), taskTimeStamp: (row[16] || "").trim(),
        edits: (row[17] || "").trim(), noOfEdits: parseInt(row[18]) || 0,
        performanceHistory: (row[19] || "").trim(),
      }
    }).filter((t: any): t is Task => t !== null)
  } catch { return [] }
}

export async function getTaskById(id: number): Promise<Task | null> {
  const tasks = await getTasks(); return tasks.find(t => t.id === id) || null;
}

export async function updateTask(id: number, data: any): Promise<void> {
  const res = await sheetsRequest("/Performance!A1:A2000")
  const rowIndex = (res.values || []).findIndex((row: any[]) => String(row[0]) === String(id))
  if (rowIndex === -1) throw new Error("Task not found")

  const values = [[
    id, data.name, data.date, data.task, data.references, data.comments, data.progress,
    data.taskStartingDate, data.deadline, data.taskEstimatedTime, data.taskTimeTaken,
    data.submissionLink, data.submissionDate, data.deadlineAdherence, data.grading,
    data.overallScore, data.taskTimeStamp, data.edits, data.noOfEdits, data.performanceHistory
  ]]

  await sheetsRequest(`/Performance!A${rowIndex + 1}:T${rowIndex + 1}?valueInputOption=USER_ENTERED`, {
    method: "PUT", body: JSON.stringify({ values })
  })
}

export async function getDashboardStats(startDate?: string, endDate?: string, userEmail?: string, userRole?: string) {
  try {
    const [summaryData, employeeData, tasksData] = await Promise.all([
      sheetsRequest("/Summary!A2:I2"), sheetsRequest("/Employees!A2:I"), sheetsRequest("/Performance!A2:T")
    ])
    const employeeRows = employeeData.values || []
    let employeeStats = employeeRows.map((row: any[]) => ({
      email: String(row[0] || "").trim().toLowerCase(), name: String(row[1] || "Unknown").trim(),
      title: String(row[2] || "Employee").trim(), tasks: parseInt(row[3]) || 0,
      completed: parseInt(row[4]) || 0, overallScore: parseFloat(row[5]) || 0,
      shiftAdherence: parseFloat(row[6]) || 0, edits: parseInt(row[7]) || 0,
      performance: String(row[8] || "Good").trim() as any,
    }))

    const taskRows = (tasksData.values || []).filter((row: any[]) => row[1] && row[1] !== "Name")
    let totalTasks = 0, completedTasks = 0, relevantTasks: any[] = []
    const isAdmin = userRole === "Admin" || userRole === "Manager"

    if (!isAdmin && userEmail) {
      const curr = employeeStats.find(emp => emp.email === userEmail.toLowerCase())
      relevantTasks = taskRows.filter((row: any[]) => String(row[1]).toLowerCase() === curr?.name.toLowerCase() || String(row[1]).toLowerCase() === userEmail.toLowerCase())
      totalTasks = relevantTasks.length
      completedTasks = relevantTasks.filter((row: any[]) => String(row[6]).toLowerCase() === "completed").length
      employeeStats = curr ? [curr] : []
    } else {
      relevantTasks = taskRows
      totalTasks = relevantTasks.length
      completedTasks = relevantTasks.filter((row: any[]) => String(row[6]).toLowerCase() === "completed").length
    }

    const distribution = [{range:"0-20",count:0},{range:"21-40",count:0},{range:"41-60",count:0},{range:"61-80",count:0},{range:"81-100",count:0}]
    let totalAdherence = 0, adherenceCount = 0
    relevantTasks.forEach(row => {
      const adh = String(row[13] || ""), score = parseFloat(row[15] || "")
      if (adh.includes("%")) { totalAdherence += parseFloat(adh); adherenceCount++; }
      if (!isNaN(score)) {
        if (score <= 20) distribution[0].count++; else if (score <= 40) distribution[1].count++;
        else if (score <= 60) distribution[2].count++; else if (score <= 80) distribution[3].count++; else distribution[4].count++;
      }
    })

    const avgAdh = adherenceCount > 0 ? Math.round(totalAdherence / adherenceCount) : 0
    return {
      totalEmployees: parseInt(summaryData.values?.[0]?.[0]) || employeeStats.length,
      avgScore: parseFloat(summaryData.values?.[0]?.[1]) || 0,
      totalTasks, completedTasks, avgShiftAdherence: avgAdh, employees: employeeStats,
      scoreDistribution: distribution, shiftTrend: []
    }
  } catch (error) { return { employees: [], scoreDistribution: [], shiftTrend: [] } as any }
}

export async function savePushToken(email: string, token: string): Promise<void> {
  const res = await sheetsRequest("/Employees!A:Z")
  const rows = res.values || []
  const headers = (rows[0] || []).map((h: any) => String(h).toLowerCase().trim())
  const emailIndex = headers.indexOf("email")
  let pushTokenIndex = headers.indexOf("push token");

  if (emailIndex === -1) throw new Error("Email column not found")
  if (pushTokenIndex === -1) {
    pushTokenIndex = 9;
    await sheetsRequest("/Employees!J1?valueInputOption=USER_ENTERED", {
      method: "PUT", body: JSON.stringify({ values: [["Push Token"]] })
    })
  }

  const rowIndex = rows.findIndex((row: any[]) => String(row[emailIndex]).toLowerCase() === email.toLowerCase())
  if (rowIndex === -1) throw new Error("User not found")

  const colLetter = String.fromCharCode(65 + pushTokenIndex)
  await sheetsRequest(`/Employees!${colLetter}${rowIndex + 1}?valueInputOption=USER_ENTERED`, {
    method: "PUT", body: JSON.stringify({ values: [[token]] })
  })
  cachedUsers = null;
}

export async function getAttendance(email: string): Promise<any[]> {
  try {
    const data = await sheetsRequest("/Attendance!A2:G")
    return (data.values || []).map((row: any[]) => ({
      name: row[0], date: row[1], trackedTime: row[2], clockIn: row[5], clockOut: row[6],
    }))
  } catch { return [] }
}

export async function clockIn(email: string, name: string): Promise<void> {
  const values = [[name, format(new Date(), "yyyy-MM-dd"), "Working...", "", "", format(new Date(), "HH:mm:ss"), "", email]]
  await sheetsRequest("/Attendance!A1:H1:append?valueInputOption=USER_ENTERED", {
    method: "POST", body: JSON.stringify({ values })
  })
}

export async function clockOut(email: string): Promise<void> {
  const res = await sheetsRequest("/Attendance!A1:H2000")
  const date = format(new Date(), "yyyy-MM-dd")
  const rowIndex = (res.values || []).findLastIndex((row: any[]) => String(row[7]).toLowerCase() === email.toLowerCase() && row[1] === date && !row[6])
  if (rowIndex === -1) throw new Error("No active clock-in")
  const row = res.values[rowIndex]
  row[6] = format(new Date(), "HH:mm:ss")
  await sheetsRequest(`/Attendance!A${rowIndex + 1}:H${rowIndex + 1}?valueInputOption=USER_ENTERED`, {
    method: "PUT", body: JSON.stringify({ values: [row] })
  })
}

export async function createNotification(n: Notification): Promise<void> {
  const values = [[n.userEmail, n.type, n.taskId || "", n.message, n.read ? "TRUE" : "FALSE", n.timestamp]]
  await sheetsRequest("/Notifications!A1:F1:append?valueInputOption=USER_ENTERED", {
    method: "POST", body: JSON.stringify({ values }),
  })
}

export async function getNotifications(email: string): Promise<Notification[]> {
  try {
    const data = await sheetsRequest("/Notifications!A2:F")
    return (data.values || []).filter((r: any[]) => r && r[0] && String(r[0]).toLowerCase() === email.toLowerCase())
      .map((r: any[], i: number) => ({ id: `n-${i}`, userEmail: r[0], type: r[1], taskId: parseInt(r[2]) || 0, message: r[3], read: r[4] === "TRUE", timestamp: r[5] }))
  } catch { return [] }
}

export async function markNotificationAsRead(email: string, ts: string): Promise<void> {
  const res = await sheetsRequest("/Notifications!A1:F2000")
  const idx = (res.values || []).findIndex((r: any[]) => r[0].toLowerCase() === email.toLowerCase() && r[5] === ts)
  if (idx !== -1) {
    const row = res.values[idx]; row[4] = "TRUE";
    await sheetsRequest(`/Notifications!A${idx + 1}:F${idx + 1}?valueInputOption=USER_ENTERED`, { method: "PUT", body: JSON.stringify({ values: [row] }) })
  }
}
