import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  FileText,
  ListChecks,
  MessageSquareWarning,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { ChartsSection } from '@/components/dashboard/charts-section'
import { getDashboardStats } from '@/lib/stats'
import { formatDate } from '@/lib/utils'

const MONTH_LABELS: Record<string, string> = {
  '01': 'January',
  '02': 'February',
  '03': 'March',
  '04': 'April',
  '05': 'May',
  '06': 'June',
  '07': 'July',
  '08': 'August',
  '09': 'September',
  '10': 'October',
  '11': 'November',
  '12': 'December',
}

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatMonth(month: string) {
  const [year, value] = month.split('-')
  return `${MONTH_LABELS[value] || value} ${year}`
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length)
}

function getReportState(progress: number, blockerCount: number, missingUpdateCount: number) {
  if (blockerCount > 0 || missingUpdateCount > 1) return { label: 'At Risk', variant: 'warning' as const }
  if (progress >= 80) return { label: 'Strong Progress', variant: 'success' as const }
  if (progress > 0) return { label: 'In Progress', variant: 'info' as const }
  return { label: 'Needs Update', variant: 'default' as const }
}

function getRoleDescription(role: string) {
  if (role === 'SUPER_ADMIN') return 'Organization goal reporting dashboard'
  return "Your team's monthly goals, weekly updates, and progress report"
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user
  const isAdmin = user.role === 'SUPER_ADMIN'
  const isLead = user.role === 'UNIT_LEAD'
  const monthKey = currentMonthKey()
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const goalWhere: Record<string, unknown> = { deletedAt: null }
  if (!isAdmin) {
    goalWhere.unitId = user.unitId ?? '__none__'
  }

  const currentGoalWhere = { ...goalWhere, month: monthKey }

  const taskWhere: Record<string, unknown> = { deletedAt: null }
  if (isAdmin) {
    // Admin sees all assigned extra tasks.
  } else if (isLead && user.unitId) {
    taskWhere.assignedTo = { unitId: user.unitId }
  } else {
    taskWhere.assignedToId = user.id
  }

  const [
    totalGoals,
    currentMonthGoals,
    activeGoals,
    currentGoals,
    recentGoals,
    weeklyUpdatesThisWeek,
    extraTaskCount,
    overdueExtraTasks,
    recentExtraTasks,
    stats,
  ] = await Promise.all([
    prisma.monthlyGoal.count({ where: goalWhere }),
    prisma.monthlyGoal.count({ where: currentGoalWhere }),
    prisma.monthlyGoal.count({ where: { ...goalWhere, status: 'ACTIVE' } }),
    prisma.monthlyGoal.findMany({
      where: currentGoalWhere,
      include: {
        unit: { select: { name: true } },
        weeklyGoals: {
          include: {
            weeklyUpdates: {
              select: { progressPercentage: true, blockers: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { weekNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.monthlyGoal.findMany({
      where: goalWhere,
      include: { unit: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.weeklyUpdate.count({
      where: {
        createdAt: { gte: weekStart },
        weeklyGoal: { monthlyGoal: goalWhere },
      },
    }),
    prisma.task.count({ where: taskWhere }),
    prisma.task.count({
      where: {
        ...taskWhere,
        status: { not: 'DONE' },
        deadline: { lt: now },
      },
    }),
    prisma.task.findMany({
      where: taskWhere,
      include: { assignedTo: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    getDashboardStats(user),
  ])

  const goalsForReport = currentGoals.length > 0 ? currentGoals : []
  const goalReports = goalsForReport.map((goal) => {
    const updates = goal.weeklyGoals.flatMap((weeklyGoal) => weeklyGoal.weeklyUpdates)
    const progress = average(updates.map((update) => update.progressPercentage))
    const blockerCount = updates.filter((update) => Boolean(update.blockers?.trim())).length
    const weeksWithUpdates = goal.weeklyGoals.filter((weeklyGoal) => weeklyGoal.weeklyUpdates.length > 0).length
    const missingWeeklyPlans = Math.max(0, 4 - goal.weeklyGoals.length)
    const missingUpdates = Math.max(0, goal.weeklyGoals.length - weeksWithUpdates)
    const reportState = getReportState(progress, blockerCount, missingUpdates + missingWeeklyPlans)

    return {
      id: goal.id,
      title: goal.title,
      team: goal.unit.name,
      month: goal.month,
      status: goal.status,
      progress,
      blockerCount,
      weeklyPlans: goal.weeklyGoals.length,
      updateCount: updates.length,
      missingWeeklyPlans,
      missingUpdates,
      reportState,
    }
  })

  const totalBlockers = goalReports.reduce((total, goal) => total + goal.blockerCount, 0)
  const totalMissingPlans = goalReports.reduce((total, goal) => total + goal.missingWeeklyPlans, 0)
  const totalMissingUpdates = goalReports.reduce((total, goal) => total + goal.missingUpdates, 0)
  const averageGoalProgress = average(goalReports.map((goal) => goal.progress))
  const goalsAtRisk = goalReports.filter((goal) => goal.reportState.label === 'At Risk').length
  const attentionItems = [
    ...goalReports
      .filter((goal) => goal.blockerCount > 0)
      .map((goal) => ({
        label: `${goal.blockerCount} blocker${goal.blockerCount === 1 ? '' : 's'} reported`,
        detail: goal.title,
        href: `/goals/${goal.id}`,
        tone: 'warning',
      })),
    ...goalReports
      .filter((goal) => goal.missingWeeklyPlans > 0)
      .map((goal) => ({
        label: `${goal.missingWeeklyPlans} weekly plan${goal.missingWeeklyPlans === 1 ? '' : 's'} missing`,
        detail: goal.title,
        href: `/goals/${goal.id}`,
        tone: 'default',
      })),
    ...goalReports
      .filter((goal) => goal.missingUpdates > 0)
      .map((goal) => ({
        label: `${goal.missingUpdates} weekly update${goal.missingUpdates === 1 ? '' : 's'} missing`,
        detail: goal.title,
        href: `/goals/${goal.id}`,
        tone: 'danger',
      })),
  ].slice(0, 6)

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${user.name}`} description={getRoleDescription(user.role)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
              <Target className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{currentMonthGoals}</p>
              <p className="text-xs text-zinc-500">{formatMonth(monthKey)} goals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{averageGoalProgress}%</p>
              <p className="text-xs text-zinc-500">Average goal progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{weeklyUpdatesThisWeek}</p>
              <p className="text-xs text-zinc-500">Updates this week</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
              <MessageSquareWarning className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{totalBlockers}</p>
              <p className="text-xs text-zinc-500">Active blockers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{formatMonth(monthKey)} Goal Reports</CardTitle>
                <p className="mt-1 text-sm text-zinc-500">Monthly goals with weekly plan coverage, update count, progress, and blockers.</p>
              </div>
              <Badge variant={goalsAtRisk > 0 ? 'warning' : 'success'}>{goalsAtRisk} at risk</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {goalReports.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-10 text-center">
                <Target className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
                <p className="text-sm font-medium text-zinc-700">No goals for {formatMonth(monthKey)} yet.</p>
                <p className="mt-1 text-sm text-zinc-500">Create monthly goals first, then break them into four weekly plans.</p>
                <Link href="/goals/new" className="mt-4 inline-flex text-sm font-medium text-zinc-900 underline">Create a goal</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {goalReports.map((goal) => (
                  <Link key={goal.id} href={`/goals/${goal.id}`} className="block rounded-lg border border-zinc-100 p-4 transition-colors hover:bg-zinc-50">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-zinc-900">{goal.title}</p>
                          <Badge variant={goal.reportState.variant}>{goal.reportState.label}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">{isAdmin ? `${goal.team} - ` : ''}{formatMonth(goal.month)}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[240px]">
                        <div className="rounded-lg bg-indigo-50 px-2 py-2">
                          <p className="text-sm font-semibold text-indigo-700">{goal.weeklyPlans}/4</p>
                          <p className="text-[11px] text-zinc-500">Plans</p>
                        </div>
                        <div className="rounded-lg bg-zinc-50 px-2 py-2">
                          <p className="text-sm font-semibold text-zinc-900">{goal.updateCount}</p>
                          <p className="text-[11px] text-zinc-500">Updates</p>
                        </div>
                        <div className={`rounded-lg px-2 py-2 ${goal.blockerCount > 0 ? 'bg-red-50' : 'bg-zinc-50'}`}>
                          <p className={`text-sm font-semibold ${goal.blockerCount > 0 ? 'text-red-600' : 'text-zinc-900'}`}>{goal.blockerCount}</p>
                          <p className="text-[11px] text-zinc-500">Blockers</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Progress value={goal.progress} size="md" showLabel />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <CardTitle>Needs Attention</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {attentionItems.length === 0 ? (
                <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
                  No blockers or missing weekly reports detected for this month.
                </div>
              ) : (
                attentionItems.map((item, index) => (
                  <Link key={`${item.href}-${index}`} href={item.href} className="block rounded-lg border border-zinc-100 p-3 hover:bg-zinc-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{item.label}</p>
                        <p className="mt-1 text-xs text-zinc-500">{item.detail}</p>
                      </div>
                      <Badge variant={item.tone === 'danger' ? 'danger' : item.tone === 'warning' ? 'warning' : 'default'}>Review</Badge>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-zinc-400" />
                <CardTitle>Report Health</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
                <span className="text-zinc-500">All goals</span>
                <span className="font-semibold text-zinc-900">{totalGoals}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
                <span className="text-zinc-500">Active goals</span>
                <span className="font-semibold text-zinc-900">{activeGoals}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
                <span className="text-zinc-500">Missing weekly plans</span>
                <span className={`font-semibold ${totalMissingPlans > 0 ? 'text-amber-600' : 'text-zinc-900'}`}>{totalMissingPlans}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
                <span className="text-zinc-500">Missing weekly updates</span>
                <span className={`font-semibold ${totalMissingUpdates > 0 ? 'text-red-600' : 'text-zinc-900'}`}>{totalMissingUpdates}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-zinc-400" />
              <CardTitle>Recent Monthly Goals</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {recentGoals.length === 0 ? (
              <p className="text-sm text-zinc-400">No goals yet. <Link href="/goals" className="text-zinc-900 underline">Create one</Link></p>
            ) : (recentGoals as any[]).map((goal) => (
              <Link key={goal.id} href={`/goals/${goal.id}`} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 mb-2 last:mb-0 hover:bg-zinc-50 transition-colors">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">{goal.title}</p>
                  <p className="text-xs text-zinc-500">{isAdmin ? `${goal.unit.name} - ` : ''}{formatMonth(goal.month)}</p>
                </div>
                <Badge variant={goal.status === 'COMPLETED' ? 'success' : goal.status === 'ACTIVE' ? 'info' : 'default'}>{goal.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-zinc-400" />
                <CardTitle>Extra Assigned Tasks</CardTitle>
              </div>
              <Badge variant={overdueExtraTasks > 0 ? 'danger' : 'default'}>{overdueExtraTasks} overdue</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-xl font-semibold text-zinc-900">{extraTaskCount}</p>
                <p className="text-xs text-zinc-500">Assigned extra tasks</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-xl font-semibold text-zinc-900">{overdueExtraTasks}</p>
                <p className="text-xs text-zinc-500">Past deadline</p>
              </div>
            </div>
            {recentExtraTasks.length === 0 ? (
              <p className="text-sm text-zinc-400">No extra assigned tasks yet.</p>
            ) : (recentExtraTasks as any[]).map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 mb-2 last:mb-0 hover:bg-zinc-50 transition-colors">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">{task.title}</p>
                  <p className="text-xs text-zinc-500">{task.status === 'DONE' ? 'Completed' : task.status === 'IN_PROGRESS' ? 'In progress' : 'Not started'}{task.deadline ? ` - Due ${formatDate(task.deadline)}` : ''}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                  <UserCheck className="h-3.5 w-3.5" />
                  {task.assignedTo.name}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {stats && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-zinc-400" />
            <h2 className="text-base font-semibold text-zinc-900">Reporting Trends</h2>
          </div>
          <ChartsSection
            goalsByMonth={stats.goalsByMonth || []}
            tasksByStatus={stats.tasksByStatus || []}
            weeklyProgress={stats.weeklyProgress || []}
          />
        </div>
      )}
    </div>
  )
}
