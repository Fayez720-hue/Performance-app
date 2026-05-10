import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getAttendance, clockIn, clockOut, getUserByEmail } from "@/lib/db-queries"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const attendance = await getAttendance(session.user.email)
    return NextResponse.json(attendance)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { action } = await request.json()
    const user = await getUserByEmail(session.user.email)
    const name = user?.name || session.user.name || "Unknown"

    if (action === "clock-in") {
      await clockIn(session.user.email, name)
      return NextResponse.json({ success: true, message: "Clocked in successfully" })
    } else if (action === "clock-out") {
      await clockOut(session.user.email)
      return NextResponse.json({ success: true, message: "Clocked out successfully" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 })
  }
}
