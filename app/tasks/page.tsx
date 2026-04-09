import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserByEmail } from "@/lib/google-sheets"
import { Header } from "@/components/layout/header"
import { TaskDeck } from "@/components/tasks/task-deck"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function TasksPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await getUserByEmail(session.user.email)
  
  // If user is not found in the sheet, fallback to session data
  const displayUser = user || {
    email: session.user.email,
    name: session.user.name || "Guest",
    role: ((session.user as any).role || "Viewer") as any
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
            {displayUser.role === "Team Member"
              ? "View and manage your assigned tasks"
              : "Manage and track all team tasks"}
          </p>
        </div>
        
        <TaskDeck userRole={displayUser.role} userName={displayUser.name} />

        {/* Floating Action Button - Positioned relative to content */}
        {displayUser.role !== "Viewer" && (
          <Link
            href="/tasks/new"
            className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition-transform hover:scale-110 active:scale-95 sm:right-10 lg:sticky lg:float-right lg:bottom-10 lg:mr-0 lg:mt-[-80px]"
          >
            <Plus className="h-8 w-8" />
            <span className="sr-only">Add New Task</span>
          </Link>
        )}
      </main>
    </div>
  )
}
