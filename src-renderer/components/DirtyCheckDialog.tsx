import { useEffect, useRef } from 'react'

interface DirtyCheckDialogProps {
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
}

export function DirtyCheckDialog({ onSave, onDiscard, onCancel }: DirtyCheckDialogProps) {
  const saveRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    saveRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold">Unsaved Changes</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          You have unsaved changes. Would you like to save before closing?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onDiscard}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            Discard
          </button>
          <button
            ref={saveRef}
            onClick={onSave}
            className="rounded-md bg-[hsl(245,80%,65%)] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[hsl(245,80%,55%)]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
