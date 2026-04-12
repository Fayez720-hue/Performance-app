"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { taskFormSchema, type TaskFormValues } from "@/lib/validations/task"
import { PROGRESS_OPTIONS, type Task } from "@/types/task"

interface TaskFormProps {
  task?: Task
  mode: "create" | "edit"
  userRole?: string
  userName?: string
  employees?: string[]
}

export function TaskForm({ task, mode, userRole, userName, employees }: TaskFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canEditAllFields = userRole === "Admin" || userRole === "Manager"

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: task?.name || userName || "",
      date: task?.date || format(new Date(), "yyyy-MM-dd"),
      task: task?.task || "",
      references: task?.references || "",
      comments: task?.comments || "",
      progress: task?.progress || "To-do",
      taskStartingDate: task?.taskStartingDate || "",
      deadline: task?.deadline || "",
      taskEstimatedTime: task?.taskEstimatedTime || "00:00",
      taskTimeTaken: task?.taskTimeTaken || "",
      submissionLink: task?.submissionLink || "",
      submissionDate: task?.submissionDate || "",
      grading: task?.grading || "",
      edits: task?.edits || "",
    },
  })

  async function onSubmit(values: TaskFormValues) {
    setIsSubmitting(true)
    try {
      const url = mode === "create" ? "/api/tasks" : `/api/tasks/${task?.id}`
      const method = mode === "create" ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save task")
      }

      toast.success(mode === "create" ? "Task created successfully" : "Task updated successfully")
      router.push("/")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl text-card-foreground">
          {mode === "create" ? "Create New Task" : "Edit Task"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Assignee Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canEditAllFields && mode === "edit"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees && employees.length > 0 ? (
                          employees.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value={userName || "Default"}>{userName || "Default"}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date - READ ONLY */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled
                        className="bg-muted cursor-not-allowed"
                        placeholder={format(new Date(), "PPP")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Task Description */}
            <FormField
              control={form.control}
              name="task"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the task..."
                      className="min-h-[100px] resize-none"
                      {...field}
                      disabled={!canEditAllFields && mode === "edit"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* References */}
            <FormField
              control={form.control}
              name="references"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>References</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any references or links..."
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              {/* Progress Status */}
              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progress</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select progress" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROGRESS_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Task Starting Date & Time */}
              <FormField
                control={form.control}
                name="taskStartingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Starting Date & Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        className="w-full text-left font-normal"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Deadline & Time */}
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline & Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        className="w-full text-left font-normal"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estimated Time (Duration) */}
              <FormField
                control={form.control}
                name="taskEstimatedTime"
                render={({ field }) => {
                  // field.value is expected to be "HH:MM"
                  const value = field.value || "00:00"
                  const [h, m] = value.split(":")
                  const hours = parseInt(h) || 0
                  const minutes = parseInt(m) || 0

                  const updateDuration = (newH: number, newM: number) => {
                    const formatted = `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`
                    field.onChange(formatted)
                  }

                  return (
                    <FormItem>
                      <FormLabel>Estimated Duration</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={hours}
                              onChange={(e) => updateDuration(parseInt(e.target.value) || 0, minutes)}
                              className="w-20 text-center"
                            />
                            <span className="text-sm text-muted-foreground font-medium">hrs</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="59"
                              value={minutes}
                              onChange={(e) => {
                                let val = parseInt(e.target.value) || 0
                                if (val > 59) val = 59
                                updateDuration(hours, val)
                              }}
                              className="w-20 text-center"
                            />
                            <span className="text-sm text-muted-foreground font-medium">mins</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Time Taken - READ ONLY */}
              <FormField
                control={form.control}
                name="taskTimeTaken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Taken</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Auto-calculated"
                        {...field}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submission Link */}
              <FormField
                control={form.control}
                name="submissionLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Submission Link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Submission Date - READ ONLY */}
              <FormField
                control={form.control}
                name="submissionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Submission Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled
                        placeholder="Auto-set on submission"
                        className="bg-muted cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Grading - Editable only if submission link exists and user is Admin/Manager */}
              <FormField
                control={form.control}
                name="grading"
                render={({ field }) => {
                  const hasSubmission = !!form.watch("submissionLink")
                  const canGrade = canEditAllFields && hasSubmission

                  return (
                    <FormItem>
                      <FormLabel className={!canGrade ? "text-muted-foreground" : ""}>
                        Grading {!hasSubmission && "(Waiting for Submission)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={hasSubmission ? "Enter grade" : "No submission yet"}
                          {...field}
                          disabled={!canGrade}
                          className={!canGrade ? "bg-muted cursor-not-allowed" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>

            {/* Comments */}
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any comments..."
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Edits (for reviewers) */}
            {canEditAllFields && mode === "edit" && (
              <FormField
                control={form.control}
                name="edits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Edits Requested
                      {task?.noOfEdits ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({task.noOfEdits} revision{task.noOfEdits !== 1 ? "s" : ""})
                        </span>
                      ) : null}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add revision feedback..."
                        className="min-h-[80px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Read-only fields display - Only for Admin/Manager */}
            {canEditAllFields && mode === "edit" && task && (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <h4 className="mb-3 text-sm font-medium text-muted-foreground">Auto-calculated Fields</h4>
                <div className="grid gap-4 text-sm md:grid-cols-3">
                  <div>
                    <span className="text-muted-foreground">Deadline Adherence:</span>
                    <span className={cn(
                      "ml-2 font-medium",
                      task.deadlineAdherence === "On Time" ? "text-emerald-500" :
                      task.deadlineAdherence === "Late" ? "text-red-500" : "text-muted-foreground"
                    )}>
                      {task.deadlineAdherence || "Pending"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Overall Score:</span>
                    <span className="ml-2 font-medium">{task.overallScore || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">No. of Edits:</span>
                    <span className="ml-2 font-medium">{task.noOfEdits}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Create Task" : "Update Task"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
