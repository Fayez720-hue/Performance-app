import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { getNotifications } from "@/lib/google-sheets"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const notifications = await getNotifications(session.user.email)
    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Notifications API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
