"use client"

import { useState } from "react"
import useSWR from "swr"
import { Loader2, Plus, Shield, UserCog, Users } from "lucide-react"
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
import { Empty } from "@/components/ui/empty"
import { userSchema, type UserFormValues } from "@/lib/validations/task"
import type { User, UserRole } from "@/types/user"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const roleColors: Record<UserRole, string> = {
  Admin: "bg-red-500/10 text-red-400",
  Manager: "bg-blue-500/10 text-blue-400",
  "Team Member": "bg-emerald-500/10 text-emerald-400",
  Viewer: "bg-zinc-500/10 text-zinc-400",
}

const ROLES: UserRole[] = ["Admin", "Manager", "Team Member", "Viewer"]

export function UserManagement() {
  const { data: users, error, isLoading, mutate } = useSWR<User[]>("/api/users", fetcher)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "Team Member",
    },
  })

  async function onSubmit(values: UserFormValues) {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add user")
      }

      toast.success("User added successfully")
      setIsAddDialogOpen(false)
      form.reset()
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add user")
    }
  }

  async function handleRoleChange(email: string, newRole: UserRole) {
    setUpdatingUser(email)
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: newRole }),
      })

      if (!response.ok) throw new Error("Failed to update role")

      toast.success("Role updated successfully")
      mutate()
    } catch {
      toast.error("Failed to update role")
    } finally {
      setUpdatingUser(null)
    }
  }

  if (error) {
    return (
      <Empty
        icon={Users}
        title="Failed to load users"
        description="There was an error loading the users. Please try again."
      />
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system. They will be able to sign in with Google.
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
                          <Input placeholder="user@example.com" {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add User</Button>
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
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.email, value as UserRole)}
                          disabled={updatingUser === user.email}
                        >
                          <SelectTrigger className="w-[140px]">
                            {updatingUser === user.email ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <Empty
              icon={Users}
              title="No users yet"
              description="Add your first user to get started."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
