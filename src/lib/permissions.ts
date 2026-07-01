export function isAdmin(role: string) { return role === 'SUPER_ADMIN' }
export function isUnitLead(role: string) { return role === 'UNIT_LEAD' }
export function isStaff(role: string) { return role === 'STAFF' }
export function canManageUsers(role: string) { return role === 'SUPER_ADMIN' }
export function canManageUnits(role: string) { return role === 'SUPER_ADMIN' }
export function canCreateGoals(role: string) { return true }
export function canAssignTasks(role: string) { return role === 'SUPER_ADMIN' || role === 'UNIT_LEAD' }
export function canViewAllTasks(role: string) { return role === 'SUPER_ADMIN' || role === 'UNIT_LEAD' }
export function canSubmitUpdates(role: string) { return role === 'SUPER_ADMIN' || role === 'UNIT_LEAD' || role === 'STAFF' }

/** Team-owned goals: SUPER_ADMIN can act on any unit; everyone else must belong to the goal's unit. */
export function isUnitMember(user: { role: string; unitId: string | null }, unitId: string) {
  return user.role === 'SUPER_ADMIN' || (user.unitId !== null && user.unitId === unitId)
}
