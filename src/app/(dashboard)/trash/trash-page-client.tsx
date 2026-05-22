'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Pagination } from '@/components/shared/pagination'
import { Trash2, Archive, RotateCcw } from 'lucide-react'
import { TrashActions } from '@/components/shared/trash-actions'
import { formatDate } from '@/lib/utils'

interface TrashItem {
  id: string
  title: string
  type: 'goal' | 'task'
  deletedAt: string
  originalUrl: string
}

interface TrashResponse {
  items: TrashItem[]
  page: number
  totalPages: number
  totalItems: number
}

export function TrashPageClient() {
  const [data, setData] = useState<TrashResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'all' | 'goal' | 'task'>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/trash?type=${typeFilter}&page=${page}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [typeFilter, page])

  const tabs = [
    { value: 'all' as const, label: 'All' },
    { value: 'goal' as const, label: 'Goals' },
    { value: 'task' as const, label: 'Tasks' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-zinc-200 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setTypeFilter(tab.value); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              typeFilter === tab.value
                ? 'bg-zinc-100 text-zinc-900 border-b-2 border-zinc-900'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-4"><div className="h-5 w-3/4 animate-pulse rounded bg-zinc-100" /></CardContent></Card>
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState icon={Archive} title="Trash is empty" description="No deleted items to show." />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {data.items.map(item => (
              <Card key={`${item.type}-${item.id}`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Trash2 className="h-5 w-5 shrink-0 text-zinc-400" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">{item.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={item.type === 'goal' ? 'info' : 'default'}>{item.type === 'goal' ? 'Goal' : 'Task'}</Badge>
                        <span className="text-xs text-zinc-400">{formatDate(item.deletedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <TrashActions itemId={item.id} type={item.type} />
                </CardContent>
              </Card>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex justify-center pt-2">
              <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
