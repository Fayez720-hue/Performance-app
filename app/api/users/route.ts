import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getUsers, addUser, updateUser, deleteUserByEmail } from "@/lib/google-sheets"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const users = await getUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error("Users API Error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const data = await request.json()
    // Required fields: email, name, role. Title is optional.
    if (!data.email || !data.name || !data.role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await addUser({
      email: data.email,
      name: data.name,
      role: data.role,
      title: data.title || "",   // ✅ pass title (optional)
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Add User API Error:", error)
    return NextResponse.json({ error: error.message || "Failed to add user" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const data = await request.json()
    if (!data.email) return NextResponse.json({ error: "Email is required" }, { status: 400 })

    const { email, oldEmail, name, role, title } = data
    const updateData: Partial<{ name: string; role: string; title: string }> = {}
    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (title !== undefined) updateData.title = title   // ✅ include title

    await updateUser(email, updateData, oldEmail)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Update User API Error:", error)
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 })

    await deleteUserByEmail(email)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete User API Error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 })
  }
}