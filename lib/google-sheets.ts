import { google } from "googleapis"
import { format } from "date-fns"
import type { Task, TaskFormData } from "@/types/task"
import type { User, Notification, UserRole } from "@/types/user"

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

function getAuth() {
  let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY
  let clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL

  if (!privateKey || !clientEmail) {
    throw new Error("Missing Google Sheets credentials")
  }

  // 1. Clean the Email (Remove ALL whitespace/newlines)
  clientEmail = clientEmail.replace(/\s/g, "")

  // 2. Clean the Private Key
  try {
    // Remove outer quotes
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1)
    }
    // Convert literal \n to actual newlines
    privateKey = privateKey.replace(/\\n/g, "\n")
    privateKey = privateKey.trim()

    // Add headers if missing
    if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`
    }
  } catch (e) {
    console.error("Key cleaning error:", e)
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

function getSpreadsheetId() {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  if (!id) return null
  return id.trim().replace(/^["']|["']$/g, "")
}

// ============ TASKS ============

async function ensurePerformanceSheet() {
  const sheets = getSheets()
  const spreadsheetId = getSpreadsheetId()
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is missing")
  }

  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
  const exists = spreadsheet.data.sheets?.some(s => s.properties?.title?.trim() === "Performance")

  if (!exists) {
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: "Performance" } } }]
        }
      })

      const headers = [
        "EMP ID", "Name", "Date", "Task", "References", "Comments", "progress",
        "Task Starting Date", "Deadline", "Task Estimated Time", "Task Time taken",
        "Submission Link", "Submission Date", "deadline adherence", "grading",
        "overall score", "Task Time Stamp", "Edits", "No. of edits", "Task ID"
      ]

      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: "Performance!A1:T1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      })
    } catch (e: any) {
      if (!e.message.includes("already exists")) throw e
    }
  }
}

export async function getTasks(): Promise<Task[]> {
  try {
    const sheets = getSheets()
    const spreadsheetId = getSpreadsheetId()
    if (!spreadsheetId) {
      console.error("GOOGLE_SHEETS_SPREADSHEET_ID is missing")
      return []
    }

    // Range A2:T to include all columns up to Task ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Performance!A2:T",
    }).catch(e => {
      console.error("Error fetching Performance sheet (A2:T):", e.message)
      return { data: { values: [] } }
    })

    const rows = response.data.values || []
    return rows
      .map((row, index) => {
        const rowId = index + 2
        const name = (row[1] || "").trim()
        const taskDescription = (row[3] || "").trim()

        // Skip completely empty rows
        if (!name && !taskDescription && !row[2]) return null

        return {
          id: rowId,
          name,
          date: (row[2] || "").trim(),
          task: taskDescription,
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
      .filter((task): task is Task => task !== null)
  } catch (error) {
    console.error("getTasks fatal error:", error)
    return []
  }
}

export async function getTaskById(id: number): Promise<Task | null> {
  try {
    const sheets = getSheets()
    const spreadsheetId = getSpreadsheetId()
    if (!spreadsheetId) return null

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
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
  try {
    const spreadsheetId = getSpreadsheetId()
    if (!spreadsheetId) {
      throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID environment variable is missing or empty in Vercel settings.")
    }

    await ensurePerformanceSheet()
    const sheets = getSheets()
    const timestamp = new Date().toISOString()

    // Ensure all required fields have some value to avoid range issues
    const safeData = {
      ...data,
      name: data.name || "Unassigned",
      task: data.task || "No description",
      progress: data.progress || "To-do",
      taskStartingDate: data.taskStartingDate || format(new Date(), "yyyy-MM-dd"),
      deadline: data.deadline || format(new Date(), "yyyy-MM-dd"),
      taskEstimatedTime: data.taskEstimatedTime || "0",
    }

    // 1. Find the first truly empty row to avoid gaps
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Performance!B:B", // Look at the Name column to find the end
    })

    const values = getResponse.data.values || []
    let nextRowIndex = values.length + 1

    // Check if there are any empty rows in the middle
    for (let i = 1; i < values.length; i++) {
      if (!values[i][0] || values[i][0].toString().trim() === "") {
        nextRowIndex = i + 1
        break
      }
    }

    // Use granular updates to avoid overwriting automated columns:
    // A (EMP ID), C (Date), K (Time taken), M (Submission Date), N (Adherence), P (Score), Q (Timestamp), S (No. of edits), T (Task ID)
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

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: updates,
      },
    })

    // Construct a full row for personal sheet sync (if needed)
    const row = [
      "", // EMP ID
      safeData.name,
      "", // Date (Automated)
      safeData.task,
      safeData.references || "",
      safeData.comments || "",
      safeData.progress,
      safeData.taskStartingDate,
      safeData.deadline,
      safeData.taskEstimatedTime,
      "", // Task Time taken (Automated)
      safeData.submissionLink || "",
      "", // Submission Date (Automated)
      "", // deadline adherence (Automated)
      safeData.grading || "",
      "", // overall score (Automated)
      timestamp,
      safeData.edits || "",
      "0",
      nextRowIndex.toString(),
    ]

    // 2. Ensure User exists and has a personal sheet, then append there
    try {
      const userName = safeData.name?.trim()
      if (userName && userName !== "Unassigned" && userName !== "Guest") {
        const sanitizedSheetName = userName.replace(/[\/\\\?\*:[\]']/g, "").trim()

        if (sanitizedSheetName.length > 0) {
          await ensureUserSheet(sanitizedSheetName)
          await sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: `'${sanitizedSheetName}'!A:T`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [row] },
          }).catch(err => console.warn(`Append to user sheet [${sanitizedSheetName}] failed:`, err.message))
        }
      }
    } catch (e: any) {
      console.warn(`Could not sync to personal sheet for ${safeData.name}:`, e.message)
    }

    return nextRowIndex
  } catch (error: any) {
    console.error("createTask Error Details:", error)
    if (error.code === 403) {
      throw new Error("Permission Denied: Ensure the Google Service Account is an 'Editor' on the Google Sheet.")
    }
    if (error.code === 404) {
      throw new Error("Spreadsheet Not Found: Check your GOOGLE_SHEETS_SPREADSHEET_ID.")
    }
    throw new Error(`Google Sheets Error: ${error.message}`)
  }
}

export async function updateTask(id: number, data: Partial<TaskFormData>, currentEdits?: string): Promise<void> {
  const sheets = getSheets()
  const spreadsheetId = getSpreadsheetId()
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is missing")

  const existingTask = await getTaskById(id)
  if (!existingTask) throw new Error("Task not found")

  let noOfEdits = existingTask.noOfEdits
  if (data.edits && data.edits !== currentEdits && data.edits.trim() !== "") {
    noOfEdits += 1
  }

  // Define granular updates to avoid overwriting automated columns:
  // A (EMP ID), C (Date), K (Time taken), M (Submission Date), N (Adherence), P (Score), Q (Timestamp), S (No. of edits), T (Task ID)
  const updates = [
    {
      range: `Performance!B${id}`, // Name
      values: [[data.name ?? existingTask.name]]
    },
    {
      range: `Performance!D${id}:J${id}`, // Task through Estimated Time
      values: [[
        data.task ?? existingTask.task,
        data.references ?? existingTask.references,
        data.comments ?? existingTask.comments,
        data.progress ?? existingTask.progress,
        data.taskStartingDate ?? existingTask.taskStartingDate,
        data.deadline ?? existingTask.deadline,
        data.taskEstimatedTime ?? existingTask.taskEstimatedTime,
      ]]
    },
    {
      range: `Performance!L${id}`, // Submission Link
      values: [[data.submissionLink ?? existingTask.submissionLink]]
    },
    {
      range: `Performance!O${id}`, // Grading
      values: [[data.grading ?? existingTask.grading]]
    },
    {
      range: `Performance!R${id}`, // Edits
      values: [[data.edits ?? existingTask.edits]]
    }
  ]

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: updates,
    },
  })
}

export async function deleteTask(id: number): Promise<void> {
  const sheets = getSheets()
  const spreadsheetId = getSpreadsheetId()
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is missing")

  // Clear only the app-managed columns instead of the whole row
  // This preserves formulas in columns A, C, K, M, N, P, Q, S, T
  const rangesToClear = [
    `Performance!B${id}`,       // Name
    `Performance!D${id}:J${id}`, // Task through Estimated Time
    `Performance!L${id}`,       // Submission Link
    `Performance!O${id}`,       // Grading
    `Performance!R${id}`        // Edits
  ]

  await sheets.spreadsheets.values.batchClear({
    spreadsheetId: spreadsheetId,
    requestBody: { ranges: rangesToClear },
  })
}

// ============ USERS ============

// Simple in-memory cache to prevent Quota Exceeded errors
let usersCache: { data: User[], timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 1 minute
let employeesSheetChecked = false;

async function ensureEmployeesSheet() {
  if (employeesSheetChecked) return;

  const sheets = getSheets()
  const spreadsheetId = getSpreadsheetId()
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is missing")

  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId })
    // Support both "Employees" and "Users" sheet names
    const exists = spreadsheet.data.sheets?.some(s =>
      ["Employees", "Users"].includes(s.properties?.title?.trim() || "")
    )

    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: "Employees" } } }]
        }
      })

      const headers = ["Email", "Name", "Role"]
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: "Employees!A1:C1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      })
    }
    employeesSheetChecked = true;
  } catch (e: any) {
    if (e.message.includes("already exists")) {
      employeesSheetChecked = true;
      return;
    }
    console.error("ensureEmployeesSheet error:", e.message);
  }
}

export async function getUsers(): Promise<User[]> {
  try {
    // Check cache first
    const now = Date.now();
    if (usersCache && (now - usersCache.timestamp < CACHE_DURATION)) {
      return usersCache.data;
    }

    await ensureEmployeesSheet()
    const sheets = getSheets()
    const spreadsheetId = getSpreadsheetId()
    if (!spreadsheetId) {
      console.error("GOOGLE_SHEETS_SPREADSHEET_ID is missing")
      return []
    }

    // Get the spreadsheet once to find the correct sheet name
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
    const sheetName = spreadsheet.data.sheets?.find(s =>
      ["Employees", "Users"].includes(s.properties?.title?.trim() || "")
    )?.properties?.title || "Employees"

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z100`,
    }).catch(e => {
      console.error(`Error fetching ${sheetName} sheet:`, e.message)
      return { data: { values: [] } }
    })

    const rows = response.data.values || []
    if (rows.length === 0) return []

    // Detect column indexes from header row
    const headers = (rows[0] || []).map((h: any) => String(h).toLowerCase().trim())
    const emailIndex = headers.findIndex(h => h.includes("email"))
    const nameIndex = headers.findIndex(h => h.includes("name"))
    const roleIndex = headers.findIndex(h => h.includes("role") || h.includes("title"))

    const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean)
    const managerEmails = (process.env.MANAGER_EMAILS || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean)

    const userMap = new Map<string, User>()

    rows.slice(1)
      .filter(row => row && row.length > 0)
      .forEach((row) => {
        let email = emailIndex !== -1 ? String(row[emailIndex] || "").trim().toLowerCase() : ""
        let name = nameIndex !== -1 ? String(row[nameIndex] || "").trim() : ""
        let roleStr = roleIndex !== -1 ? String(row[roleIndex] || "").trim() : ""

        // Try to find email anywhere in the row if not in its column
        if (!email || !email.includes("@")) {
          for (const cell of row) {
            const cellStr = String(cell).trim().toLowerCase()
            if (cellStr.includes("@")) {
              email = cellStr
              break
            }
          }
        }

        if (!email) return

        // Fallback for name from email
        if (!name) {
          name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, l => l.toUpperCase())
        }

        let role: UserRole = "Team Member"
        const lowerRole = roleStr.toLowerCase()
        if (lowerRole.includes("admin")) role = "Admin"
        else if (lowerRole.includes("manager")) role = "Manager"
        else if (lowerRole.includes("viewer")) role = "Viewer"

        // ENV Override
        if (adminEmails.includes(email)) role = "Admin"
        else if (managerEmails.includes(email)) role = "Manager"

        // Merge logic: Update existing or add new
        if (userMap.has(email)) {
          const existing = userMap.get(email)!
          userMap.set(email, {
            email,
            name: (name && name !== email.split("@")[0]) ? name : existing.name,
            role: role !== "Team Member" ? role : existing.role
          })
        } else {
          userMap.set(email, { email, name, role })
        }
      })

    // Return unique users, sorted by name
    const result = Array.from(userMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))

    // Update cache
    usersCache = { data: result, timestamp: Date.now() };

    return result;
  } catch (error) {
    console.error("getUsers error:", error)
    return []
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    if (!email) return null
    const searchEmail = email.trim().toLowerCase()

    // Check ADMIN_EMAILS first for immediate admin access
    const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean)
    const managerEmails = (process.env.MANAGER_EMAILS || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean)

    const users = await getUsers()
    const existingUser = users.find((u) => u.email.trim().toLowerCase() === searchEmail)

    if (existingUser) {
      // If found in sheet, ensure role is correct based on ENV override
      let role = existingUser.role
      if (adminEmails.includes(searchEmail)) role = "Admin"
      else if (managerEmails.includes(searchEmail)) role = "Manager"

      return { ...existingUser, role }
    }

    // Fallback if not in sheet but in ENV
    if (adminEmails.includes(searchEmail)) {
      return {
        email: searchEmail,
        name: "Admin User",
        role: "Admin"
      }
    }

    if (managerEmails.includes(searchEmail)) {
      return {
        email: searchEmail,
        name: "Manager User",
        role: "Manager"
      }
    }

    return null
  } catch (error) {
    console.error("getUserByEmail error:", error)
    return null
  }
}

export async function createUser(user: User): Promise<void> {
  const sheets = getSheets()
  const spreadsheetId = getSpreadsheetId()
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is missing")

  const users = await getUsers()

  const searchEmail = user.email?.trim().toLowerCase()
  const searchName = user.name?.trim().toLowerCase()

  // Check if user already exists by email or name
  const existingUserIndex = users.findIndex(u =>
    (searchEmail && u.email?.trim().toLowerCase() === searchEmail) ||
    (searchName && u.name?.trim().toLowerCase() === searchName)
  )

  if (existingUserIndex !== -1) {
    // User exists, update missing info if necessary
    const existingUser = users[existingUserIndex]

    const updatedEmail = existingUser.email || user.email
    const updatedName = existingUser.name || user.name
    const updatedRole = existingUser.role || user.role

    // Only update if something actually changed/was missing
    if (updatedEmail !== existingUser.email || updatedName !== existingUser.name || updatedRole !== existingUser.role) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: `Employees!A${existingUserIndex + 2}:C${existingUserIndex + 2}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[updatedEmail, updatedName, updatedRole]] },
      })
    }

    // Always ensure they have a personal sheet if they are a Team Member
    if (updatedRole === "Team Member") {
      await ensureUserSheet(updatedName)
    }
    return
  }

  // New user, append to Employees master sheet
  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId,
    range: "Employees!A:C",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[user.email, user.name, user.role]] },
  })

  // If Team Member, create their personal tracking sheet
  if (user.role === "Team Member") {
    await ensureUserSheet(user.name)
  }
}

export async function ensureUserSheet(userName: string): Promise<void> {
  const sheets = getSheets()
  const spreadsheetId = getSpreadsheetId()
  if (!spreadsheetId) return

  try {
    // Create new sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: userName,
              },
            },
          },
        ],
      },
    }).catch(e => {
      if (!e.message.includes("already exists")) {
        console.error("Error creating sheet:", e.message)
      }
    })

    // Add Headers to the sheet
    const headers = [
      "EMP ID", "Name", "Date", "Task", "References", "Comments", "progress",
      "Task Starting Date", "Deadline", "Task Estimated Time", "Task Time taken",
      "Submission Link", "Submission Date", "deadline adherence", "grading",
      "overall score", "Task Time Stamp", "Edits", "No. of edits", "Task ID"
    ]

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `'${userName}'!A1:T1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [headers] },
    })
  } catch (error) {
    console.error("Error setting up user sheet:", error)
  }
}

export async function updateUser(email: string, data: { name?: string; role?: string }): Promise<void> {
  const sheets = getSheets()
  const spreadsheetId = getSpreadsheetId()
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is missing")

  const users = await getUsers()
  const searchEmail = email.trim().toLowerCase()
  const userIndex = users.findIndex((u) => u.email.trim().toLowerCase() === searchEmail)
  
  if (userIndex === -1) throw new Error("User not found")

  const currentUser = users[userIndex]
  const newName = data.name || currentUser.name
  const newRole = data.role || currentUser.role

  // Update in Employees sheet
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    range: `Employees!A${userIndex + 2}:C${userIndex + 2}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[searchEmail, newName, newRole]] },
  })

  // If name changed, we might need to handle sheet renaming, but for now just ensure new sheet exists
  await ensureUserSheet(newName)
}

export async function deleteUser(email: string): Promise<void> {
  const sheets = getSheets()
  const spreadsheetId = getSpreadsheetId()
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is missing")

  const users = await getUsers()
  const searchEmail = email.trim().toLowerCase()
  const userIndex = users.findIndex((u) => u.email.trim().toLowerCase() === searchEmail)

  if (userIndex === -1) throw new Error("User not found")

  // Get sheetId for Employees
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId })
  const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === "Employees")

  if (!sheet?.properties?.sheetId) throw new Error("Employees sheet not found")

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: "ROWS",
              startIndex: userIndex + 1,
              endIndex: userIndex + 2,
            },
          },
        },
      ],
    },
  })
}


// ============ NOTIFICATIONS ============

async function ensureNotificationsSheet() {
  const sheets = getSheets()
  const spreadsheetId = getSpreadsheetId()
  if (!spreadsheetId) return

  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId })
  const exists = spreadsheet.data.sheets?.some(s => s.properties?.title?.trim() === "Notifications")

  if (!exists) {
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: "Notifications" } } }]
        }
      })

      const headers = ["ID", "User Email", "Type", "Task ID", "Message", "Read", "Timestamp"]
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: "Notifications!A1:G1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      })
    } catch (e: any) {
      if (!e.message.includes("already exists")) throw e
    }
  }
}

export async function getNotifications(userEmail: string): Promise<Notification[]> {
  try {
    const sheets = getSheets()
    const spreadsheetId = getSpreadsheetId()
    if (!spreadsheetId) return []

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
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
  try {
    await ensureNotificationsSheet()
    const sheets = getSheets()
    const spreadsheetId = getSpreadsheetId()
  if (!spreadsheetId) return

  const id = `notif_${Date.now()}`
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId,
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
  } catch (error) {
    console.error("createNotification error:", error)
  }
}

export async function markNotificationsRead(userEmail: string): Promise<void> {
  const sheets = getSheets()
  const spreadsheetId = getSpreadsheetId()
  if (!spreadsheetId) return

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
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
      spreadsheetId: spreadsheetId,
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
    const spreadsheetId = getSpreadsheetId()
    if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not defined")

    // 1. Fetch main KPIs from Summary sheet
    const summaryResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: "Summary!A2:G2",
    }).catch(e => {
      console.error("Error fetching Summary sheet:", e.message)
      return { data: { values: [] } }
    })

    const summary = summaryResponse.data.values?.[0] || []

    // 2. Fetch Detailed Employee Stats from Employees sheet
    const employeeResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: "Employees!A2:I",
    }).catch(e => {
      console.error("Error fetching Employees sheet:", e.message)
      return { data: { values: [] } }
    })

    const employeeRows = employeeResponse.data.values || []

    const employeeStats = employeeRows.map(row => ({
      name: String(row[1] || "Unknown").trim(),
      title: String(row[2] || "Employee").trim(),
      tasks: parseInt(row[3]) || 0,
      completed: parseInt(row[4]) || 0,
      overallScore: parseFloat(row[5]) || 0,
      shiftAdherence: parseFloat(row[6]) || 0,
      edits: parseInt(row[7]) || 0,
      performance: String(row[8] || "Good").trim() as "Excellent" | "Good" | "Needs Improvement",
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

