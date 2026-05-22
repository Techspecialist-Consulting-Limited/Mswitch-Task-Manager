import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Calendar, Pencil, ArrowLeft } from 'lucide-react'
import { DeleteGoalButton } from './delete-button'
import { WeeklyGoalsSection } from './weekly-goals'

const MONTH_LABELS: Record<string, string> = {
  '01': 'January', '02': 'February', '03': 'March', '04': 'April',
  '05': 'May', '06': 'June', '07': 'July', '08': 'August',
  '09': 'September', '10': 'October', '11': 'November', '12': 'December',
}

function formatMonth(m: string): string {
  const [y, mo] = m.split('-')
  return `${MONTH_LABELS[mo] || mo} ${y}`
}

const STATUS_BADGE: Record<string, { variant: 'info' | 'success' | 'default'; label: string }> = {
  ACTIVE: { variant: 'info', label: 'Active' },
  COMPLETED: { variant: 'success', label: 'Completed' },
  CANCELLED: { variant: 'default', label: 'Cancelled' },
}

export default async function GoalDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await props.params
  const goal = await prisma.monthlyGoal.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      weeklyGoals: {
        include: {
          _count: { select: { weeklyUpdates: true } },
          weeklyUpdates: { select: { progressPercentage: true } },
        },
        orderBy: { weekNumber: 'asc' },
      },
    },
  })

  if (!goal) notFound()

  if (session.user.role === 'STAFF' && goal.userId !== session.user.id) redirect('/goals')

  const canEdit = session.user.role === 'SUPER_ADMIN' || goal.userId === session.user.id
  const sb = STATUS_BADGE[goal.status] || { variant: 'default', label: goal.status }

  const allPercentages = (goal.weeklyGoals as any[]).flatMap((wg: any) => wg.weeklyUpdates.map((u: any) => u.progressPercentage))
  const averageProgress = allPercentages.length > 0
    ? Math.round(allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length)
    : 0

  return (
    <div>
      <PageHeader title={goal.title} description={`Created by ${goal.user.name}`}>
        <Link href="/goals"><Button variant="secondary"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
        {canEdit && <Link href={`/goals/${goal.id}/edit`}><Button variant="secondary"><Pencil className="h-4 w-4" /> Edit</Button></Link>}
        {canEdit && <DeleteGoalButton goalId={goal.id} />}
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent>
              {goal.description ? <p className="text-sm text-zinc-600">{goal.description}</p> : <p className="text-sm text-zinc-400 italic">No description provided.</p>}
            </CardContent>
          </Card>

          <WeeklyGoalsSection goalId={goal.id} initial={(goal.weeklyGoals as any[]).map((wg: any) => ({ id: wg.id, weekNumber: wg.weekNumber, title: wg.title, description: wg.description, status: wg.status }))} canEdit={canEdit} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-zinc-500">Status</span><Badge variant={sb.variant}>{sb.label}</Badge></div>
              <div className="flex items-center justify-between"><span className="text-zinc-500">Month</span><span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-zinc-400" /> {formatMonth(goal.month)}</span></div>
              <div className="flex items-center justify-between"><span className="text-zinc-500">Owner</span><div className="flex items-center gap-2"><Avatar name={goal.user.name} size="sm" /><span>{goal.user.name}</span></div></div>
              <div className="flex items-center justify-between"><span className="text-zinc-500">Weekly Goals</span><span>{goal.weeklyGoals.length}</span></div>
              <div className="flex flex-col gap-1"><span className="text-zinc-500">Progress</span><Progress value={averageProgress} size="md" showLabel /></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
