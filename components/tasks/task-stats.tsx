"use client"

import { CheckCircle2, Circle, Clock, Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Task } from "@/types/task"

interface TaskStatsProps {
  tasks: Task[]
}

export function TaskStats({ tasks }: TaskStatsProps) {
  const stats = {
    todo: tasks.filter((t) => t.progress === "To-do").length,
    inProgress: tasks.filter((t) => t.progress === "In Progress").length,
    review: tasks.filter((t) => t.progress === "Review").length,
    completed: tasks.filter((t) => t.progress === "Completed").length,
  }

  const total = tasks.length
  const completionRate = total > 0 ? Math.round((stats.completed / total) * 100) : 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card className="border-border bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-500/10">
            <Circle className="h-5 w-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-card-foreground">{stats.todo}</p>
            <p className="text-sm text-muted-foreground">To-do</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-card-foreground">{stats.inProgress}</p>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Eye className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-card-foreground">{stats.review}</p>
            <p className="text-sm text-muted-foreground">Review</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-card-foreground">{stats.completed}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="relative h-10 w-10">
            <svg className="h-10 w-10 -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-muted"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${completionRate} 100`}
                strokeLinecap="round"
                className="text-primary"
              />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-semibold text-card-foreground">{completionRate}%</p>
            <p className="text-sm text-muted-foreground">Complete</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
