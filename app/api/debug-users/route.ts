import { NextResponse } from "next/server"
import { getUsers } from "@/lib/google-sheets"

export async function GET() {
  try {
    console.log("Debug: Fetching users from API...")
    const users = await getUsers()
    console.log("Debug: Found users:", JSON.stringify(users))
    return NextResponse.json({
      count: users.length,
      users: users
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
