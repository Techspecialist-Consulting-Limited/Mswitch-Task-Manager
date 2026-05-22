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
import { Calendar, Pencil, ArrowLeft, User, Clock, Repeat } from 'lucide-react'
import { DeleteTaskButton } from './delete-button'
import { TaskStatusActions } from './status-actions'
import { formatDate } from '@/lib/utils'
import { canAssignTasks } from '@/lib/permissions'
import { CreateNextInstanceButton } from './create-next-instance'
import { CommentsSection } from '@/components/shared/comments-section'
import { FileAttachments } from '@/components/shared/file-attachments'
import { ActivityLogViewer } from '@/components/shared/activity-log-viewer'

const RECURRENCE_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
}

export default async function TaskDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await props.params
  const task = await prisma.task.findUnique({
    where: { id },
    include: { assignedTo: { select: { id: true, name: true, email: true } }, assignedBy: { select: { id: true, name: true } } },
  })
  if (!task) notFound()

  const { role, id: userId } = session.user
  if (role === 'STAFF' && task.assignedToId !== userId && task.assignedById !== userId) redirect('/tasks')

  const canEditDetails = role === 'SUPER_ADMIN' || canAssignTasks(role)
  const canUpdateStatus = canEditDetails || task.assignedToId === userId
  const canDelete = role === 'SUPER_ADMIN' || task.assignedById === userId
  const overdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'DONE'

  const STATUS_BADGE: Record<string, { variant: 'info' | 'success' | 'default'; label: string }> = {
    TODO: { variant: 'default', label: 'To Do' },
    IN_PROGRESS: { variant: 'info', label: 'In Progress' },
    DONE: { variant: 'success', label: 'Done' },
  }
  const sb = STATUS_BADGE[task.status] || { variant: 'default', label: task.status }

  return (
    <div>
      <PageHeader title={task.title} description={`Assigned by ${task.assignedBy.name}`}>
        <Link href="/tasks"><Button variant="secondary"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
        {canEditDetails && <Link href={`/tasks/${task.id}/edit`}><Button variant="secondary"><Pencil className="h-4 w-4" /> Edit</Button></Link>}
        {canDelete && <DeleteTaskButton taskId={task.id} />}
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent>
              {task.description ? <p className="text-sm text-zinc-600">{task.description}</p> : <p className="text-sm text-zinc-400 italic">No description provided.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent>
              <TaskStatusActions taskId={task.id} currentStatus={task.status} canUpdate={canUpdateStatus} recurrence={task.recurrence} deadline={task.deadline?.toISOString() || null} assignedToId={task.assignedToId} assignedById={task.assignedById} />
            </CardContent>
          </Card>

          <CommentsSection targetType="TASK" targetId={task.id} />

          <FileAttachments targetType="TASK" targetId={task.id} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-zinc-500">Status</span><Badge variant={sb.variant}>{sb.label}</Badge></div>
              <div className="flex items-center justify-between"><span className="text-zinc-500">Assigned to</span><div className="flex items-center gap-2"><Avatar name={task.assignedTo.name} size="sm" /><span>{task.assignedTo.name}</span></div></div>
              <div className="flex items-center justify-between"><span className="text-zinc-500">Created by</span><div className="flex items-center gap-2"><Avatar name={task.assignedBy.name} size="sm" /><span>{task.assignedBy.name}</span></div></div>
              {task.deadline && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Deadline</span>
                  <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
                    <Calendar className="h-3.5 w-3.5" /> {formatDate(task.deadline)}
                    {overdue && <span className="text-xs">(Overdue)</span>}
                  </span>
                </div>
              )}
              {task.recurrence && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Recurrence</span>
                  <span className="flex items-center gap-1">
                    <Repeat className="h-3.5 w-3.5 text-zinc-400" /> {RECURRENCE_LABELS[task.recurrence] || task.recurrence}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between"><span className="text-zinc-500">Created</span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-zinc-400" /> {formatDate(task.createdAt)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Activity Log</CardTitle></CardHeader>
            <CardContent>
              <ActivityLogViewer entityType="TASK" entityId={task.id} />
            </CardContent>
          </Card>

          {task.recurrence && task.status === 'DONE' && (
            <CreateNextInstanceButton taskId={task.id} recurrence={task.recurrence} deadline={task.deadline?.toISOString() || null} assignedToId={task.assignedToId} />
          )}
        </div>
      </div>
    </div>
  )
}
