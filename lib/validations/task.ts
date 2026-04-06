import { z } from "zod"

export const taskFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string().min(1, "Date is required"),
  task: z.string().min(1, "Task description is required"),
  references: z.string().optional().default(""),
  comments: z.string().optional().default(""),
  progress: z.enum(["To-do", "In Progress", "Review", "Completed"]),
  taskStartingDate: z.string().optional().default(""),
  deadline: z.string().min(1, "Deadline is required"),
  taskEstimatedTime: z.string().optional().default(""),
  taskTimeTaken: z.string().optional().default(""),
  submissionLink: z.string().url().optional().or(z.literal("")),
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
