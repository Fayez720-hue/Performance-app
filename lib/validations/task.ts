import { z } from "zod"

export const taskFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  taskStartingDate: z.string().min(1, "Starting date is required"),
  task: z.string().min(1, "Task description is required"),
  deadline: z.string().min(1, "Deadline (Date & Time) is required"),
  progress: z.enum(["To-do", "In Progress", "Review", "Completed"]),
  taskEstimatedTime: z.string().min(1, "Estimated task time is required"),
  // Optional but available
  date: z.string().optional().default(""), // Internal date field
  references: z.string().optional().default(""),
  comments: z.string().optional().default(""),
  taskTimeTaken: z.string().optional().default(""),
  submissionLink: z.string().optional().default(""),
  submissionDate: z.string().optional().default(""),
  grading: z.string().optional().default(""),
  edits: z.string().optional().default(""),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>

export const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["Admin", "Manager", "Team Member", "Viewer"]),
})

export type UserFormValues = z.infer<typeof userSchema>
