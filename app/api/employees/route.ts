import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getUsers } from "@/lib/db-queries"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const users = await getUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error("Employees API Error:", error)
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
  }
}
