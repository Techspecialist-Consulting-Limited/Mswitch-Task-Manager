export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  UNIT_LEAD: 'UNIT_LEAD',
  STAFF: 'STAFF',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin / Engineer',
  UNIT_LEAD: 'Unit Lead',
  STAFF: 'Staff',
}

export const GOAL_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED'] as const
export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const
