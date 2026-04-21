import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Cog } from 'lucide-react'
import BasePlanItemNode from './BasePlanItemNode'

function ProcessTaskNode(props: NodeProps) {
  return (
    <BasePlanItemNode
      nodeProps={props}
      icon={Cog}
      colorClasses={{
        border: 'border-blue-500',
        bg: 'bg-blue-50',
        iconText: 'text-blue-600',
      }}
    />
  )
}

export default memo(ProcessTaskNode)
