import { memo, type ReactNode } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { LucideIcon } from 'lucide-react'

interface BasePlanItemNodeProps {
  nodeProps: NodeProps
  icon: LucideIcon
  colorClasses: {
    border: string
    bg: string
    iconText: string
  }
  handles?: ReactNode
}

function BasePlanItemNode({ nodeProps, icon: Icon, colorClasses, handles }: BasePlanItemNodeProps) {
  const label = (nodeProps.data.label as string) ?? 'Node'

  return (
    <div className={`rounded-lg border-2 bg-card px-3 py-2 shadow-sm min-w-[120px] ${colorClasses.border} ${colorClasses.bg}`}>
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${colorClasses.iconText}`} />
        <span className="text-xs font-medium truncate">{label}</span>
      </div>
      {handles ?? <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />}
    </div>
  )
}

export default memo(BasePlanItemNode)
