import { pgTable, serial, text, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core"

// ============ ENUMS ============
export const userRoleEnum = pgEnum("user_role", ["Admin", "Manager", "Team Member", "Viewer"])
export const taskProgressEnum = pgEnum("task_progress", ["To-do", "In Progress", "Review", "Completed"])
export const notificationTypeEnum = pgEnum("notification_type", [
  "task_assigned",
  "progress_updated",
  "submitted_for_review",
  "revisions_requested",
  "task_completed",
])

// ============ EMPLOYEES / USERS TABLE ============
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("Team Member"),
  title: text("title"),
  password: text("password"),
  pushToken: text("push_token"),
  image: text("image"),
  // Stats columns from old Employees sheet
  tasks: integer("tasks").default(0),
  completed: integer("completed").default(0),
  overallScore: integer("overall_score").default(0),
  shiftAdherence: integer("shift_adherence").default(0),
  edits: integer("edits").default(0),
  performance: text("performance").default("Good"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// ============ TASKS TABLE ============
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: text("date").notNull(),
  task: text("task").notNull(),
  references: text("references").default(""),
  comments: text("comments").default(""),
  progress: taskProgressEnum("progress").notNull().default("To-do"),
  taskStartingDate: text("task_starting_date").default(""),
  deadline: text("deadline").default(""),
  taskEstimatedTime: text("task_estimated_time").default("00:00"),
  taskTimeTaken: text("task_time_taken").default(""),
  submissionLink: text("submission_link").default(""),
  submissionDate: text("submission_date").default(""),
  deadlineAdherence: text("deadline_adherence").default(""),
  grading: text("grading").default(""),
  overallScore: text("overall_score").default(""),
  taskTimeStamp: text("task_time_stamp").notNull(),
  edits: text("edits").default(""),
  noOfEdits: integer("no_of_edits").default(0),
  performanceHistory: text("performance_history").default(""),
  // Internal tracking
  originalTaskId: integer("original_task_id"), // Links revisions to original task
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
})

// ============ NOTIFICATIONS TABLE ============
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  type: notificationTypeEnum("type").notNull(),
  taskId: integer("task_id").default(0),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  timestamp: text("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

// ============ ATTENDANCE TABLE ============
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  date: text("date").notNull(),
  trackedTime: text("tracked_time").default("Working..."),
  shiftTime: text("shift_time").default(""),
  adherence: text("adherence").default(""),
  clockIn: text("clock_in").notNull(),
  clockOut: text("clock_out").default(""),
  createdAt: timestamp("created_at").defaultNow(),
})
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})