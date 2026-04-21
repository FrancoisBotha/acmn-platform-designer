import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Wrench } from 'lucide-react'
import BasePlanItemNode from './BasePlanItemNode'

function ToolNode(props: NodeProps) {
  return (
    <BasePlanItemNode
      nodeProps={props}
      icon={Wrench}
      colorClasses={{
        border: 'border-green-500',
        bg: 'bg-green-50',
        iconText: 'text-green-600',
      }}
    />
  )
}

export default memo(ToolNode)
