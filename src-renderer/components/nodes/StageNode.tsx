import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Layers } from 'lucide-react'

function StageNode({ data }: NodeProps) {
  const label = (data.label as string) ?? 'Stage'

  return (
    <div className="rounded-lg border-2 border-amber-500 bg-amber-50 shadow-sm min-w-[300px] min-h-[200px]">
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-amber-300">
        <Layers className="h-4 w-4 shrink-0 text-amber-600" />
        <span className="text-xs font-semibold text-amber-800">{label}</span>
      </div>
      <div className="p-4" />
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
    </div>
  )
}

export default memo(StageNode)
