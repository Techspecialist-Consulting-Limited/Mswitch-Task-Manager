'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/confirm-modal'

interface DeleteTemplateButtonProps {
  templateId: string
}

export function DeleteTemplateButton({ templateId }: DeleteTemplateButtonProps) {
  const router = useRouter()
  const { confirm, dialog } = useConfirm()

  async function handleDelete() {
    const ok = await confirm({ title: 'Delete template', message: 'Delete this template?', confirmLabel: 'Delete', variant: 'danger' })
    if (!ok) return
    const res = await fetch(`/api/goal-templates/${templateId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete'); return }
    toast.success('Template deleted')
    router.refresh()
  }

  return (
    <>
      {dialog}
      <Button variant="ghost" size="sm" onClick={handleDelete}>
        <Trash2 className="h-4 w-4 text-zinc-400" />
      </Button>
    </>
  )
}
