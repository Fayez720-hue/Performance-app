import { NextResponse } from "next/server"
import { getUsers } from "@/lib/google-sheets"

// Satisfy 'output: export' for the APK build
export const dynamic = "force-static"

export async function GET() {
  // If we are building for the APK, return a dummy response
  if (process.env.STATIC_BUILD === 'true') {
    return NextResponse.json({ static: true })
  }

  try {
    const users = await getUsers()
    const response = {
      userCount: users.length,
      users: users.map(u => ({ email: u.email, name: u.name, role: u.role })),
      envVars: {
        ADMIN_EMAILS: process.env.ADMIN_EMAILS ? "SET" : "NOT SET",
        MANAGER_EMAILS: process.env.MANAGER_EMAILS ? "SET" : "NOT SET"
      }
    }
    return NextResponse.json(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
