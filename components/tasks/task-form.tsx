"use client"

import { useEffect, useState } from "react"
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
import { getApiUrl } from "@/lib/api"
import { MediaUpload } from "./media-upload"
import { MediaRenderer } from "./media-renderer"

interface TaskFormProps {
  task?: Task
  mode: "create" | "edit"
  userRole?: string
  userName?: string
  employees?: any[] // Changed from string[] to any[] to handle user objects
}

// Helper to convert sheet dates to datetime-local format (YYYY-MM-DDTHH:mm)
function formatToDatetimeLocal(dateStr: string | undefined): string {
  if (!dateStr) return format(new Date(), "yyyy-MM-dd'T'HH:mm")

  try {
    // Try parsing as ISO
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return format(date, "yyyy-MM-dd'T'HH:mm")
    }
  } catch (e) {}

  // Try parsing DD/MM/YYYY HH:mm
  const ddmmyyyyMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2})?:?(\d{1,2})?/)
  if (ddmmyyyyMatch) {
    const [_, d, m, y, h = "00", min = "00"] = ddmmyyyyMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${h.padStart(2, '0')}:${min.padStart(2, '0')}`
  }

  return dateStr // Fallback to raw string if it already matches or fails
}

export function TaskForm({ task, mode, userRole, userName, employees }: TaskFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canEditAllFields = userRole === "Admin" || userRole === "Manager"
  const isTeamMember = userRole === "Team Member"
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string>(task?.projectId?.toString() || "none")

  useEffect(() => {
    fetch("/api/projects")
      .then(res => res.json())
      .then(data => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]))
  }, [])
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: task?.name || userName || "",
      date: task?.date || format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      task: task?.task || "",
      references: task?.references || "",
      comments: task?.comments || "",
      progress: (task?.progress as any) || "To-do",
      taskStartingDate: formatToDatetimeLocal(task?.taskStartingDate),
      deadline: formatToDatetimeLocal(task?.deadline),
      taskEstimatedTime: task?.taskEstimatedTime || "01:00",
      taskTimeTaken: task?.taskTimeTaken || "",
      submissionLink: task?.submissionLink || "",
      submissionDate: task?.submissionDate || "",
      grading: task?.grading || "",
      edits: task?.edits || "",
    },
  })

  // Watch submission link for automatic progress update
  const submissionLink = form.watch("submissionLink")
  const [lastLink, setLastLink] = useState(task?.submissionLink || "")

  useEffect(() => {
    // Only auto-switch to "Review" if the link has actually CHANGED and is a Google link
    if (submissionLink && submissionLink !== lastLink) {
      const isGoogleDriveLink =
        submissionLink.includes("drive.google.com") ||
        submissionLink.includes("docs.google.com") ||
        submissionLink.includes("sheets.google.com") ||
        submissionLink.includes("slides.google.com")

      if (isGoogleDriveLink) {
        form.setValue("progress", "Review")
      }
      setLastLink(submissionLink)
    }
  }, [submissionLink, lastLink, form])

  // Filter progress options for Team Members
  const availableProgressOptions = isTeamMember
    ? PROGRESS_OPTIONS.filter(opt => opt !== "Completed" && opt !== "To-do")
    : PROGRESS_OPTIONS

  async function onSubmit(values: TaskFormValues) {
    setIsSubmitting(true)
    try {
      const url = mode === "create" ? getApiUrl("/api/tasks") : getApiUrl(`/api/tasks/${task?.id}`)
      const method = mode === "create" ? "POST" : "PUT"

      // Include change detection for notifications
      const payload = {
        ...values,
        projectId: selectedProject === "none" ? null : selectedProject,
        // Send as local ISO string (preserve the exact local time the user picked)
        deadline: values.deadline ? new Date(values.deadline).toISOString() : values.deadline,
        taskStartingDate: values.taskStartingDate ? new Date(values.taskStartingDate + ":00.000Z").toISOString().replace("Z", "") : values.taskStartingDate,
        previousProgress: task?.progress,
        updatedBy: userName,
        userRole: userRole
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      let responseData;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || "Failed to save task")
      }

      toast.success(mode === "create" ? "Task created successfully" : "Task updated successfully")
      router.push("/tasks")
      router.refresh()
    } catch (error) {
      console.error("Task Save Error:", error)
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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
                  disabled={!canEditAllFields}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees && employees.length > 0 ? (
                      employees.map((emp) => {
                        const name = typeof emp === 'string' ? emp : emp.name;
                        const value = typeof emp === 'string' ? emp : emp.name;

                        return (
                          <SelectItem key={name} value={value}>
                            {name}
                          </SelectItem>
                        );
                      })
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
        {/* Project Selection */}
        {canEditAllFields && (
          <div className="grid gap-6 md:grid-cols-2">
            <FormItem>
              <FormLabel>Project</FormLabel>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="No project (standalone task)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No project (standalone)</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
            <div />
          </div>
        )}
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
                  className="min-h-[100px] resize-none disabled:bg-muted"
                  {...field}
                  disabled={!canEditAllFields}
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
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add any references or links..."
                    className="min-h-[80px] resize-none disabled:bg-muted"
                    {...field}
                    disabled={!canEditAllFields}
                  />
                  {canEditAllFields && (
                    <MediaUpload
                      onUpload={(attachment) => field.onChange(`${field.value}${field.value ? '\n' : ''}${attachment}`)}
                    />
                  )}
                  <div className="mt-2">
                    <MediaRenderer text={field.value} />
                  </div>
                </div>
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
                    {availableProgressOptions.map((option) => (
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
                    disabled={!canEditAllFields}
                    className="w-full text-left font-normal disabled:bg-muted"
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
                    disabled={!canEditAllFields}
                    className="w-full text-left font-normal disabled:bg-muted"
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
              const value = typeof field.value === "string" ? field.value : "00:00"
              const [h, m] = value.includes(":") ? value.split(":") : ["00", "00"]
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
                          disabled={!canEditAllFields}
                          onChange={(e) => updateDuration(parseInt(e.target.value) || 0, minutes)}
                          className="w-20 text-center disabled:bg-muted"
                        />
                        <span className="text-sm text-muted-foreground font-medium">hrs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={minutes}
                          disabled={!canEditAllFields}
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 0
                            if (val > 59) val = 59
                            updateDuration(hours, val)
                          }}
                          className="w-20 text-center disabled:bg-muted"
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
          {/* Submission Link - Editable for Team Members too */}
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
        </div>

        <div className="grid gap-6 md:grid-cols-2">
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
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add any comments..."
                    className="min-h-[80px] resize-none disabled:bg-muted"
                    {...field}
                    disabled={!canEditAllFields}
                  />
                  {canEditAllFields && (
                    <MediaUpload
                      onUpload={(attachment) => field.onChange(`${field.value}${field.value ? '\n' : ''}${attachment}`)}
                    />
                  )}
                  <div className="mt-2">
                    <MediaRenderer text={field.value} />
                  </div>
                </div>
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
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add revision feedback..."
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                    <MediaUpload
                      onUpload={(attachment) => field.onChange(`${field.value}${field.value ? '\n' : ''}${attachment}`)}
                    />
                    <div className="mt-2">
                      <MediaRenderer text={field.value} />
                    </div>
                  </div>
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
                  task.deadlineAdherence === "100%" ? "text-emerald-500" :
                  task.deadlineAdherence === "0%" ? "text-red-500" : "text-muted-foreground"
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
  )
}
