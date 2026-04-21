import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { acmnElementTypeMap } from '@/lib/acmnElementTypes'

function DefaultNode({ data }: NodeProps) {
  const elementType = acmnElementTypeMap.get(data.elementType as string)
  const Icon = elementType?.icon
  const label = (data.label as string) ?? elementType?.label ?? 'Node'
  const color = elementType?.defaultColor ?? '#64748b'

  return (
    <div
      className="rounded-lg border-2 bg-card px-3 py-2 shadow-sm min-w-[120px]"
      style={{ borderColor: color }}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 shrink-0" style={{ color }} />}
        <span className="text-xs font-medium truncate">{label}</span>
      </div>
    </div>
  )
}

export default memo(DefaultNode)
