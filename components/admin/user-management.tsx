"use client"

import { useState } from "react"
import useSWR from "swr"
import { Edit2, Loader2, Plus, Shield, Trash2, UserCog, Users } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty"
import { userSchema, type UserFormValues } from "@/lib/validations/task"
import type { User, UserRole } from "@/types/user"
import { cn } from "@/lib/utils"
import { fetcher, getApiUrl } from "@/lib/api"

const roleColors: Record<UserRole, string> = {
  Admin: "bg-red-500/10 text-red-400",
  Manager: "bg-blue-500/10 text-blue-400",
  "Team Member": "bg-emerald-500/10 text-emerald-400",
  Viewer: "bg-zinc-500/10 text-zinc-400",
}

const ROLES: UserRole[] = ["Admin", "Manager", "Team Member", "Viewer"]

export function UserManagement() {
  const { data: users, error, isLoading, mutate } = useSWR<User[]>("/api/users", fetcher)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "Team Member",
    },
  })

  // Reset form when dialog opens/closes or editing user changes
  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingUser(null)
      form.reset({
        email: "",
        name: "",
        role: "Team Member",
      })
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    form.reset({
      email: user.email,
      name: user.name,
      role: user.role,
    })
    setIsDialogOpen(true)
  }

  async function onSubmit(values: UserFormValues) {
    // Optimistic UI Update
    const previousUsers = users
    const updatedUsers = editingUser
      ? users?.map(u => u.email === values.email ? { ...values } as User : u)
      : [...(users || []), { ...values } as User]

    mutate(updatedUsers, false) // Update UI immediately without re-fetching

    try {
      const method = editingUser ? "PUT" : "POST"
      const response = await fetch(getApiUrl("/api/users"), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${editingUser ? 'update' : 'add'} user`)
      }

      toast.success(`User ${editingUser ? 'updated' : 'added'} successfully`)
      handleOpenChange(false)
      mutate() // Re-fetch to sync with server
    } catch (error) {
      mutate(previousUsers) // Rollback on error
      toast.error(error instanceof Error ? error.message : "An error occurred")
    }
  }

  async function handleDelete(email: string) {
    if (!confirm("Are you sure you want to delete this user? This will remove them from the Employees list.")) return

    // Optimistic UI Update
    const previousUsers = users
    mutate(users?.filter(u => u.email !== email), false)

    try {
      const response = await fetch(getApiUrl(`/api/users?email=${encodeURIComponent(email)}`), {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete user")

      toast.success("User deleted successfully")
      mutate() // Re-fetch to sync
    } catch {
      mutate(previousUsers) // Rollback
      toast.error("Failed to delete user")
    }
  }

  async function handleRoleChange(email: string, newRole: UserRole) {
    setUpdatingUser(email)

    // Optimistic UI Update
    const previousUsers = users
    mutate(users?.map(u => u.email === email ? { ...u, role: newRole } : u), false)

    try {
      const response = await fetch(getApiUrl("/api/users"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: newRole }),
      })

      if (!response.ok) throw new Error("Failed to update role")

      toast.success("Role updated successfully")
      mutate()
    } catch {
      mutate(previousUsers) // Rollback
      toast.error("Failed to update role")
    } finally {
      setUpdatingUser(null)
    }
  }

  if (error) {
    return (
      <Empty className="py-20">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users />
          </EmptyMedia>
          <EmptyTitle>Failed to load users</EmptyTitle>
          <EmptyDescription>
            There was an error loading the users. Please try again.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const userCounts = {
    Admin: users?.filter((u) => u.role === "Admin").length || 0,
    Manager: users?.filter((u) => u.role === "Manager").length || 0,
    "Team Member": users?.filter((u) => u.role === "Team Member").length || 0,
    Viewer: users?.filter((u) => u.role === "Viewer").length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((role) => (
          <Card key={role} className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", roleColors[role].replace("text-", "bg-").replace("400", "500/10"))}>
                {role === "Admin" ? (
                  <Shield className={cn("h-5 w-5", roleColors[role].split(" ")[1])} />
                ) : (
                  <UserCog className={cn("h-5 w-5", roleColors[role].split(" ")[1])} />
                )}
              </div>
              <div>
                <p className="text-2xl font-semibold text-card-foreground">{userCounts[role]}</p>
                <p className="text-sm text-muted-foreground">{role}{role !== "Admin" ? "s" : "s"}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Table */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Users</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "Update the user's name or role."
                    : "Add a new user to the system. They will be able to sign in with Google."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="user@example.com"
                            {...field}
                            disabled={!!editingUser}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingUser ? "Update User" : "Add User"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const initials = user.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "U"

                  return (
                    <TableRow key={user.email}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-xs text-primary">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs font-medium", roleColors[user.role])}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(user.email)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <Empty className="py-20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>No users yet</EmptyTitle>
                <EmptyDescription>
                  Add your first user to get started.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
