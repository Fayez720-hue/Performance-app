export type TaskProgress = "To-do" | "In Progress" | "Review" | "Completed"

export interface Task {
  id: number // Row number in Google Sheets
  name: string
  date: string
  task: string
  references: string
  comments: string
  progress: TaskProgress
  taskStartingDate: string
  deadline: string
  taskEstimatedTime: string
  taskTimeTaken: string
  submissionLink: string
  submissionDate: string
  deadlineAdherence: string
  grading: string
  overallScore: string
  taskTimeStamp: string
  edits: string
  noOfEdits: number
  performanceHistory?: string
}

export interface TaskFormData {
  name: string
  date: string
  task: string
  references: string
  comments: string
  progress: TaskProgress
  taskStartingDate: string
  deadline: string
  taskEstimatedTime: string
  taskTimeTaken: string
  submissionLink?: string
  submissionDate: string
  grading: string
  edits: string
}

export const PROGRESS_OPTIONS: TaskProgress[] = [
  "To-do",
  "In Progress",
  "Review",
  "Completed",
]

export const PROGRESS_COLORS: Record<TaskProgress, string> = {
  "To-do": "bg-zinc-500",
  "In Progress": "bg-amber-500",
  "Review": "bg-blue-500",
  "Completed": "bg-emerald-500",
}
