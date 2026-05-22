import { prisma } from './prisma'

export async function logActivity(
  action: string,
  entityType: string,
  entityId: string,
  userId: string,
  userName: string,
  metadata?: Record<string, unknown>
) {
  await prisma.activityLog.create({
    data: {
      action,
      entityType,
      entityId,
      userId,
      userName,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  })
}
