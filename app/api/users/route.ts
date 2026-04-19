import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { getUsers } from "@/lib/google-sheets"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const users = await getUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error("Users API Error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
