"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { Loader2, ClipboardX } from "lucide-react"
import { TaskCard } from "./task-card"
import { TaskFilters } from "./task-filters"
import { TaskStats } from "./task-stats"
import { Empty } from "@/components/ui/empty"
import type { Task, TaskProgress } from "@/types/task"
import type { UserRole } from "@/types/user"
import { ROLE_PERMISSIONS } from "@/types/user"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface TaskDeckProps {
  userRole: UserRole
  userName: string
}

export function TaskDeck({ userRole, userName }: TaskDeckProps) {
  const { data: tasks, error, isLoading, mutate } = useSWR<Task[]>("/api/tasks", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  })

  const [search, setSearch] = useState("")
  const [progressFilter, setProgressFilter] = useState<TaskProgress | "all">("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")

  const permissions = ROLE_PERMISSIONS[userRole]

  // Get unique assignees
  const assignees = useMemo(() => {
    if (!Array.isArray(tasks)) return []
    return [...new Set(tasks.map((t) => t.name).filter(Boolean))]
  }, [tasks])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return []

    return tasks.filter((task) => {
      // Search filter
      const searchLower = search.toLowerCase()
      const matchesSearch =
        !search ||
        task.task.toLowerCase().includes(searchLower) ||
        task.name.toLowerCase().includes(searchLower) ||
        task.comments?.toLowerCase().includes(searchLower) ||
        task.references?.toLowerCase().includes(searchLower)

      // Progress filter
      const matchesProgress = progressFilter === "all" || task.progress === progressFilter

      // Assignee filter
      const matchesAssignee = assigneeFilter === "all" || task.name === assigneeFilter

      return matchesSearch && matchesProgress && matchesAssignee
    })
  }, [tasks, search, progressFilter, assigneeFilter])

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
      <Empty
        icon={ClipboardX}
        title="Failed to load tasks"
        description="There was an error loading the tasks. Please try again."
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

  return (
    <div className="space-y-6">
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
      />

      {/* Empty State */}
      {tasks && tasks.length === 0 && (
        <Empty
          icon={ClipboardX}
          title="No tasks yet"
          description={
            permissions.canCreateTasks
              ? "Create your first task to get started."
              : "No tasks have been assigned to you yet."
          }
        />
      )}

      {/* No Results */}
      {tasks && tasks.length > 0 && filteredTasks.length === 0 && (
        <Empty
          icon={ClipboardX}
          title="No matching tasks"
          description="Try adjusting your search or filters."
        />
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
                    const canEdit =
                      permissions.canEditAllTasks ||
                      (permissions.canEditOwnTasks && task.name === userName)
                    const canDelete = permissions.canDeleteTasks

                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        onDelete={() => mutate()}
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
