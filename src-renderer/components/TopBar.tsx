import { Undo2, Redo2 } from 'lucide-react'
import { useProjectStore } from '@/state/projectStore'
import { useCanvasStore } from '@/state/canvasStore'

interface TopBarProps {
  onClose: () => void
}

export function TopBar({ onClose }: TopBarProps) {
  const project = useProjectStore((s) => s.currentProject)
  const dirty = useProjectStore((s) => s.dirty)
  const activeCpmFile = useProjectStore((s) => s.activeCpmFile)
  const error = useProjectStore((s) => s.error)
  const setError = useProjectStore((s) => s.setError)

  const undoStack = useCanvasStore((s) => s.undoStack)
  const redoStack = useCanvasStore((s) => s.redoStack)
  const undo = useCanvasStore((s) => s.undo)
  const redo = useCanvasStore((s) => s.redo)

  if (!project) return null

  return (
    <>
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-background px-4 text-sm">
        <div className="flex items-center gap-1 overflow-hidden">
          <span className="font-medium truncate">{project.name}</span>
          {activeCpmFile && (
            <span className="text-muted-foreground truncate">
              {' · '}
              {activeCpmFile}
            </span>
          )}
          {dirty && (
            <span className="text-muted-foreground shrink-0"> — modified</span>
          )}
          <div className="ml-2 flex items-center gap-0.5 shrink-0">
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 size={14} />
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          Close Project
        </button>
      </div>
      {error && (
        <div className="flex items-center justify-between border-b border-destructive/50 bg-destructive/10 px-4 py-2 text-sm">
          <span className="text-destructive-foreground">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  )
}
