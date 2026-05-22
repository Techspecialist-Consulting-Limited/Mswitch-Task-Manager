'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, X } from 'lucide-react'

interface Template {
  id: string
  title: string
  description: string | null
  weekTitles: string | null
}

interface TemplatePickerProps {
  onSelect: (template: { title: string; description: string | null; weekTitles: string | null }) => void
}

export function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/goal-templates')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setTemplates(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  function handlePick(t: Template) {
    onSelect({ title: t.title, description: t.description, weekTitles: t.weekTitles })
    setOpen(false)
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <FileText className="h-4 w-4" /> Load from template
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900">Choose a Template</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-zinc-400">Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <FileText className="mb-2 h-6 w-6 text-zinc-300" />
                <p className="text-sm text-zinc-400">No templates available.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handlePick(t)}
                    className="w-full rounded-lg border border-zinc-200 p-4 text-left transition-colors hover:bg-zinc-50"
                  >
                    <p className="text-sm font-medium text-zinc-900">{t.title}</p>
                    {t.description && <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{t.description}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
