import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { UserCheck } from 'lucide-react'
import BasePlanItemNode from './BasePlanItemNode'

function HumanTaskNode(props: NodeProps) {
  return (
    <BasePlanItemNode
      nodeProps={props}
      icon={UserCheck}
      colorClasses={{
        border: 'border-orange-500',
        bg: 'bg-orange-50',
        iconText: 'text-orange-600',
      }}
    />
  )
}

export default memo(HumanTaskNode)
