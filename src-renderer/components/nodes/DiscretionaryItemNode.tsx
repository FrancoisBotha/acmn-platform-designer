import { memo } from 'react'
import { Position, type NodeProps } from '@xyflow/react'
import { acmnElementTypeMap } from '@/lib/acmnElementTypes'
import AcmnHandle from '@/components/AcmnHandle'

function DiscretionaryItemNode({ data }: NodeProps) {
  const elementType = acmnElementTypeMap.get(data.elementType as string)
  const Icon = elementType?.icon
  const label = (data.label as string) ?? 'Discretionary Item'

  return (
    <div className="rounded-lg border-2 border-dashed border-amber-500 bg-amber-50/50 px-3 py-2 shadow-sm min-w-[120px]">
      <AcmnHandle type="target" position={Position.Left} id="data-in" />
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-amber-600" />}
        <span className="text-xs font-medium text-amber-800 truncate">{label}</span>
      </div>
      <AcmnHandle type="source" position={Position.Right} id="data-out" />
    </div>
  )
}

export default memo(DiscretionaryItemNode)
