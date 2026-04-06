import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserByEmail } from "@/lib/google-sheets"
import { ROLE_PERMISSIONS } from "@/types/user"
import { TaskForm } from "@/components/tasks/task-form"
import { Header } from "@/components/layout/header"

export default async function NewTaskPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await getUserByEmail(session.user.email)
  
  if (!user) {
    redirect("/login")
  }

  const permissions = ROLE_PERMISSIONS[user.role]

  if (!permissions.canCreateTasks) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <TaskForm mode="create" userRole={user.role} userName={user.name} />
      </main>
    </div>
  )
}
