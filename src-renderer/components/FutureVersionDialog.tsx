import { useEffect, useRef } from 'react'

interface FutureVersionDialogProps {
  fileVersion: string
  onClose: () => void
}

export function FutureVersionDialog({ fileVersion, onClose }: FutureVersionDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div role="dialog" className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold">Incompatible Project Version</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          This project was saved by a newer version of ACMN Designer (format v{fileVersion}).
        </p>
        <p className="mb-6 text-sm font-medium">
          Please update the application to open this project.
        </p>
        <div className="flex justify-end">
          <button
            ref={closeRef}
            onClick={onClose}
            className="rounded-md bg-[hsl(245,80%,65%)] px-4 py-1.5 text-sm text-white transition-colors hover:bg-[hsl(245,80%,55%)]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
