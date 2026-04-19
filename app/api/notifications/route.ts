import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
// Notifications are not in the core sheet yet, so return an empty list for now
// to prevent the 404 error from crashing the client.

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    return NextResponse.json([])
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
