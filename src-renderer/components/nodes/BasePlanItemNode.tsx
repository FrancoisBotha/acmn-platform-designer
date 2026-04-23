import { memo } from 'react'
import { Position, type NodeProps } from '@xyflow/react'
import type { LucideIcon } from 'lucide-react'
import AcmnHandle from '@/components/AcmnHandle'
import { acmnElementTypeMap } from '@/lib/acmnElementTypes'

interface BasePlanItemNodeProps {
  nodeProps: NodeProps
  icon: LucideIcon
  colorClasses: {
    border: string
    bg: string
    iconText: string
  }
}

function BasePlanItemNode({ nodeProps, icon: Icon, colorClasses }: BasePlanItemNodeProps) {
  const label = (nodeProps.data.label as string) ?? 'Node'
  const elementTypeId = nodeProps.data.elementType as string
  const elementType = elementTypeId ? acmnElementTypeMap.get(elementTypeId) : undefined
  const ports = elementType?.ports ?? []

  const inputPorts = ports.filter((p) => p.direction === 'input')
  const outputPorts = ports.filter((p) => p.direction === 'output')

  return (
    <div className={`rounded-lg border-2 bg-card px-3 py-2 shadow-sm min-w-[120px] ${colorClasses.border} ${colorClasses.bg}`}>
      {inputPorts.map((port, i) => (
        <AcmnHandle
          key={port.id}
          type="target"
          position={Position.Left}
          id={port.id}
          style={inputPorts.length > 1 ? { top: `${((i + 1) / (inputPorts.length + 1)) * 100}%` } : undefined}
        />
      ))}
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${colorClasses.iconText}`} />
        <span className="text-xs font-medium truncate text-slate-900">{label}</span>
      </div>
      {outputPorts.map((port, i) => (
        <AcmnHandle
          key={port.id}
          type="source"
          position={Position.Right}
          id={port.id}
          style={outputPorts.length > 1 ? { top: `${((i + 1) / (outputPorts.length + 1)) * 100}%` } : undefined}
        />
      ))}
    </div>
  )
}

export default memo(BasePlanItemNode)
