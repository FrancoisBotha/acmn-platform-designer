import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { ArrowLeftRight } from 'lucide-react'
import BasePlanItemNode from './BasePlanItemNode'

function HandoffNode(props: NodeProps) {
  return (
    <BasePlanItemNode
      nodeProps={props}
      icon={ArrowLeftRight}
      colorClasses={{
        border: 'border-pink-500',
        bg: 'bg-pink-50',
        iconText: 'text-pink-600',
      }}
    />
  )
}

export default memo(HandoffNode)
