import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, CheckSquare, FileText, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { ChartsSection } from '@/components/dashboard/charts-section'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user
  const isAdmin = user.role === 'SUPER_ADMIN'
  const isLead = user.role === 'UNIT_LEAD'

  const whereGoals: Record<string, unknown> = { deletedAt: null }
  if (!isAdmin) whereGoals.userId = user.id
  const whereAllUnitGoals = isLead && user.unitId ? { unitId: user.unitId, deletedAt: null } : null
  const whereTasks: Record<string, unknown> = { deletedAt: null }
  if (isAdmin) {
    // admin sees all
  } else if (isLead && user.unitId) {
    whereTasks.assignedTo = { unitId: user.unitId }
  } else {
    whereTasks.assignedToId = user.id
  }
  const whereUpdates = isAdmin ? {} : { userId: user.id }

  const totalUnitGoals = whereAllUnitGoals ? prisma.monthlyGoal.count({ where: whereAllUnitGoals }) : Promise.resolve(0)
  const totalUnitActive = whereAllUnitGoals ? prisma.monthlyGoal.count({ where: { ...whereAllUnitGoals, status: 'ACTIVE' } }) : Promise.resolve(0)

  const [totalGoals, activeGoals, totalTasks, totalUpdates, unitGoalCount, unitActiveCount] = await Promise.all([
    prisma.monthlyGoal.count({ where: whereGoals }),
    prisma.monthlyGoal.count({ where: { ...whereGoals, status: 'ACTIVE' } }),
    (isAdmin ? prisma.task.count({ where: { deletedAt: null } }) : prisma.task.count({ where: whereTasks })),
    prisma.weeklyUpdate.count({ where: whereUpdates }),
    totalUnitGoals,
    totalUnitActive,
  ])

  const recentGoals = await prisma.monthlyGoal.findMany({
    where: { ...whereGoals, deletedAt: null },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const unitGoals = isLead && user.unitId ? await prisma.monthlyGoal.findMany({
    where: { unitId: user.unitId, userId: { not: user.id }, deletedAt: null },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  }) : []

  const recentTasks = await prisma.task.findMany({
    where: { ...whereTasks, deletedAt: null },
    include: { assignedTo: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const statsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stats`, {
    cache: 'no-store',
  }).catch(() => null)
  const stats = statsRes?.ok ? await statsRes.json() : null

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${user.name}`} description={user.role === 'SUPER_ADMIN' ? 'Admin Dashboard' : user.role === 'UNIT_LEAD' ? 'Unit Lead Dashboard' : 'Staff Dashboard'} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50"><Target className="h-6 w-6 text-blue-600" /></div>
          <div><p className="text-2xl font-bold text-zinc-900">{isLead ? unitGoalCount : totalGoals}</p><p className="text-xs text-zinc-500">{isLead ? 'Unit Goals' : 'Total Goals'}</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50"><TrendingUp className="h-6 w-6 text-emerald-600" /></div>
          <div><p className="text-2xl font-bold text-zinc-900">{isLead ? unitActiveCount : activeGoals}</p><p className="text-xs text-zinc-500">{isLead ? 'Unit Active' : 'Active Goals'}</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50"><CheckSquare className="h-6 w-6 text-amber-600" /></div>
          <div><p className="text-2xl font-bold text-zinc-900">{totalTasks}</p><p className="text-xs text-zinc-500">Tasks</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50"><FileText className="h-6 w-6 text-purple-600" /></div>
          <div><p className="text-2xl font-bold text-zinc-900">{totalUpdates}</p><p className="text-xs text-zinc-500">Updates</p></div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {isLead ? (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-zinc-400" />
                  <CardTitle>Your Goals</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {recentGoals.length === 0 ? (
                  <p className="text-sm text-zinc-400">No personal goals. <Link href="/goals" className="text-zinc-900 underline">Create one</Link></p>
                ) : recentGoals.map(g => (
                  <Link key={g.id} href={`/goals/${g.id}`} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 mb-2 last:mb-0 hover:bg-zinc-50 transition-colors">
                    <div><p className="text-sm font-medium text-zinc-900">{g.title}</p><p className="text-xs text-zinc-500">{g.month}</p></div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${g.status === 'ACTIVE' ? 'bg-blue-50 text-blue-700' : g.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>{g.status}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-zinc-400" />
                  <CardTitle>Unit Members&apos; Goals</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {unitGoals.length === 0 ? (
                  <p className="text-sm text-zinc-400">No goals from unit members yet.</p>
                ) : unitGoals.map(g => (
                  <Link key={g.id} href={`/goals/${g.id}`} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 mb-2 last:mb-0 hover:bg-zinc-50 transition-colors">
                    <div><p className="text-sm font-medium text-zinc-900">{g.title}</p><p className="text-xs text-zinc-500">{g.user.name} · {g.month}</p></div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${g.status === 'ACTIVE' ? 'bg-blue-50 text-blue-700' : g.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>{g.status}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader><CardTitle>Recent Goals</CardTitle></CardHeader>
            <CardContent>
              {recentGoals.length === 0 ? (
                <p className="text-sm text-zinc-400">No goals yet. <Link href="/goals" className="text-zinc-900 underline">Create one</Link></p>
              ) : recentGoals.map(g => (
                <Link key={g.id} href={`/goals/${g.id}`} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 mb-2 last:mb-0 hover:bg-zinc-50 transition-colors">
                  <div><p className="text-sm font-medium text-zinc-900">{g.title}</p><p className="text-xs text-zinc-500">{isAdmin ? `${g.user.name} · ` : ''}{g.month}</p></div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${g.status === 'ACTIVE' ? 'bg-blue-50 text-blue-700' : g.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>{g.status}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader><CardTitle>Recent Tasks</CardTitle></CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <p className="text-sm text-zinc-400">No tasks assigned yet.</p>
            ) : recentTasks.map(t => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 mb-2 last:mb-0 hover:bg-zinc-50 transition-colors">
                <div><p className="text-sm font-medium text-zinc-900">{t.title}</p><p className="text-xs text-zinc-500">{t.status === 'DONE' ? 'Done' : t.status === 'IN_PROGRESS' ? 'In Progress' : 'To Do'}</p></div>
                <span className="text-xs text-zinc-400">→ {t.assignedTo.name}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {stats && (
        <ChartsSection
          goalsByMonth={stats.goalsByMonth || []}
          tasksByStatus={stats.tasksByStatus || []}
          weeklyProgress={stats.weeklyProgress || []}
        />
      )}
    </div>
  )
}
