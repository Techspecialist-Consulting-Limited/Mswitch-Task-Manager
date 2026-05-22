'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface InlineEditProps {
  value: string
  onSave: (newValue: string) => Promise<void>
  className?: string
  disabled?: boolean
}

export function InlineEdit({ value, onSave, className, disabled }: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  async function handleSave() {
    if (editValue.trim() && editValue.trim() !== value) {
      setSaving(true)
      try {
        await onSave(editValue.trim())
      } catch {
        setEditValue(value)
      }
      setSaving(false)
    } else {
      setEditValue(value)
    }
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSave()
    else if (e.key === 'Escape') {
      setEditValue(value)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={saving}
        className={className}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => !disabled && setEditing(true)}
      className={`text-left ${disabled ? 'cursor-default' : 'cursor-pointer hover:text-zinc-600'} ${className || ''}`}
    >
      {value}
    </button>
  )
}
