'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteTemplateButtonProps {
  templateId: string
}

export function DeleteTemplateButton({ templateId }: DeleteTemplateButtonProps) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Delete this template?')) return
    const res = await fetch(`/api/goal-templates/${templateId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete'); return }
    toast.success('Template deleted')
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete}>
      <Trash2 className="h-4 w-4 text-zinc-400" />
    </Button>
  )
}
