

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getNotifications, markNotificationsRead } from "@/lib/google-sheets"

// Satisfy 'output: export' for the APK build
export const dynamic = "force-static"

export async function GET() {
  // If we are building for the APK, return a dummy response
  if (process.env.STATIC_BUILD === 'true') {
    return NextResponse.json({ static: true })
  }
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notifications = await getNotifications(session.user.email)
    return NextResponse.json(notifications || [])
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await markNotificationsRead(session.user.email)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}
