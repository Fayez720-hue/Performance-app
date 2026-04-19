import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getTasks, createTask, getUserByEmail } from "@/lib/google-sheets"
import { ROLE_PERMISSIONS } from "@/types/user"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await getUserByEmail(session.user.email)

    // Check ENV variables as fallback for Admin/Manager status
    const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean)
    const managerEmails = (process.env.MANAGER_EMAILS || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean)
    const email = session.user.email.toLowerCase()

    let role: UserRole = user?.role || "Team Member"
    if (adminEmails.includes(email)) role = "Admin"
    else if (managerEmails.includes(email)) role = "Manager"

    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["Team Member"]

    // If this view is for managers/admins only, we can check here
    if (role === "Team Member" || role === "Viewer") {
       // Optional: Return empty or unauthorized if regular users shouldn't even call this
       // For now, we still allow them to see THEIR tasks if you want,
       // but based on your request, we can restrict the whole page.
    }

    let tasks = await getTasks()

    // If user cannot view all tasks, filter by name
    if (!permissions.canViewAllTasks) {
      const searchName = (user?.name || session.user?.name || "").toLowerCase().trim()
      tasks = tasks.filter(t => {
        const taskName = (t.name || "").toLowerCase().trim()
        return taskName === searchName || taskName.includes(searchName) || searchName.includes(taskName)
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
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const data = await request.json()
    const id = await createTask(data)
    return NextResponse.json({ id })
  } catch (error) {
    console.error("Create Task Error:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
