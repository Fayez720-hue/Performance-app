import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getTasks, createTask } from "@/lib/google-sheets"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const tasks = await getTasks()
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
