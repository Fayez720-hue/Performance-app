import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUsers, createUser, updateUserRole, getUserByEmail } from "@/lib/google-sheets"
import { userSchema } from "@/lib/validations/task"
import { ROLE_PERMISSIONS } from "@/types/user"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = await getUserByEmail(session.user.email)
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const permissions = ROLE_PERMISSIONS[currentUser.role]
    if (!permissions.canManageUsers) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const users = await getUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = await getUserByEmail(session.user.email)
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const permissions = ROLE_PERMISSIONS[currentUser.role]
    if (!permissions.canManageUsers) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = userSchema.parse(body)

    // Check if user already exists
    const existingUser = await getUserByEmail(validatedData.email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    await createUser(validatedData)
    return NextResponse.json({ message: "User created successfully" })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = await getUserByEmail(session.user.email)
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const permissions = ROLE_PERMISSIONS[currentUser.role]
    if (!permissions.canManageUsers) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 })
    }

    await updateUserRole(email, role)
    return NextResponse.json({ message: "User role updated successfully" })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
