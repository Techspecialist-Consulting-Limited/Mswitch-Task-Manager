'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

interface BulkAction {
  value: string
  label: string
}

interface BulkActionsProps {
  selectedIds: string[]
  onAction: (action: string, ids: string[]) => void
  actions: BulkAction[]
  onClear: () => void
}

export function BulkActions({ selectedIds, onAction, actions, onClear }: BulkActionsProps) {
  const [confirmAction, setConfirmAction] = useState<string | null>(null)

  if (selectedIds.length === 0) return null

  function handleAction(action: string) {
    if (action === 'delete') {
      setConfirmAction(action)
    } else {
      onAction(action, selectedIds)
    }
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-lg">
        <span className="text-sm font-medium text-zinc-700">{selectedIds.length} selected</span>
        {actions.map(action => (
          <button
            key={action.value}
            onClick={() => handleAction(action.value)}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {action.label}
          </button>
        ))}
        <button
          onClick={onClear}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          Clear
        </button>
      </div>

      <Modal
        open={confirmAction === 'delete'}
        onClose={() => setConfirmAction(null)}
        title="Confirm Delete"
        description={`Are you sure you want to delete ${selectedIds.length} item(s)? This cannot be undone.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { onAction('delete', selectedIds); setConfirmAction(null) }}>Delete</Button>
        </div>
      </Modal>
    </>
  )
}
