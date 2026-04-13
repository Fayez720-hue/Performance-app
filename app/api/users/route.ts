
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUsers, createUser, updateUser, deleteUser, getUserByEmail } from "@/lib/google-sheets"
import { ROLE_PERMISSIONS } from "@/types/user"

// Satisfy 'output: export' for the APK build
export const dynamic = "force-static"

export async function GET() {
  // If we are building for the APK, return a dummy response
  if (process.env.STATIC_BUILD === 'true') {
    return NextResponse.json({ static: true })
  }
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    if (!currentUser || !ROLE_PERMISSIONS[currentUser.role].canManageUsers) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const data = await request.json()
    await createUser(data)
    return NextResponse.json({ message: "User created" })
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
    if (!currentUser || !ROLE_PERMISSIONS[currentUser.role].canManageUsers) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { email, ...data } = await request.json()
    await updateUser(email, data)
    return NextResponse.json({ message: "User updated" })
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
    if (!currentUser || !ROLE_PERMISSIONS[currentUser.role].canManageUsers) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { email } = await request.json()
    await deleteUser(email)
    return NextResponse.json({ message: "User deleted" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
