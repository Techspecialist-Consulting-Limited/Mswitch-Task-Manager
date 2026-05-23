'use client'

import { useState, useCallback } from 'react'
import { Button } from './button'

interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmOptions & { resolve: (v: boolean) => void } | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, resolve })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    state?.resolve(true)
    setState(null)
  }, [state])

  const handleCancel = useCallback(() => {
    state?.resolve(false)
    setState(null)
  }, [state])

  const dialog = state ? (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={handleCancel} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-zinc-900">{state.title || 'Confirm'}</h2>
        <p className="mt-2 text-sm text-zinc-500">{state.message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={handleCancel}>
            {state.cancelLabel || 'Cancel'}
          </Button>
          <Button variant={state.variant || 'primary'} onClick={handleConfirm}>
            {state.confirmLabel || 'Confirm'}
          </Button>
        </div>
      </div>
    </>
  ) : null

  return { confirm, dialog }
}
