import { memo } from 'react'
import { Position, type NodeProps } from '@xyflow/react'
import { Layers } from 'lucide-react'
import AcmnHandle from '@/components/AcmnHandle'

function StageNode({ data }: NodeProps) {
  const label = (data.label as string) ?? 'Stage'

  return (
    <div className="rounded-lg border-2 border-amber-500 bg-amber-50 shadow-sm min-w-[300px] min-h-[200px]">
      <AcmnHandle type="target" position={Position.Left} id="case-file-in" />
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-amber-300">
        <Layers className="h-4 w-4 shrink-0 text-amber-600" />
        <span className="text-xs font-semibold text-amber-800">{label}</span>
      </div>
      <div className="p-4" />
      <AcmnHandle type="source" position={Position.Right} id="case-file-out" />
    </div>
  )
}

export default memo(StageNode)
