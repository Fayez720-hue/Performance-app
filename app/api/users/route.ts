export const dynamic = 'force-dynamic'
export const runtime = 'edge'
;

import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = await getUserByEmail(session.user.email)
    const users = await getUsers()

    // If current user is not in the sheet, add them to the list as a fallback
    if (!currentUser && session.user.email) {
      const fallbackUser = {
        email: session.user.email,
        name: session.user.name || "Guest",
        role: "Admin" as const // Default to Admin for the first user
      }
      return NextResponse.json([fallbackUser, ...users])
    }

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
    const { email, name, role } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    await updateUser(email, { name, role })
    return NextResponse.json({ message: "User updated successfully" })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    await deleteUser(email)
    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

