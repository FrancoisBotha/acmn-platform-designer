import { useCanvasStore } from '@/state/canvasStore'

export function SelectionBadge() {
  const selectedCount = useCanvasStore((s) => s.nodes.filter((n) => n.selected).length)

  if (selectedCount < 2) return null

  return (
    <div className="absolute top-3 right-3 z-10 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-md">
      {selectedCount} selected
    </div>
  )
}
