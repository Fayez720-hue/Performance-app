"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { ClipboardX, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskCard } from "./task-card"
import { TaskFilters } from "./task-filters"
import { TaskStats } from "./task-stats"
import type { User } from "@/types/user"
import { fetcher } from "@/lib/api"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty"
import type { Task, TaskProgress } from "@/types/task"
import type { UserRole } from "@/types/user"
import { ROLE_PERMISSIONS } from "@/types/user"

interface TaskDeckProps {
  user: User
}

export function TaskDeck({ user }: TaskDeckProps) {
  const userRole = user.role || "Team Member"
  const userName = user.name || "Guest"

  const { data: tasks, error, isLoading, mutate } = useSWR<Task[]>("/api/tasks", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  })

  const { data: users } = useSWR<User[]>("/api/users", fetcher)

  const [search, setSearch] = useState("")
  const [progressFilter, setProgressFilter] = useState<TaskProgress | "all">("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")
  const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const taskIdParam = searchParams.get('taskId')
  const timestampParam = searchParams.get('t')
  const highlightToken = taskIdParam ? `${taskIdParam}-${timestampParam || ''}` : null

  // Handle auto-opening task from URL param
  useEffect(() => {
    if (taskIdParam) {
      const id = parseInt(taskIdParam)
      setHighlightedTaskId(id)

      // Clear filters so the task is visible
      setSearch("")
      setProgressFilter("all")
      setAssigneeFilter("all")
    }
  }, [taskIdParam, timestampParam])

  // Auto-scroll logic separated to run only when tasks load
  useEffect(() => {
    if (taskIdParam && !isLoading && Array.isArray(tasks) && tasks.length > 0) {
      const id = parseInt(taskIdParam)
      setTimeout(() => {
        const element = document.getElementById(`task-${id}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 300)
    }
  }, [taskIdParam, timestampParam, isLoading, tasks])

  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS["Viewer"]

  // Get unique assignees
  const assignees = useMemo(() => {
    // Priority 1: All registered users
    if (Array.isArray(users) && users.length > 0) {
      return [...new Set(users.map((u) => u.name).filter(Boolean))].sort()
    }
    // Priority 2: Unique names from existing tasks
    if (Array.isArray(tasks)) {
      return [...new Set(tasks.map((t) => t.name).filter(Boolean))].sort()
    }
    return []
  }, [tasks, users])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return []

    return tasks.filter((task) => {
      // Role-based visibility:
      // We TRUST the API to have already filtered tasks for Team Members.
      // We only apply search and filter selections here.

      // If a task is explicitly referred to by a notification URL, show ONLY that task
      if (taskIdParam && task.id !== parseInt(taskIdParam)) {
        return false
      }

      // Search filter
      const matchesSearch =
        task.task.toLowerCase().includes(search.toLowerCase()) ||
        task.name.toLowerCase().includes(search.toLowerCase())

      // Progress filter
      const matchesProgress = progressFilter === "all" || task.progress === progressFilter

      // Assignee filter
      const matchesAssignee = assigneeFilter === "all" || task.name === assigneeFilter

      return matchesSearch && matchesProgress && matchesAssignee
    })
  }, [tasks, search, progressFilter, assigneeFilter, taskIdParam])

  // Group tasks by progress
  const groupedTasks = useMemo(() => {
    const groups: Record<TaskProgress, Task[]> = {
      "To-do": [],
      "In Progress": [],
      "Review": [],
      "Completed": [],
    }

    filteredTasks.forEach((task) => {
      // Ensure the task progress is a valid key in the groups object
      const progress = task.progress as TaskProgress
      if (groups[progress]) {
        groups[progress].push(task)
      } else {
        // Fallback to To-do if status is invalid or missing
        groups["To-do"].push(task)
      }
    })

    return groups
  }, [filteredTasks])

  if (error) {
    return (
      <Empty className="py-20">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ClipboardX />
          </EmptyMedia>
          <EmptyTitle>Failed to load tasks</EmptyTitle>
          <EmptyDescription>
            There was an error loading the tasks. Please try again.
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

  return (
    <div className="space-y-6">
      {/* Target Task Banner */}
      {taskIdParam && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-4 gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-primary">Viewing Highlighted Task</span>
            <span className="text-xs text-muted-foreground">The list is filtered to show only the currently selected task.</span>
          </div>
          <Button variant="default" size="sm" onClick={() => router.push('/tasks')}>
            Show All Tasks
          </Button>
        </div>
      )}

      {/* Stats */}
      {tasks && tasks.length > 0 && <TaskStats tasks={tasks} />}

      {/* Filters */}
      <TaskFilters
        search={search}
        onSearchChange={setSearch}
        progressFilter={progressFilter}
        onProgressFilterChange={setProgressFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        assignees={assignees}
        userRole={userRole}
      />

      {/* Empty State */}
      {tasks && tasks.length === 0 && (
        <Empty className="py-20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardX />
            </EmptyMedia>
            <EmptyTitle>No tasks yet</EmptyTitle>
            <EmptyDescription>
              {permissions.canCreateTasks
                ? "Create your first task to get started."
                : "No tasks have been assigned to you yet."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {/* No Results */}
      {tasks && tasks.length > 0 && filteredTasks.length === 0 && (
        <Empty className="py-20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardX />
            </EmptyMedia>
            <EmptyTitle>No matching tasks</EmptyTitle>
            <EmptyDescription>
              Try adjusting your search or filters.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {/* Task Grid by Status */}
      {filteredTasks.length > 0 && (
        <div className="space-y-8">
          {(Object.keys(groupedTasks) as TaskProgress[]).map((status) => {
            const statusTasks = groupedTasks[status]
            if (statusTasks.length === 0) return null

            return (
              <div key={status}>
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{status}</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {statusTasks.length}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {statusTasks.map((task) => {
                    const isUnderReview = task.progress === "Review" || task.progress === "Completed"
                    const canEdit =
                      permissions.canEditAllTasks ||
                      (permissions.canEditOwnTasks &&
                        !isUnderReview && (
                        task.name.toLowerCase() === userName.toLowerCase() ||
                        (user.email && task.name.toLowerCase() === user.email.toLowerCase())
                      ))
                    const canDelete = permissions.canDeleteTasks

                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        onDelete={() => mutate()}
                        autoExpand={highlightedTaskId === task.id}
                        highlightToken={highlightedTaskId === task.id ? highlightToken : null}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
