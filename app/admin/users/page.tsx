import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserByEmail } from "@/lib/google-sheets"
import { ROLE_PERMISSIONS } from "@/types/user"
import { Header } from "@/components/layout/header"
import { UserManagement } from "@/components/admin/user-management"

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await getUserByEmail(session.user.email)
  
  if (!user) {
    redirect("/login")
  }

  const permissions = ROLE_PERMISSIONS[user.role]

  if (!permissions.canManageUsers) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <UserManagement />
      </main>
    </div>
  )
}
