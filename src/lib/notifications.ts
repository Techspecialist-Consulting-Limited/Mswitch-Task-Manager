import { prisma } from './prisma'

type NotificationInput = {
  userId: string
  title: string
  message?: string
  type?: string
  link?: string | null
}

export async function createNotification(input: NotificationInput) {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message ?? '',
        type: input.type ?? 'INFO',
        link: input.link ?? null,
      },
    })
  } catch (err) {
    console.error('[NOTIFICATION] Failed to create:', err)
  }
}

export async function createNotificationForUsers(usersIds: string[], input: Omit<NotificationInput, 'userId'>) {
  try {
    await prisma.notification.createMany({
      data: usersIds.map(userId => ({
        userId,
        title: input.title,
        message: input.message ?? '',
        type: input.type ?? 'INFO',
        link: input.link ?? null,
      })),
    })
  } catch (err) {
    console.error('[NOTIFICATION] Failed to create for users:', err)
  }
}
