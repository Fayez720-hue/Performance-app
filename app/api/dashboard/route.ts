import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { getDashboardStats } from "@/lib/google-sheets"

import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined
    const userEmail = (session.user as any)?.email
    const userRole = (session.user as any)?.role

    const stats = await getDashboardStats(startDate, endDate, userEmail, userRole)

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
