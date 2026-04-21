import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Bot } from 'lucide-react'
import BasePlanItemNode from './BasePlanItemNode'

function AgentNode(props: NodeProps) {
  return (
    <BasePlanItemNode
      nodeProps={props}
      icon={Bot}
      colorClasses={{
        border: 'border-purple-500',
        bg: 'bg-purple-50',
        iconText: 'text-purple-600',
      }}
    />
  )
}

export default memo(AgentNode)
