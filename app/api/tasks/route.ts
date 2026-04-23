import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getTasks, createTask, getUserByEmail, getTaskById } from "@/lib/google-sheets"
import { ROLE_PERMISSIONS } from "@/types/user"
import type { UserRole } from "@/types/user"
import { notifyTaskAssigned } from "@/lib/notifications"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 1. Get official user details from the Employees sheet
    const user = await getUserByEmail(session.user.email)

    // 2. Resolve Role (Priority: ENV > Sheets > Default)
    const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean)
    const managerEmails = (process.env.MANAGER_EMAILS || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean)
    const email = session.user.email.toLowerCase()

    let role: UserRole = user?.role || "Team Member"
    if (adminEmails.includes(email)) role = "Admin"
    else if (managerEmails.includes(email)) role = "Manager"

    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["Team Member"]

    // 3. Get All Tasks
    let tasks = await getTasks()

    // 4. Filter for Team Members / Viewers
    if (!permissions.canViewAllTasks) {
      // Collect possible name variations for this user
      const namesToMatch = new Set<string>()

      // Official name from Employees sheet (HIGH PRIORITY)
      if (user?.name) {
        namesToMatch.add(user.name.toLowerCase().trim())
      }

      // Name from Google Profile
      if (session.user?.name) {
        namesToMatch.add(session.user.name.toLowerCase().trim())
      }

      // The email itself (Important for amrmaged412@gmail.com)
      if (email) {
        namesToMatch.add(email)
      }

      // Email prefix (backup)
      if (email.includes("@")) {
        namesToMatch.add(email.split("@")[0].toLowerCase().trim())
      }

      console.log(`Filtering tasks for user ${email}. Matching against:`, Array.from(namesToMatch))

      tasks = tasks.filter(t => {
        const assignedName = (t.name || "").toLowerCase().trim()
        if (!assignedName) return false

        // Return true if the assigned name matches ANY of our name variations (exact or partial)
        return Array.from(namesToMatch).some(name =>
          assignedName === name ||
          assignedName.includes(name) ||
          name.includes(assignedName)
        )
      })
    }

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Tasks API Error:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Check permissions
    const user = await getUserByEmail(session.user.email)
    const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean)
    const managerEmails = (process.env.MANAGER_EMAILS || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean)
    const email = session.user.email.toLowerCase()

    let role: UserRole = user?.role || "Team Member"
    if (adminEmails.includes(email)) role = "Admin"
    else if (managerEmails.includes(email)) role = "Manager"

    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["Team Member"]

    if (!permissions.canCreateTasks) {
      return NextResponse.json({ error: "Forbidden: You don't have permission to create tasks" }, { status: 403 })
    }

    const data = await request.json()
    const id = await createTask(data)

    // Notify assignee
    const newTask = await getTaskById(id)
    if (newTask) {
      await notifyTaskAssigned(newTask, session.user.name || undefined)
    }

    return NextResponse.json({ id })
  } catch (error) {
    console.error("Create Task Error:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
