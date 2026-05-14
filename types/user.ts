export type UserRole = "Admin" | "Manager" | "Team Member" | "Viewer"

export interface User {
  email: string
  name: string
  role: UserRole
  image?: string
  pushToken?: string
  title?: string
}

export interface Notification {
  id: string
  userEmail: string
  type: NotificationType
  taskId: number
  message: string
  read: boolean
  timestamp: string
}

export type NotificationType =
  | "task_assigned"
  | "progress_updated"
  | "submitted_for_review"
  | "revisions_requested"
  | "task_completed"

export const ROLE_PERMISSIONS: Record<UserRole, {
  // Task permissions
  canCreateTasks: boolean
  canEditAllTasks: boolean
  canEditOwnTasks: boolean
  canDeleteTasks: boolean
  canManageUsers: boolean
  canViewAllTasks: boolean
  canReview: boolean
  // Project permissions
  canCreateProjects: boolean
  canEditProjects: boolean
  canDeleteProjects: boolean
  canViewAllProjects: boolean
  // Calendar permissions
  canViewCalendar: boolean
}> = {
  Admin: {
    // Task permissions
    canCreateTasks: true,
    canEditAllTasks: true,
    canEditOwnTasks: true,
    canDeleteTasks: true,
    canManageUsers: true,
    canViewAllTasks: true,
    canReview: true,
    // Project permissions
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
    canViewAllProjects: true,
    // Calendar permissions
    canViewCalendar: true,
  },
  Manager: {
    // Task permissions
    canCreateTasks: true,
    canEditAllTasks: true,
    canEditOwnTasks: true,
    canDeleteTasks: true,
    canManageUsers: false,
    canViewAllTasks: true,
    canReview: true,
    // Project permissions - Manager can create/edit/delete projects
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,  
    canViewAllProjects: true,
    // Calendar permissions
    canViewCalendar: true,
  },
  "Team Member": {
    // Task permissions
    canCreateTasks: false,
    canEditAllTasks: false,
    canEditOwnTasks: true,
    canDeleteTasks: false,
    canManageUsers: false,
    canViewAllTasks: false,
    canReview: false,
    // Project permissions
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: false,
    // Calendar permissions
    canViewCalendar: false,
  },
  Viewer: {
    // Task permissions
    canCreateTasks: false,
    canEditAllTasks: false,
    canEditOwnTasks: false,
    canDeleteTasks: false,
    canManageUsers: false,
    canViewAllTasks: true,
    canReview: false,
    // Project permissions - Viewers can only view projects
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: true,
    // Calendar permissions
    canViewCalendar: false,
  },
}