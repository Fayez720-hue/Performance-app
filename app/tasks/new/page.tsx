import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserByEmail, getUsers } from "@/lib/google-sheets"
import { ROLE_PERMISSIONS } from "@/types/user"
import { TaskForm } from "@/components/tasks/task-form"
import { Header } from "@/components/layout/header"

export default async function NewTaskPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await getUserByEmail(session.user.email) || {
    email: session.user.email,
    name: session.user.name || "Guest",
    role: "Admin"
  }

  const permissions = ROLE_PERMISSIONS[user.role]

  if (!permissions.canCreateTasks) {
    redirect("/")
  }

  const allUsers = await getUsers()
  console.log("ALL USERS FETCHED ON PAGE:", allUsers.length)

  // Ensure we have at least some names, even if fetching fails
  const employeeNames = allUsers.length > 0
    ? allUsers.map(u => u.name).filter(Boolean)
    : [user.name, "Abdel Rahman Talaat", "Ahmed Fayez", "Malak Abdel Aziz", "Mohamed Abdel Sattar", "Haneen Abdel Fattah", "Amira Sobhy", "Obada Hisham"];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <TaskForm
          mode="create"
          userRole={user.role}
          userName={user.name}
          employees={employeeNames}
        />
      </main>
    </div>
  )
}

