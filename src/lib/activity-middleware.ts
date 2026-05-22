import { logActivity } from '@/lib/activity-log'

export async function logActivityForMutation(
  action: string,
  entityType: string,
  entityId: string,
  session: any,
  metadata?: Record<string, unknown>
) {
  await logActivity(
    action,
    entityType,
    entityId,
    session.user.id,
    session.user.name,
    metadata
  )
}
