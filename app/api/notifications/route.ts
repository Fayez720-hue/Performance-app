import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { getNotifications, markNotificationAsRead } from "@/lib/google-sheets"

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

    const notifications = await getNotifications(session.user.email)
    const unread = notifications.filter(n => !n.read)

    for (const notification of unread) {
      await markNotificationAsRead(session.user.email, notification.timestamp)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notifications Mark Read Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
