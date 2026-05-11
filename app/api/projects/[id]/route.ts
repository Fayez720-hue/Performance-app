import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getProjectById, getTasksByProject, getProjectProgress } from "@/lib/db-queries"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const project = await getProjectById(parseInt(params.id))
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    const tasks = await getTasksByProject(parseInt(params.id))
    const progress = await getProjectProgress(parseInt(params.id))

    return NextResponse.json({ project, tasks, progress })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
  }
}