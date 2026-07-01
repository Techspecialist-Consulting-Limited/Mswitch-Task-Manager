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
import { AlertTriangle, Calendar, CheckCircle2, ClipboardList, FileText, Pencil, ArrowLeft, Building2, History } from 'lucide-react'
import { DeleteGoalButton } from './delete-button'
import { WeeklyGoalsSection } from './weekly-goals'
import { ActivityLogViewer } from '@/components/shared/activity-log-viewer'
import { isUnitMember } from '@/lib/permissions'

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
      unit: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      weeklyGoals: {
        include: {
          _count: { select: { weeklyUpdates: true } },
          weeklyUpdates: {
            select: { progressPercentage: true, blockers: true, createdAt: true, user: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { weekNumber: 'asc' },
      },
    },
  })

  if (!goal) notFound()

  if (!isUnitMember(session.user, goal.unitId)) redirect('/goals')

  const canEdit = isUnitMember(session.user, goal.unitId)
  const sb = STATUS_BADGE[goal.status] || { variant: 'default', label: goal.status }

  const allUpdates = goal.weeklyGoals.flatMap((wg) => wg.weeklyUpdates)
  const contributors = Array.from(new Map(allUpdates.map((u) => [u.user.id, u.user])).values())
  const allPercentages = allUpdates.map((u) => u.progressPercentage)
  const averageProgress = allPercentages.length > 0
    ? Math.round(allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length)
    : 0
  const totalUpdates = allUpdates.length
  const weeklyPlansCreated = goal.weeklyGoals.length
  const missingWeeklyPlans = Math.max(0, 4 - weeklyPlansCreated)
  const weeklyGoalsWithoutUpdates = goal.weeklyGoals.filter((wg) => wg.weeklyUpdates.length === 0).length
  const blockerCount = allUpdates.filter((u) => Boolean(u.blockers?.trim())).length
  const reportState = blockerCount > 0 || missingWeeklyPlans > 0 || weeklyGoalsWithoutUpdates > 1
    ? { label: 'Needs Attention', variant: 'warning' as const }
    : averageProgress >= 80
      ? { label: 'Strong Progress', variant: 'success' as const }
      : averageProgress > 0
        ? { label: 'In Progress', variant: 'info' as const }
        : { label: 'Awaiting Updates', variant: 'default' as const }

  return (
    <div className="space-y-6">
      <PageHeader title={goal.title} description={`${goal.unit.name} · ${contributors.length} contributor${contributors.length === 1 ? '' : 's'}`}>
        <Link href="/goals"><Button variant="secondary"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
        {canEdit && <Link href={`/goals/${goal.id}/edit`}><Button variant="secondary"><Pencil className="h-4 w-4" /> Edit</Button></Link>}
        {canEdit && <DeleteGoalButton goalId={goal.id} />}
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-900">{weeklyPlansCreated}/4</p>
              <p className="text-xs text-zinc-500">Weekly plans created</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-900">{averageProgress}%</p>
              <p className="text-xs text-zinc-500">Average reported progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-900">{totalUpdates}</p>
              <p className="text-xs text-zinc-500">Weekly updates submitted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-900">{blockerCount}</p>
              <p className="text-xs text-zinc-500">Blocker reports</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Team Goal Report</CardTitle>
                <Badge variant={reportState.variant}>{reportState.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {goal.description ? <p className="text-sm leading-6 text-zinc-600">{goal.description}</p> : <p className="text-sm text-zinc-400 italic">No description provided.</p>}
              <div className="rounded-xl bg-indigo-50/50 p-4 border border-indigo-100">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700">Overall progress from weekly updates</span>
                  <span className="text-sm font-semibold text-zinc-900">{averageProgress}%</span>
                </div>
                <Progress value={averageProgress} size="md" />
              </div>
              {(missingWeeklyPlans > 0 || weeklyGoalsWithoutUpdates > 0 || blockerCount > 0) && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                    <p className="text-lg font-semibold text-amber-700">{missingWeeklyPlans}</p>
                    <p className="text-xs text-zinc-500">Missing weekly plans</p>
                  </div>
                  <div className="rounded-lg bg-zinc-50 border border-zinc-100 p-3">
                    <p className="text-lg font-semibold text-zinc-900">{weeklyGoalsWithoutUpdates}</p>
                    <p className="text-xs text-zinc-500">Weeks without update</p>
                  </div>
                  <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                    <p className="text-lg font-semibold text-red-600">{blockerCount}</p>
                    <p className="text-xs text-zinc-500">Blockers to resolve</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <WeeklyGoalsSection
            goalId={goal.id}
            initial={goal.weeklyGoals.map((wg) => ({
              id: wg.id,
              weekNumber: wg.weekNumber,
              title: wg.title,
              description: wg.description,
              status: wg.status,
              updateCount: wg.weeklyUpdates.length,
              latestProgress: wg.weeklyUpdates[0]?.progressPercentage ?? 0,
              blockerCount: wg.weeklyUpdates.filter((u) => Boolean(u.blockers?.trim())).length,
            }))}
            canEdit={canEdit}
          />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-zinc-400" />
                <CardTitle>Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ActivityLogViewer entityType="GOAL" entityId={goal.id} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-zinc-500">Status</span><Badge variant={sb.variant}>{sb.label}</Badge></div>
              <div className="flex items-center justify-between"><span className="text-zinc-500">Month</span><span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-zinc-400" /> {formatMonth(goal.month)}</span></div>
              <div className="flex items-center justify-between"><span className="text-zinc-500">Team</span><span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-zinc-400" /> {goal.unit.name}</span></div>
              <div className="flex items-center justify-between"><span className="text-zinc-500">Started by</span><div className="flex items-center gap-2"><Avatar name={goal.createdBy.name} size="sm" /><span>{goal.createdBy.name}</span></div></div>
              <div className="flex items-center justify-between"><span className="text-zinc-500">Weekly Goals</span><span>{goal.weeklyGoals.length}</span></div>
              <div className="flex flex-col gap-1"><span className="text-zinc-500">Progress</span><Progress value={averageProgress} size="md" showLabel /></div>
            </CardContent>
          </Card>

          {contributors.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Contributors</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {contributors.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <Avatar name={c.name} size="sm" />
                    <span className="text-sm text-zinc-700">{c.name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
