"use client"

import { useState } from "react"
import Link from "next/link"
import { format, isPast, isToday } from "date-fns"
import {
  Calendar,
  Clock,
  Edit2,
  ExternalLink,
  MessageSquare,
  MoreHorizontal,
  Trash2,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { Task, TaskProgress } from "@/types/task"

const progressConfig: Record<TaskProgress, { color: string; bgColor: string }> = {
  "To-do": { color: "text-zinc-400", bgColor: "bg-zinc-500/10" },
  "In Progress": { color: "text-amber-400", bgColor: "bg-amber-500/10" },
  "Review": { color: "text-blue-400", bgColor: "bg-blue-500/10" },
  "Completed": { color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
}

function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime())
}

function safeFormat(dateStr: string | undefined, formatStr: string) {
  if (!dateStr) return "N/A"
  const date = new Date(dateStr)
  if (!isValidDate(date)) return dateStr // Return original string if not a valid date
  return format(date, formatStr)
}

interface TaskCardProps {
  task: Task
  canEdit: boolean
  canDelete: boolean
  onDelete?: () => void
}

export function TaskCard({ task, canEdit, canDelete, onDelete }: TaskCardProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const config = progressConfig[task.progress]
  
  const deadlineDate = task.deadline ? new Date(task.deadline) : null
  const isOverdue = deadlineDate && isValidDate(deadlineDate) && isPast(deadlineDate) && task.progress !== "Completed"
  const isDueToday = deadlineDate && isValidDate(deadlineDate) && isToday(deadlineDate)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete task")
      toast.success("Task deleted successfully")
      onDelete?.()
      router.refresh()
    } catch {
      toast.error("Failed to delete task")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card
        className={cn(
          "group cursor-pointer border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
          isOverdue && "border-red-500/30"
        )}
        onClick={() => setIsExpanded(true)}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-2 p-4 pb-2">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs font-medium", config.color, config.bgColor)}>
                {task.progress}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  Overdue
                </Badge>
              )}
              {isDueToday && !isOverdue && (
                <Badge className="bg-amber-500/10 text-xs text-amber-400">
                  Due Today
                </Badge>
              )}
            </div>
            <h3 className="line-clamp-2 text-sm font-medium text-card-foreground">
              {task.task}
            </h3>
          </div>

          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem asChild>
                    <Link href={`/tasks/${task.id}/edit`}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete()
                      }}
                      disabled={isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>

        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>{task.name}</span>
            </div>

            {task.deadline && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span className={cn(isOverdue && "text-red-400")}>
                  {safeFormat(task.deadline, "MMM d, yyyy")}
                </span>
              </div>
            )}

            {task.taskEstimatedTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{task.taskEstimatedTime}</span>
              </div>
            )}

            {task.edits && task.noOfEdits > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{task.noOfEdits} revision{task.noOfEdits !== 1 ? "s" : ""} requested</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expanded Task Dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-sm font-medium", config.color, config.bgColor)}>
                {task.progress}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive">Overdue</Badge>
              )}
            </div>
            <DialogTitle className="text-xl">{task.task}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Assigned to {task.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Dates Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {task.date && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="font-medium">{safeFormat(task.date, "PPP")}</p>
                </div>
              )}
              {task.deadline && (
                <div className={cn(
                  "rounded-lg border p-3",
                  isOverdue ? "border-red-500/30 bg-red-500/5" : "border-border bg-muted/30"
                )}>
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className={cn("font-medium", isOverdue && "text-red-400")}>
                    {safeFormat(task.deadline, "PPP")}
                  </p>
                </div>
              )}
              {task.taskStartingDate && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Started</p>
                  <p className="font-medium">{safeFormat(task.taskStartingDate, "PPP")}</p>
                </div>
              )}
              {task.submissionDate && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="font-medium">{safeFormat(task.submissionDate, "PPP")}</p>
                </div>
              )}
            </div>

            {/* Time Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              {task.taskEstimatedTime && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Estimated Time</p>
                  <p className="font-medium">{task.taskEstimatedTime}</p>
                </div>
              )}
              {task.taskTimeTaken && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Time Taken</p>
                  <p className="font-medium">{task.taskTimeTaken}</p>
                </div>
              )}
            </div>

            {/* References */}
            {task.references && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">References</h4>
                <p className="whitespace-pre-wrap text-sm">{task.references}</p>
              </div>
            )}

            {/* Comments */}
            {task.comments && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">Comments</h4>
                <p className="whitespace-pre-wrap text-sm">{task.comments}</p>
              </div>
            )}

            {/* Submission Link */}
            {task.submissionLink && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">Submission Link</h4>
                <a
                  href={task.submissionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {task.submissionLink}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            {/* Edits/Revisions */}
            {task.edits && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-400">
                  <MessageSquare className="h-4 w-4" />
                  Revision Feedback ({task.noOfEdits} revision{task.noOfEdits !== 1 ? "s" : ""})
                </h4>
                <p className="whitespace-pre-wrap text-sm">{task.edits}</p>
              </div>
            )}

            {/* Scoring */}
            {(task.grading || task.overallScore || task.deadlineAdherence) && (
              <div className="grid gap-4 sm:grid-cols-3">
                {task.deadlineAdherence && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Deadline Adherence</p>
                    <p className={cn(
                      "font-medium",
                      task.deadlineAdherence === "On Time" ? "text-emerald-400" :
                      task.deadlineAdherence === "Late" ? "text-red-400" : ""
                    )}>
                      {task.deadlineAdherence}
                    </p>
                  </div>
                )}
                {task.grading && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Grading</p>
                    <p className="font-medium">{task.grading}</p>
                  </div>
                )}
                {task.overallScore && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Overall Score</p>
                    <p className="font-medium">{task.overallScore}</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {canEdit && (
              <div className="flex gap-3 pt-2">
                <Link href={`/tasks/${task.id}/edit`} className="flex-1">
                  <Button className="w-full">
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Task
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
