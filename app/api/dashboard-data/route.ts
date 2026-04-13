

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDashboardStats } from "@/lib/google-sheets"

// Satisfy 'output: export' for the APK build
export const dynamic = "force-static"

export async function GET() {
  // If we are building for the APK, return a dummy response
  if (process.env.STATIC_BUILD === 'true') {
    return NextResponse.json({ static: true })
  }
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stats = await getDashboardStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Dashboard data API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
