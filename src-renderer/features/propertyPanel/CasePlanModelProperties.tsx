import { useCanvasStore } from '@/state/canvasStore'

interface CasePlanModelPropertiesProps {
  onOpenVariablesEditor: () => void
}

export function CasePlanModelProperties({ onOpenVariablesEditor }: CasePlanModelPropertiesProps) {
  const variableCount = useCanvasStore((s) => s.caseVariables.length)

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Case Plan Model</p>
      <div>
        <button
          onClick={onOpenVariablesEditor}
          className="w-full rounded-md border border-border px-3 py-2 text-sm text-left transition-colors hover:bg-secondary flex items-center justify-between"
        >
          <span>Case variables</span>
          <span className="text-xs text-muted-foreground">{variableCount}</span>
        </button>
      </div>
    </div>
  )
}
