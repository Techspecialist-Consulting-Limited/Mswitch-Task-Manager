'use client'

import { useState, useEffect, useCallback } from 'react'
import { History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/shared/pagination'
import { EmptyState } from '@/components/shared/empty-state'
import { formatDate } from '@/lib/utils'

interface ActivityLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  userName: string
  metadata: string | null
  createdAt: string
}

interface ActivityLogViewerProps {
  entityType?: string
  entityId?: string
}

const actionBadgeVariant: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  CREATED: 'success',
  UPDATED: 'info',
  DELETED: 'danger',
  COMPLETED: 'success',
  ARCHIVED: 'warning',
}

export function ActivityLogViewer({ entityType, entityId }: ActivityLogViewerProps) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (entityType) params.set('entityType', entityType)
      if (entityId) params.set('entityId', entityId)

      const res = await fetch(`/api/activity-logs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch logs')
      const data = await res.json()
      setLogs(data.logs)
      setTotalPages(data.totalPages)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [page, entityType, entityId])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  if (loading) {
    return <div className="py-8 text-center text-sm text-zinc-400">Loading activity log...</div>
  }

  if (logs.length === 0) {
    return <EmptyState icon={History} title="No activity recorded" description="Changes will appear here" />
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-white p-3">
            <Badge variant={actionBadgeVariant[log.action] || 'default'}>{log.action}</Badge>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-700">
                <span className="font-medium text-zinc-900">{log.userName}</span>
                {' '}{log.action.toLowerCase().replace(/_/g, ' ')}{' '}
                <span className="text-zinc-500">{log.entityType.toLowerCase()}</span>
              </p>
            </div>
            <span className="shrink-0 text-xs text-zinc-400">{formatDate(log.createdAt)}</span>
          </div>
        ))}
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
