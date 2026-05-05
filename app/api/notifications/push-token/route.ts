import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { savePushToken } from "@/lib/google-sheets"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: "Token is required" }, { status: 400 })

    await savePushToken(session.user.email, token)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Push Token API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
