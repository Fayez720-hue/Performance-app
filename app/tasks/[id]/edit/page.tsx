import { redirect, notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserByEmail, getTaskById } from "@/lib/google-sheets"
import { ROLE_PERMISSIONS } from "@/types/user"
import { TaskForm } from "@/components/tasks/task-form"
import { Header } from "@/components/layout/header"

interface EditTaskPageProps {
  params: Promise<{ id: string }>
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await getUserByEmail(session.user.email)
  
  if (!user) {
    redirect("/login")
  }

  const { id } = await params
  const taskId = parseInt(id)
  const task = await getTaskById(taskId)

  if (!task) {
    notFound()
  }

  const permissions = ROLE_PERMISSIONS[user.role]
  
  // Check if user can edit this task
  const canEdit = permissions.canEditAllTasks || 
    (permissions.canEditOwnTasks && task.name === user.name)
  
  if (!canEdit) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <TaskForm task={task} mode="edit" userRole={user.role} userName={user.name} />
      </main>
    </div>
  )
}
