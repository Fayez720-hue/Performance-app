export type UserRole = "Admin" | "Manager" | "Team Member" | "Viewer"

export interface User {
  email: string;
  name: string;
  role: UserRole;
  title?: string;   
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
  canCreateTasks: boolean
  canEditAllTasks: boolean
  canEditOwnTasks: boolean
  canDeleteTasks: boolean
  canManageUsers: boolean
  canViewAllTasks: boolean
  canReview: boolean
}> = {
  Admin: {
    canCreateTasks: true,
    canEditAllTasks: true,
    canEditOwnTasks: true,
    canDeleteTasks: true,
    canManageUsers: true,
    canViewAllTasks: true,
    canReview: true,
  },
  Manager: {
    canCreateTasks: true,
    canEditAllTasks: true,
    canEditOwnTasks: true,
    canDeleteTasks: false,
    canManageUsers: false,
    canViewAllTasks: true,
    canReview: true,
  },
  "Team Member": {
    canCreateTasks: false,
    canEditAllTasks: false,
    canEditOwnTasks: true,
    canDeleteTasks: false,
    canManageUsers: false,
    canViewAllTasks: false,
    canReview: false,
  },
  Viewer: {
    canCreateTasks: false,
    canEditAllTasks: false,
    canEditOwnTasks: false,
    canDeleteTasks: false,
    canManageUsers: false,
    canViewAllTasks: true,
    canReview: false,
  },
}
