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
    const weeklyGoalId = searchParams.get('weeklyGoalId')
    if (!weeklyGoalId) return NextResponse.json({ error: 'weeklyGoalId is required' }, { status: 400 })

    const wg = await prisma.weeklyGoal.findUnique({
      where: { id: weeklyGoalId },
      include: { monthlyGoal: { select: { userId: true, unitId: true } } },
    })
    if (!wg) return NextResponse.json({ error: 'Weekly goal not found' }, { status: 404 })

    const { role, id: userId, unitId } = session.user
    const canView = role === 'SUPER_ADMIN' || wg.monthlyGoal.userId === userId || (role === 'UNIT_LEAD' && wg.monthlyGoal.unitId === unitId)
    if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const updates = await prisma.weeklyUpdate.findMany({
      where: { weeklyGoalId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(updates)
  } catch (err) {
    console.error('WeeklyUpdates GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { weeklyGoalId, updateText, progressPercentage, blockers } = await request.json()
    if (!weeklyGoalId || !updateText) {
      return NextResponse.json({ error: 'weeklyGoalId and updateText are required' }, { status: 400 })
    }

    const wg = await prisma.weeklyGoal.findUnique({
      where: { id: weeklyGoalId },
      include: { monthlyGoal: { select: { userId: true, unitId: true } } },
    })
    if (!wg) return NextResponse.json({ error: 'Weekly goal not found' }, { status: 404 })

    const { role, id: userId, unitId } = session.user
    const canSubmit = role === 'SUPER_ADMIN' || wg.monthlyGoal.userId === userId || (role === 'UNIT_LEAD' && wg.monthlyGoal.unitId === unitId) || role === 'STAFF'
    if (!canSubmit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const update = await prisma.weeklyUpdate.create({
      data: {
        updateText,
        progressPercentage: Math.min(100, Math.max(0, progressPercentage ?? 0)),
        blockers: blockers || null,
        weeklyGoalId,
        userId: session.user.id,
      },
      include: { user: { select: { id: true, name: true } } },
    })

    // Notify the goal owner if different from submitter
    if (wg.monthlyGoal.userId !== session.user.id) {
      createNotification({
        userId: wg.monthlyGoal.userId,
        title: 'Weekly update submitted',
        message: `${session.user.name} submitted an update on "${wg.title}" (${progressPercentage ?? 0}% complete)`,
        type: 'INFO',
        link: `/goals/${wg.monthlyGoalId}`,
      })
    }

    return NextResponse.json(update)
  } catch (err) {
    console.error('WeeklyUpdates POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
