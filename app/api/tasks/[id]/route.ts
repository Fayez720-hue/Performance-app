import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { getTaskById, updateTask, deleteTask } from "@/lib/google-sheets"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const task = await getTaskById(parseInt(params.id))
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 })

    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const data = await request.json()
    await updateTask(parseInt(params.id), data)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await deleteTask(parseInt(params.id))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
