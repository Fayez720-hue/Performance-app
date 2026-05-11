import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getProjects, createProject, getProjectProgress } from "@/lib/db-queries"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const projects = await getProjects()
    
    // Add progress to each project
    const projectsWithProgress = await Promise.all(
      projects.map(async (p) => ({
        ...p,
        progress: await getProjectProgress(p.id),
      }))
    )

    return NextResponse.json(projectsWithProgress)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userRole = (session.user as any)?.role
    if (userRole !== "Admin" && userRole !== "Manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const data = await req.json()
    const id = await createProject({ ...data, createdBy: session.user?.email || "" })
    return NextResponse.json({ id })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}