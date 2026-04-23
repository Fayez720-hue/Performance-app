import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { getDashboardStats } from "@/lib/google-sheets"

export async function GET(request: Request) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined

    const stats = await getDashboardStats(startDate, endDate)

    // Add role and context to the response
    return NextResponse.json({
      ...stats,
      userRole: (session.user as any)?.role || "Team Member",
      isPersonalView: (session.user as any)?.role === "Team Member"
    })
  } catch (error) {
    console.error("Dashboard API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
