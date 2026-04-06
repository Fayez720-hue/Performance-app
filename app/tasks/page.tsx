import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserByEmail } from "@/lib/google-sheets"
import { Header } from "@/components/layout/header"
import { TaskDeck } from "@/components/tasks/task-deck"
import Link from "next/link"

export default async function TasksPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await getUserByEmail(session.user.email)
  
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            ← Back to Dashboard
          </Link>
        </div>
        
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Task Dashboard</h1>
          <p className="text-muted-foreground">
            {user.role === "Team Member" 
              ? "View and manage your assigned tasks"
              : "Manage and track all team tasks"}
          </p>
        </div>
        
        <TaskDeck userRole={user.role} userName={user.name} />
      </main>
    </div>
  )
}