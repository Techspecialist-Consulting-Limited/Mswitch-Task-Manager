export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get('targetType')
    const targetId = searchParams.get('targetId')

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'targetType and targetId are required' }, { status: 400 })
    }

    const comments = await prisma.comment.findMany({
      where: { targetType, targetId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(comments)
  } catch (err) {
    console.error('Comments GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { text, targetType, targetId } = await request.json()
    if (!text || !targetType || !targetId) {
      return NextResponse.json({ error: 'text, targetType, and targetId are required' }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        targetType,
        targetId,
        userId: session.user.id,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    // Notify relevant user if commenting on a goal or task that belongs to someone else
    if (targetType === 'GOAL') {
      const goal = await prisma.monthlyGoal.findUnique({ where: { id: targetId } })
      if (goal && goal.userId !== session.user.id) {
        createNotification({
          userId: goal.userId,
          title: 'New comment on your goal',
          message: `${session.user.name} commented: ${text.slice(0, 100)}`,
          type: 'INFO',
          link: `/goals/${targetId}`,
        })
      }
    } else if (targetType === 'TASK') {
      const task = await prisma.task.findUnique({ where: { id: targetId } })
      if (task && task.assignedToId !== session.user.id) {
        createNotification({
          userId: task.assignedToId,
          title: 'New comment on your task',
          message: `${session.user.name} commented: ${text.slice(0, 100)}`,
          type: 'INFO',
          link: `/dashboard`,
        })
      }
    }

    return NextResponse.json(comment)
  } catch (err) {
    console.error('Comments POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
