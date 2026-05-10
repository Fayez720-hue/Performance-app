import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { getNotifications, markAllNotificationsAsRead } from "@/lib/db-queries"

import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const notifications = await getNotifications(session.user.email)
    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Notifications API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await markAllNotificationsAsRead(session.user.email)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notifications Mark Read Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
